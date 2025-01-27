const express = require('express');
const bodyParser = require('body-parser');
const {getLogger} = require("../utils");
const app = express();
const port = 3000;

logger = getLogger();

function handleEvents(req, res){
    const data = req.body;
    let validationResponse  = validateEventGrid(req);
    if (validationResponse ){
        res.status(200).json(validationResponse)
        return;
    }
    logger.info("Received event:", data);
    processEvent(data)
    res.status(200).send({ success: true });
}

function validateEventGrid(req) {
    if (req.headers['aeg-event-type'] === 'SubscriptionValidation') {
        let validationEvent = req.body[0];
        let validationCode = validationEvent.data.validationCode;
        return {validationResponse: validationCode};
    }
    return null;
}

function processEvent(data){
    logger.info("Received analytics data:", data);
}

function startEventGridListener(){
    app.use(bodyParser.json());
    app.post('/subscribe/candles/analytics', (handleEvents));
    app.listen(port, () => {console.log(`Server is running on port ${port}`);});
}

module.exports = {startEventGridListener}
