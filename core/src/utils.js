const log4js = require("log4js");
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

function getLogger(){
    log4js.configure({
        appenders: {
            console: {
                type: 'console',
                layout: {
                    type: "pattern",
                    pattern: '%d{ISO8601} - %c - [%p] - %m'
                }
            },
            file: {
                type: 'file',
                filename: path.join('../home/LogFiles', 'app.log'), // Adjust this path for Windows: 'D:\\home\\LogFiles\\app.log'
                layout: {
                    type: "pattern",
                    pattern: '%d{ISO8601} - %c - [%p] - %m'
                }
            }
        },
        categories: {
            default: { appenders: ['console', 'file'], level: 'info' },
            MainService: { appenders: ['console', 'file'], level: 'info' }
        }
    });
    return log4js.getLogger('Core');}

function getConfig(configName, configFile) {
    const config = yaml.load(fs.readFileSync(`./config/${configFile}`, 'utf8'));
    return config[configName];
}

const GRPC_COMMUNICATION_CHANNEL = getConfig('communication_channel', 'grpc.yaml');


module.exports = {getConfig, getLogger, GRPC_COMMUNICATION_CHANNEL}