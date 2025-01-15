const log4js = require("log4js");
const fs = require('fs');
const yaml = require('js-yaml');

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
        categories: {default: {appenders: ['console'], level: 'info'}, ['MainService']: {appenders: ['console'], level: 'info'}}
    });
    return log4js.getLogger('Core');
}

function loadYamlConfig(configName, configFile) {
    const config = yaml.load(fs.readFileSync(`./config/${configFile}`, 'utf8'));
    return config[configName];
}

const GRPC_COMMUNICATION_CHANNEL = loadYamlConfig('communication_channel', 'ipc.yaml');


module.exports = {getLogger, GRPC_COMMUNICATION_CHANNEL}