from flask import Flask

import utils
from event.event_grid_subscriber import handle_events
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Register the route
app.add_url_rule(utils.get_config("candle_data", "events.yaml")["event_grid.subscription_endpoint"], view_func=handle_events, methods=['POST'])

if __name__ == '__main__':
    app.run(debug=True)