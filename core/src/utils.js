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
    // Check if running inside Docker by reading an environment variable
    const sharedConfigDir = process.env.SHARED_DIR || './config';  // default to local for testing
    const config = yaml.load(fs.readFileSync(`${sharedConfigDir}/${configFile}`, 'utf8'));
    return config[configName];
}

const GRPC_COMMUNICATION_CHANNEL = loadYamlConfig('communication_channel', 'grpc.yaml');


module.exports = {loadYamlConfig, getLogger, GRPC_COMMUNICATION_CHANNEL}