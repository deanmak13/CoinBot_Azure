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

const GRPC_COMMUNICATION_CHANNEL = getConfig('communication_channel', 'grpc.yaml');


module.exports = {getConfig, getLogger, GRPC_COMMUNICATION_CHANNEL}