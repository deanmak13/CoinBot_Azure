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
        const columns = Object.keys(analyticsData);
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
 * Reads all rows from the 'candle' table.
 * @returns {Array<Object>} - Array of candle rows.
 */
function readDBAnalytics(ticker, startTime){
    try {
        const sql = DB.prepare("SELECT * FROM candle WHERE id = ? AND time > ? ORDER BY time ASC");
        const result = sql.all(ticker, startTime);
        return collapseObjectArrayToValueListObject(result);
    } catch (e) {
        logger.error(`Failed to read candle analytics from database: ${e}`);
    }
}

/**
 * Reads all rows from the 'candle' table.
 * @returns {{count, earliestTime, latestTime}} - Object of analytics metrics
 */
function readDBAnalyticsMetrics(ticker, startTime){
    try {
        const sql = DB.prepare("SELECT count(*) as count, MIN(time) as earliestTime, MAX(time) as latestTime FROM candle WHERE id = ? AND time > ? ORDER BY time ASC");
        const result = sql.all(ticker, startTime);
        return result[0];
    } catch (e) {
        logger.error(`Failed to read candle analytics from database: ${e}`);
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

module.exports = {insertDBAnalytics, readDBAnalytics, readDBAnalyticsMetrics}
