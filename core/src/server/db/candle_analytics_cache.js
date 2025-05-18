const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const utils = require('../utils');

const logger = utils.getLogger();

let dbPath;
let database ;

try {
    logger.info("Initialising Candle Analytics Caching database")
    dbPath = path.join(__dirname, '..', '..', '..', '..', 'sqlite', 'anal.db');
    database = new DatabaseSync(dbPath);
} catch (e) {
    logger.error('Failed to initialise database:', e);
    process.exit(1);
}

const DB = database;

/**
 * Inserts a row of analytics data into the 'candle' table.
 * @param {Object} analyticsData - An object where keys match candle table columns.
 * @returns {StatementResultingChanges}
 */
function insertDBAnalytics(analyticsData) {
    try{
        const columns = Object.keys(analyticsData).filter(k => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k));
        logger.debug(`Caching candle analytics with [ID: ${analyticsData.id}, time: ${analyticsData.time}]`);
        const placeholders = columns.map(c => `@${c}`).join(', ');
        const sql = DB.prepare(
            `INSERT OR REPLACE INTO candle (${columns.join(', ')}) VALUES (${placeholders})`
        );
        return sql.run(analyticsData);
    } catch (e) {
        logger.error(`Failed to write candle analytics to database: ${e}`);
    }
}

/**
 * Inserts multiple rows of analytics data into the 'candle' table.
 * @param {Array<Object>} analyticsDataArray - Array of analytics objects where keys match candle table columns.
 */
function insertDBAnalyticsBatch(analyticsDataArray) {
    if (!Array.isArray(analyticsDataArray) || analyticsDataArray.length === 0) {
        logger.warn("insertDBAnalyticsBatch called with empty or invalid input.");
        return;
    }

    try {
        const columns = Array.from(
            new Set(
                analyticsDataArray.flatMap(row => Object.keys(row))
                    .filter(k => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k))
            )
        );
        const placeholders = columns.map(c => `@${c}`).join(', ');

        const sql = DB.prepare(
            `INSERT OR REPLACE INTO candle (${columns.join(', ')}) VALUES (${placeholders})`
        );

        // Normalize all rows
        for (const row of analyticsDataArray) {
            for (const col of columns) {
                if (!(col in row)) row[col] = null;
            }
        }

        try {
            DB.exec("BEGIN");
            for (const row of analyticsDataArray) {
                logger.debug(`Batch caching candle with [ID: ${row.id}, time: ${row.time}, granularity_mins: ${row.granularity_mins}]`);
                sql.run(row);
            }
            DB.exec("COMMIT");
        } catch (err) {
            DB.exec("ROLLBACK");
            logger.error("Failed to batch write candle analytics to database:", err);
        }
    } catch (e) {
        logger.error(`Failed to batch write candle analytics to database: ${e}`);
    }
}


/**
 * Reads all rows from the 'candle' table.
 * @returns {{}} - Array of candle rows.
 */
function readDBAnalytics(ticker, startTime, granularityMins){
    try {
        if (!ticker || typeof ticker !== 'string') {
            logger.warn("readDBAnalytics called with invalid ticker:", ticker);
            return {};
        }
        if (!granularityMins){
            granularityMins=5;
        }

        const sql = DB.prepare("SELECT * FROM candle WHERE id = ? AND time > ? AND granularity_mins = ? ORDER BY time ASC");
        const result = sql.all(ticker, startTime, granularityMins);

        if (result.length === 0){
            return {}
        }

        return collapseObjectArrayToValueListObject(result);
    } catch (e) {
        logger.error(`Failed to read candle analytics from database: ${e}`);
    }
}

/**
 * Reads all rows from the 'candle' table.
 * @returns {Record<string, number | bigint | string | Uint8Array>|{}} - Object of analytics metrics
 */
function readDBAnalyticsMetrics(ticker, startTime, granularityMins){
    try {
        if (!ticker || typeof ticker !== 'string') {
            logger.warn("readDBAnalyticsMetrics called with invalid ticker:", ticker);
            return {};
        }
        if (!granularityMins){
            logger.warn("readDBAnalyticsMetrics default to 5 Mins as it was not set");
            granularityMins=5;
        }

        const sql = DB.prepare(`
            SELECT count, earliestTime, latestTime 
            FROM candle_db_metrics 
            WHERE id = ? AND granularity_mins = ?
        `);
        const result = sql.get(ticker, granularityMins);

        return result || {};
    } catch (e) {
        logger.error(`Failed to read candle analytics metrics from database: ${e}`);
        return {}
    }
}

/**
 * transform data from [ { id: 1, column1: 'hello' }, { id: 2, column1: 'world' } ]
 * to {id: [1, 2], column1: ['hello', 'world']}
 * @returns {Object}
 */
function collapseObjectArrayToValueListObject(results) {
    return results.reduce((acc, cur) => {
        for (const [key, value] of Object.entries(cur)) {
            if (!acc[key]) acc[key] = [];
            acc[key].push(value);
        }
        return acc;
    }, {});
}

module.exports = {insertDBAnalytics, insertDBAnalyticsBatch, readDBAnalytics, readDBAnalyticsMetrics}
