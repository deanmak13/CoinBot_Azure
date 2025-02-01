import os

from azure.core.credentials import AzureKeyCredential
from azure.eventgrid import EventGridPublisherClient
import datetime
import utils
from dotenv import load_dotenv

load_dotenv()

_logger = utils.get_logger("Insights")

class EventGridPublisherClientFactory:
    _instances = {}
    _event_schema = "EventGrid"
    _topic_url = os.getenv('EVENT_GRID_TOPIC_URL')
    _access_key = os.getenv('EVENT_GRID_ACCESS_KEY')

    @classmethod
    def get_client(cls, data_type):
        if data_type not in cls._instances.keys():
            _logger.info(f"Instantiating {data_type} Analytics EventGridPublisherClient...")
            cls._instances[data_type] = EventGridPublisherClient(cls._topic_url, AzureKeyCredential(cls._access_key))
        return cls._instances[data_type]

def create_event(event_id, event_type, subject, data):
    return {"id": event_id, "eventType": event_type, "data": data, "dataVersion": "1.0", "subject": subject, "eventTime": datetime.date.today().isoformat()}

def publish_event(event):
    publisher_client = EventGridPublisherClientFactory.get_client("candleAnalytics")
    try:
        publisher_client.send([event])
        _logger.info(f"EventType:{event["eventType"]},EventID:{event["id"]} - event published successfully.")
    except Exception as err:
        _logger.error(f"EventType:{event["eventType"]},EventID:{event["id"]} - error publishing event: {err}")
