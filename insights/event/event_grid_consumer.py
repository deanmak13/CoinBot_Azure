import json
from azure.eventgrid import EventGridConsumer
from flask import Flask, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# Create an EventGridConsumer instance
event_grid_consumer = EventGridConsumer()

@app.route('/event-handler', methods=['POST'])
def handle_event():
    # Extract the request body
    body = request.get_data(as_text=True)
    try:
        # Parse the Event Grid events
        events = event_grid_consumer.decode_eventgrid_events(body)
        
        for event in events:
            print("Processing event...")
            print(f"ID: {event.id}")
            print(f"Event Type: {event.event_type}")
            print(f"Data: {json.dumps(event.data)}")
            print(f"Subject: {event.subject}")
            print(f"Event Time: {event.event_time}")
            
            # Add your custom logic to handle the event data
            process_event(event)

        return jsonify({"message": "Events processed successfully."}), 200

    except Exception as e:
        print(f"Error handling event: {e}")
        return jsonify({"error": str(e)}), 400

def process_event(event):
    # Placeholder for custom event processing logic
    # Example: handle specific event types differently
    if event.event_type == "Specific.Event.Type":
        print("Handling a specific event type...")
    else:
        print("Handling a general event...")

if __name__ == "__main__":
    app.run(port=5000, debug=True)
