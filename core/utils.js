const log4js = require("log4js");

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

module.exports = {getLogger}