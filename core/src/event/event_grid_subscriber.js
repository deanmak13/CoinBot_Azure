const express = require('express');
const bodyParser = require('body-parser');
const {getLogger} = require("../utils");
const utils = require("../utils");
const app = express();
const port = 3000;

logger = getLogger();

function handleEvents(req, res){
    console.log("HANDLING EVENTTT OVER HERE")
    try{
        const data = req.body;
        let validationResponse  = validateEventGrid(req);
        if (validationResponse ){
            res.status(200).json(validationResponse)
            return;
        }
        logger.info("Received event:", data);
        processEvent(data)
        res.status(200).send({ success: true });
    } catch (error) {
        logger.error(`Error handling event: ${error}`);
        res.status(400).send({ success: false });
    }
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

async function startEventGridListener(){
    app.use(bodyParser.json());
    let candleAnalyticsSubEndPoint = utils.getConfig("candle_analytics", "events.yaml")['event_grid.subscription_endpoint'];
    app.post(candleAnalyticsSubEndPoint, (handleEvents));
    app.listen(port, () => {logger.info(`EventGridSubscriber subscribed to endpoint: ${candleAnalyticsSubEndPoint}`);});
}

module.exports = {startEventGridListener}
