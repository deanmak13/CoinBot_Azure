from flask import request, jsonify

import utils
from event.data_preprocessor import dict_to_product_candle
from analytics.candle_technical_indicators import update_technical_indicators
from utils import get_config

_logger = utils.get_logger("Insights")


def handle_events():
    try:
        validation_response = validate_event_grid(request)
        if validation_response:
            return validation_response  # Early exit if validation is needed

        # Parse the Event Grid events
        print("Attempting to get JSON from request in handle_events")
        events = request.get_json()

        process_event(events)

        return jsonify({"message": "Events processed successfully."}), 200

    except Exception as e:
        print(f"Error handling event: {e}")
        return jsonify({"error": str(e)}), 400


def validate_event_grid(request):
    # Handle Event Grid validation
    if request.headers.get('aeg-event-type') == 'SubscriptionValidation':
        validation_event = request.json[0]
        validation_code = validation_event['data']['validationCode']
        return jsonify({'validationResponse': validation_code})  # Ensure the response is correct
    # Handle other events
    return None


def process_event(events):
    for event in events:
        data = event.get('data')
        match event.get('eventType'):
            case EventType.CANDLE:
                _logger.info(f"Processing {EventType.CANDLE} event type. [Event I.D: {event.get('id')}]")
                print(f"Processing current data: {data}")
                product_candle = dict_to_product_candle(data)
                update_technical_indicators(product_candle)
            case _:
                print("Handling a general event...")


class EventType:
    CANDLE = get_config("candles", "events.yaml")['event_grid.event_type']