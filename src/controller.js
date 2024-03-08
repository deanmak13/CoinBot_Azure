const nano = require('nanomsg')
const { spawn } = require("node:child_process");
const path = require("node:path");

// Spawning Analytics child process 
const python = path.join(__dirname.toString(), '..', 'venv', 'Scripts', 'python.exe');
const technicalAnalyticsScript = path.join(__dirname.toString(), '..', 'analytics', 'transceiver.py');
const analyticsTransceiverProcess = spawn(python, [technicalAnalyticsScript]);

//// SETTING UP IPC
function initialiseAnalyticsSocket() {
    var pairSocket = nano.socket('pair');
    var address = "ipc:///config/communication.icp"
    console.log(address);
    pairSocket.bind(address);
    return pairSocket;
}

function sendLoad(load, socket) {
    const serialisedLoad = JSON.stringify(load)
    socket.send(serialisedLoad);
    console.log("SENT MESSAGE WITH ID: " + load['id'])
}

function processMessages(data){
    console.log("THIS IS RECEIVED FROM PYTHON: %s", JSON.parse(data));
}

controllerSocket = initialiseAnalyticsSocket();
controllerSocket.addListener("data", processMessages);
analyticsTransceiverProcess.stdout.on('data', (data) => {console.log("%s", data)} );
const load = {message: "I AM ZAKAI", id: 13};
sendLoad(load, controllerSocket)
