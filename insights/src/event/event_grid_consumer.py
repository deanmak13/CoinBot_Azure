from utils import get_config
from flask import request, jsonify


def handle_candle_events():
    try:
        validation_response = validate_event_grid(request)
        if validation_response:
            return validation_response  # Early exit if validation is needed

        # Parse the Event Grid events
        events = request.get_json()

        # Add your custom logic to handle the event data
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
    event_type = get_config("candles", "events.yaml")['event_grid.event_type']

    # Placeholder for custom event processing logic
    # Example: handle specific event types differently
    for event in events:  # Process each event if there are multiple
        if event.get('eventType') == event_type:
            print(f"Processing {event_type} event type...")
        else:
            print("Handling a general event...")
