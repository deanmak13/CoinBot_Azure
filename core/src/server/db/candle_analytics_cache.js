const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const utils = require('../utils');

const logger = utils.getLogger();

const dbPath = path.join(__dirname, '..', '..', '..', '..', 'sqlite', 'anal.db');
const database = new DatabaseSync(dbPath);

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
        const sql = database.prepare(
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
function readDBAnalytics(){
    try {
        const sql = database.prepare(`SELECT * FROM candle ORDER BY candle.time ASC`);
        let result = sql.all();
        return collapseObjectArrayToListValueObject(result);
    } catch (e) {
        logger.error(`Failed to read candle analytics from database: ${e}`);
    }
}

/**
 * transform data from [ { key: 1, value: 'hello' }, { key: 2, value: 'world' } ]
 * to {key: [1, 2], value: ['hello', 'world']}
 * @returns {Object}
 */
function collapseObjectArrayToListValueObject(results) {
    return results.reduce((acc, cur) => {
        for (const [key, value] of Object.entries(cur)) {
            if (!acc[key]) acc[key] = [];
            acc[key].push(value);
        }
        return acc;
    }, {});
}

module.exports = {insertDBAnalytics, readDBAnalytics}
