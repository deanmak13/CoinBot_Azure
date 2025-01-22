from flask import Flask
from event.event_grid_consumer import handle_candle_events
from utils import get_config

# Initialize Flask app
app = Flask(__name__)

endpoint = get_config("candles", "events.yaml")['event_grid_endpoint']

# Register the route
app.add_url_rule('/subscribe/candles', view_func=handle_candle_events, methods=['POST'])

if __name__ == '__main__':
    app.run(debug=True)
