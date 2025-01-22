import json
from utils import get_config
from azure.eventgrid import EventGridConsumerClient
from flask import Flask, request, jsonify

def handle_candle_events():
    try:
        # Parse the Event Grid events
        events = request.get_json()
        
        # Log or process the events
        print("Received Event Grid event:", event_data)

        # Add your custom logic to handle the event data
        process_event(event)

        return jsonify({"message": "Events processed successfully."}), 200

    except Exception as e:
        print(f"Error handling event: {e}")
        return jsonify({"error": str(e)}), 400

def process_event(event):
    event_type = get_config("candles", "events.yaml")['event_type']

    # Placeholder for custom event processing logic
    # Example: handle specific event types differently
    if event.event_type == event_type:
        print(f"Processing {event_type} event type...")
    else:
        print("Handling a general event...")
