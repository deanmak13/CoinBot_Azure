const express = require('express');

const app = express();
const port = 1313;

function helloWorld(request, response){
    console.log(request);
    response.send("Hello Zakai!");
}

function initiate(){
    
}

app.get('/', helloWorld);

app.listen(port, initiate);