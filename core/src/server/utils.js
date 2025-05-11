const log4js = require("log4js");
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const utils = require("../client/utils");

function getLogger(){
    log4js.configure({
        appenders: {
            console: {
                type: 'console',
                layout: {
                    type: "pattern",
                    pattern: '%d{ISO8601} - %c - [%p] - %m'
                }
            }
        },
        categories: {
            default: { appenders: ['console'], level: 'info' },
            MainService: { appenders: ['console'], level: 'info' }
        }
    });
    return log4js.getLogger('Core');}

function getConfig(configName, configFile) {
    const configPath = path.join(__dirname, '..', '..', '..', 'config', configFile);
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    return config[configName];
}

function getTimeFromXSecondsAgo(secondsAgo, now = unixNow()) {
    let secondsNow = Math.floor(Date.now() / 1000);
    if (secondsAgo <= 0){
        secondsAgo = secondsNow;
    }
    return secondsNow - secondsAgo;
}

function convertGmtToLocal(timeInSeconds) {
    const utcDate = new Date(timeInSeconds * 1000); // convert to ms
    const offsetMinutes = utcDate.getTimezoneOffset(); // In minutes, negative for GMT+
    return Math.floor((utcDate.getTime() - offsetMinutes * 60 * 1000) / 1000); // back to seconds
}

function convertDynamicTimeRangeToSeconds(value) {
    const match = value.match(/^(\d+)([a-zA-Z]+)$/);
    if (!match) return null;

    const num = parseInt(match[1]);
    const unit = match[2];

    const unitToSeconds = {
        d: 86400,
        w: 7 * 86400,
        mo: 30 * 86400,
        y: 365 * 86400,
    };

    return unitToSeconds[unit] ? num * unitToSeconds[unit] : null;
}

function sleep(milliseconds){
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function unixNow(){
    return Math.floor(Date.now() / 1000)
}


const GRPC_COMMUNICATION_CHANNEL = getConfig('communication_channel', 'grpc.yaml');


module.exports = {convertGmtToLocal, convertDynamicTimeRangeToSeconds, getConfig, getLogger, getTimeFromXSecondsAgo, sleep, unixNow, GRPC_COMMUNICATION_CHANNEL}