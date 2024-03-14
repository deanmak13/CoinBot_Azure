const log4js = require("log4js");

function getLogger(){
    log4js.configure({
        appenders: {console: {type: 'console'}},
        categories: {default: {appenders: ['console'], level: 'info'}}
    });
    return log4js.getLogger();
}

module.exports = {getLogger}