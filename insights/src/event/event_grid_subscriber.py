import time
import threading
import queue
from flask import request, jsonify
import utils
from event.data_preprocessor import dict_to_product_candle, DataPreprocessor
from analytics.candle_technical_indicators import update_technical_indicators, update_technical_indicators_batch
from event.model.EventType import EventType

_logger = utils.get_logger("Insights")

BUFFER_SIZE_THRESHOLD = 10
DELAY_THRESHOLD = 5
WORKER_THREAD_COUNT = 6

# Shared in-memory structures
buffer_store = {}
buffer_lock = threading.Lock()
candle_event_queue = queue.Queue()
candle_store = {}  # NEW: shared across all threads

def handle_events():
    try:
        validation_response = validate_event_grid(request)
        if validation_response:
            return validation_response

        events = request.get_json()
        now = time.time()

        with buffer_lock:
            for event in events:
                event_id = event.get('id')
                event_type = event.get('eventType')
                if not event_id or not event_type:
                    _logger.error(f"Invalid event: {event}")
                    continue

                event['received_at'] = now

                if event_type == EventType.CANDLE:
                    buffer_store[event_id] = event
                    flushed = flush_buffer(now)
                    if flushed:
                        candle_event_queue.put(flushed)

                elif event_type == EventType.HISTORICAL_CANDLE:
                    _logger.info(f"Immediate processing: skipping buffer for batched event [Event I.D: {event_id}]")
                    threading.Thread(target=process_batched_event, args=(event,), daemon=True).start()

                else:
                    _logger.info(f"Unexpected event type [EventType: {event_type}, Event I.D: {event_id}]")

        return jsonify({"message": "Events handled."}), 200

    except Exception as e:
        _logger.exception(f"Exception handling event: {e}")
        return jsonify({"error": str(e)}), 400

def validate_event_grid(req):
    if req.headers.get('aeg-event-type') == 'SubscriptionValidation':
        validation_event = req.get_json()[0]
        validation_code = validation_event['data']['validationCode']
        return jsonify({'validationResponse': validation_code})
    return None

def flush_buffer(now):
    if not buffer_store:
        return None

    sorted_ids = sorted(buffer_store.keys())
    _logger.debug(f"Buffer size: {len(buffer_store)}. Sorted IDs: {sorted_ids}")

    for event_id in sorted_ids:
        event = buffer_store.get(event_id)
        if not event:
            continue
        if now - event['received_at'] >= DELAY_THRESHOLD:
            _logger.info(f"Flushing event [EventId: {event_id}] due to time delay")
            del buffer_store[event_id]
            return event

    if len(buffer_store) >= BUFFER_SIZE_THRESHOLD:
        oldest_id = sorted_ids[0]
        event = buffer_store.pop(oldest_id, None)
        if event:
            _logger.info(f"Flushing event [EventId: {oldest_id}] due to buffer size limit")
            return event

    return None

def process_ordered_event_worker():
    while True:
        event = candle_event_queue.get()
        try:
            data = event.get('data')
            event_id = event.get('id')
            _logger.info(f"[Worker] Processing CANDLE event [EventId: {event_id}]")
            product_candle = dict_to_product_candle(data)
            analysis = update_technical_indicators(product_candle, candle_store)
            DataPreprocessor().eventise_product_candle_analysis(event_id, analysis)
        except Exception as e:
            _logger.exception(f"[Worker] Failed to process CANDLE event: {e}")
        finally:
            candle_event_queue.task_done()

def process_batched_event(event):
    try:
        data = event.get('data')
        event_id = event.get('id')
        _logger.info(f"Processing {len(data)} HISTORICAL_CANDLE entries [EventId: {event_id}]")

        data_iterable = data if isinstance(data, list) else data.values()
        candles = [dict_to_product_candle(c) for c in data_iterable]
        batch = update_technical_indicators_batch(candles, candle_store)
        DataPreprocessor().eventise_product_candle_analysis_batch(event_id, batch)

    except Exception as e:
        _logger.exception(f"Exception in HISTORICAL_CANDLE event processing: {e}")

def start_candle_event_workers():
    for i in range(WORKER_THREAD_COUNT):
        thread = threading.Thread(target=process_ordered_event_worker, daemon=True)
        thread.start()
        _logger.info(f"Started worker thread #{i+1} for handling candle data events")

start_candle_event_workers()
