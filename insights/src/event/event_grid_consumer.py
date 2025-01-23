from utils import get_config
from flask import request, jsonify


def handle_candle_events():
    try:
        # Parse the Event Grid events
        events = request.get_json()
        
        # Log or process the events
        print("Received Event Grid event:", events)

        # Add your custom logic to handle the event data
        process_event(events)

        return jsonify({"message": "Events processed successfully."}), 200

    except Exception as e:
        print(f"Error handling event: {e}")
        return jsonify({"error": str(e)}), 400


def process_event(events):
    event_type = get_config("candles", "events.yaml")['event_type']

    # Placeholder for custom event processing logic
    # Example: handle specific event types differently
    if events.event_type == event_type:
        print(f"Processing {event_type} event type...")
    else:
        print("Handling a general event...")
