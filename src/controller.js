const nano = require('nanomsg')
const { spawn } = require("node:child_process");
const path = require("node:path");

// Spawning Analytics child process 
const python = path.join(__dirname.toString(), '..', 'venv', 'Scripts', 'python.exe');
const technicalAnalyticsScript = path.join(__dirname.toString(), '..', 'analytics', 'transceiver.py');
const analyticsTransceiverProcess = spawn(python, [technicalAnalyticsScript]);

//// SETTING UP IPC
/**
 * Initialised the Analytics Socket for TPC with the analytics transceiver
 * @returns socket to use in transceiver communication
 */
function initialiseAnalyticsSocket() {
    var pairSocket = nano.socket('pair');
    var address = "ipc:///config/communication.icp"
    console.log(address);
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
    console.log("SENT MESSAGE WITH ID: " + load['id'])
}

/**
 * Proccesses messages received from transceiver
 * @param {*} load - load received to be processed
 */
function processMessages(load){
    console.log("Received some response..")
    console.log("THIS IS RECEIVED FROM PYTHON: %s", JSON.parse(load));
}

const controllerSocket = initialiseAnalyticsSocket();
controllerSocket.on("data", processMessages);
analyticsTransceiverProcess.stdout.on('data', (data) => {console.log("%s", data)} );
sendLoad({message: "I AM ZAKAI", id: 13}, controllerSocket)
