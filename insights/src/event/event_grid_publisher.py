import os

from azure.identity import DefaultAzureCredential
from azure.eventgrid import EventGridPublisherClient
import datetime
import utils

_logger = utils.get_logger("Insights")

class EventGridPublisherClientFactory:
    _instances = {}
    _event_schema = "EventGrid"
    _endpoint = os.getenv('EVENT_GRID_TOPIC_URL')

    def get_client(cls, data_type):
        if data_type not in cls._instances:
            cls._instances[data_type] = EventGridPublisherClient(cls._endpoint, DefaultAzureCredential())
        return cls._instances[data_type]

def create_event(event_id, event_type, subject, data):
    return {"id": event_id, "eventType": event_type, "data": data, "dataVersion": "1.0", "subject": subject, "eventTime": datetime.date.today().isoformat()}

async def publish_event(event):
    publisher_client = EventGridPublisherClientFactory.get_client("candle")
    try:
        await publisher_client.send([event])
        _logger.info(f"EventType:{event["eventType"]},EventID:{event["id"]} - event published successfully.")
    except Exception as err:
        _logger.error(f"EventType:{event["eventType"]},EventID:{event["id"]} - error publishing event: {err}")
