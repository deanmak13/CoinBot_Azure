from flask import Flask
from event.event_grid_consumer import handle_events

# Initialize Flask app
app = Flask(__name__)

# Register the route
app.add_url_rule('/subscribe/candles', view_func=handle_events, methods=['POST'])

if __name__ == '__main__':
    app.run(debug=True)