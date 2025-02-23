const utils = require("../utils");
const {broadcastToClients} = require('../websocket/websocket_publisher');

logger = utils.getLogger();

function handleEvents(req, res){
    try{
        const data = req.body;
        let validationResponse  = validateEventGrid(req);
        if (validationResponse ){
            res.status(200).json(validationResponse)
            return;
        }
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
    const event = data[0];
    broadcastToClients(event.data, event.eventType, event.id)
}

module.exports = {handleEvents}
