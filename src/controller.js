const nano = require('nanomsg')
const { spawn } = require("node:child_process");
const path = require("node:path");
const coinbase = require("./coinbase_wrapper");
const utils = require('./utils');

let logger = utils.getLogger();

/**
 * Open the Analytics Socket for IPC with the analytics transceiver
 * @returns socket to use in transceiver communication
 */
function openAnalyticsSocket() {
    var pairSocket = nano.socket('pair');
    var address = "ipc:///config/communication.icp"
    pairSocket.connect(address);
    return pairSocket;
}

/**
 * Sends load to traceiver
 * @param {*} load - load to send
 * @param {*} socket - socket to send on
 */
function sendLoad(load, socket) {
    const serialisedLoad = JSON.stringify(load)
    socket.send(serialisedLoad);
    logger.info("CONTROLLER SENT MESSAGE WITH ID: " + load['id'])
}

/**
 * Proccesses messages received from transceiver
 * @param {*} load - load received to be processed
 */
function processMessages(load){
    logger.info("CONTROLLER RECEIVED LOAD WITH ID: %d", JSON.parse(load).id);
}

function activateAnalyticsTransceiver(){
    // Spawning Analytics child process 
    const python = path.join(__dirname.toString(), '..', 'venv', 'Scripts', 'python.exe');
    const technicalAnalyticsScript = path.join(__dirname.toString(), '..', 'analytics', 'transceiver.py');
    const analyticsTransceiverProcess = spawn(python, [technicalAnalyticsScript]);

    // Initialise connection to Analytics process, and configure response handling and child process logging
    const analyticsSocket = openAnalyticsSocket();
    analyticsSocket.on("data", processMessages);
    analyticsTransceiverProcess.stdout.on('data', (data) => {console.log("%s", data)} );
    return analyticsSocket;
}

function analyseHistoricalData(){
    let analyticsSocket = activateAnalyticsTransceiver();
    coinbase.getProductCandles("BTC-USD", 900).then(
        candlesData => sendLoad({message: JSON.stringify(candlesData), id: 13}, analyticsSocket)
    );
}

module.exports = {analyseHistoricalData}