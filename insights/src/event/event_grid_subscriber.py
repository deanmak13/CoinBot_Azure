import time
import threading
from flask import request, jsonify
import utils
from event.data_preprocessor import dict_to_product_candle, DataPreprocessor
from analytics.candle_technical_indicators import update_technical_indicators
from event.model.EventType import EventType

_logger = utils.get_logger("Insights")

# Configuration constants
BUFFER_SIZE_THRESHOLD = 10  # Flush if the buffer has at least this many events
DELAY_THRESHOLD = 5  # Seconds to wait before considering an event stale

# Global buffer for events: keys are event IDs (ULID strings), values are event dicts with a 'received_at' timestamp.
buffer_store = {}
buffer_lock = threading.Lock()  # Lock for synchronizing access to buffer_store

def handle_events():
    try:
        validation_response = validate_event_grid(request)
        if validation_response:
            return validation_response  # Early exit if validation is needed

        # Parse the Event Grid events
        events = request.get_json()

        process_event(events)

        return jsonify({"message": "Events handled successfully."}), 200

    except Exception as e:
        _logger.exception(f"Exception encountered handling event: {e}")
        return jsonify({"error": str(e)}), 400

def validate_event_grid(req):
    # Handle Event Grid validation
    if req.headers.get('aeg-event-type') == 'SubscriptionValidation':
        validation_event = req.json[0]
        validation_code = validation_event['data']['validationCode']
        return jsonify({'validationResponse': validation_code})
    return None

def process_event(events):
    global buffer_store
    now = time.time()

    with buffer_lock:
        # Buffer incoming events, tagging each with the current timestamp.
        for event in events:
            event_id = event.get('id')
            if not event_id:
                _logger.error(f"Event missing id: {event}")
                continue
            event['received_at'] = now
            buffer_store[event_id] = event

        # Process flushed events from the buffer based on our criteria. Flush one event per call; subsequent invocations can flush more.
        flushed_event = flush_buffer(now)
        if flushed_event:
            process_ordered_event(flushed_event)

def flush_buffer(now):
    global buffer_store
    if not buffer_store:
        return

    # Sort buffered event IDs lexicographically (ULIDs sort in order of creation)
    sorted_ids = sorted(buffer_store.keys())
    _logger.debug(f"Buffer size: {len(buffer_store)}. Sorted IDs: {sorted_ids}")

    # Option 1: Check for any event that has been waiting longer than the delay threshold.
    for event_id in sorted_ids:
        event = buffer_store.get(event_id)
        if event is None:
            continue  # Skip if it's already been removed
        if now - event['received_at'] >= DELAY_THRESHOLD:
            _logger.info(f"Flushing event from buffer [Event I.D: {event_id}] (time threshold met, waited {(now - event['received_at']):.2f} seconds)")
            del buffer_store[event_id]
            return event

    # Option 2: If no stale event, but the buffer is too large, flush the event with the smallest ID.
    if len(buffer_store) >= BUFFER_SIZE_THRESHOLD:
        oldest_event_id = sorted_ids[0]
        event = buffer_store.get(oldest_event_id)
        if event:
            _logger.info(f"Flushing event from buffer [Event I.D: {oldest_event_id}] (size threshold met, buffer size: {len(buffer_store)})")
            del buffer_store[oldest_event_id]
            return event

def process_ordered_event(event):
    try:
        data = event.get('data')
        event_id = event.get('id')
        match event.get('eventType'):
            case EventType.CANDLE:
                _logger.info(f"Processing {EventType.CANDLE} event type. [Event I.D: {event_id}]")
                product_candle = dict_to_product_candle(data)
                product_candle_analysis = update_technical_indicators(product_candle)
                DataPreprocessor().eventise_product_candle_analysis(event_id, product_candle_analysis)
            case _:
                _logger.info("Handling a general event...")
    except Exception as e:
        _logger.exception(f"Exception encountered processing ordered events: {e}")
