import json
from google.protobuf import json_format
from flask import request, jsonify
from grpc.gen.coinbase.v1.coinbase_products_pb2 import ProductCandle
from analytics.candle_technical_indicators import updateTechnicalIndicators
from utils import get_config


def handle_events():
    try:
        validation_response = validate_event_grid(request)
        if validation_response:
            return validation_response  # Early exit if validation is needed

        # Parse the Event Grid events
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
    for event in events:  # Process each event if there are multiple
        data = event.get('data')
        match event.get('eventType'):
            case EventType.CANDLE:
                print(f"Processing {EventType.CANDLE} event type. [Event I.D: {event.get('id')}]")
                if isinstance(data, list):
                    data = bytes(data)
                product_candle = ProductCandle().ParseFromString(data)
                print(product_candle)
                updateTechnicalIndicators(product_candle)
            case _:
                print("Handling a general event...")


class EventType:
    CANDLE = get_config("candles", "events.yaml")['event_grid.event_type']