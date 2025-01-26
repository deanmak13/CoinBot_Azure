import json
from google.protobuf import json_format
from flask import request, jsonify
from grpc.gen.conbase_products_pb2 import ProductCandle
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
    candle_event_type = get_config("candles", "events.yaml")['event_grid.event_type']

    for event in events:  # Process each event if there are multiple
        data_dict = json.loads(event.get('data'))
        match event.get('eventType'):
            case candle_event_type:
                print(f"Processing {candle_event_type} event type. [Event I.D: {event.get('id')}] ")
                product_candle = ProductCandle()
                json_format.ParseDict(data_dict, product_candle)
            case _:
                print("Handling a general event...")
