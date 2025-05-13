CREATE TABLE candle (
    id TEXT NOT NULL,
    time INTEGER NOT NULL,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    close REAL NOT NULL,
    volume REAL NOT NULL,

    SMA REAL,
    WMA REAL,
    EMA REAL,
    RSI REAL,
    ROC REAL,
    MOM REAL,
    MFI REAL,

    MACD REAL,
    MACD_History REAL,
    MACD_Signal REAL,

    KAMA REAL,

    Hammer INTEGER,
    Engulfing INTEGER,

    BBAND_upper REAL,
    BBAND_middle REAL,
    BBAND_lower REAL,

    PRIMARY KEY (id, time)
);

CREATE INDEX idx_candle_time ON candle(time);

CREATE TABLE candle_db_metrics (
   id TEXT NOT NULL,
   time INTEGER NOT NULL,
   count INTEGER,
   earliestTime INTEGER,
   latestTime INTEGER,
   db_entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (id, time)
);

CREATE TRIGGER insert_into_candle_db_metrics
    AFTER INSERT ON candle
BEGIN
    -- Insert if not exists
    INSERT OR IGNORE INTO candle_db_metrics (
        id, time, count, earliestTime, latestTime
    ) VALUES (
                 NEW.id,
                 NEW.time,
                 (SELECT COUNT(*) FROM candle WHERE id = NEW.id AND time = NEW.time),
                 (SELECT MIN(time) FROM candle WHERE id = NEW.id),
                 (SELECT MAX(time) FROM candle WHERE id = NEW.id)
             );

    -- Update if exists
    UPDATE candle_db_metrics
    SET
        count = (SELECT COUNT(*) FROM candle WHERE id = NEW.id AND time = NEW.time),
        earliestTime = (SELECT MIN(time) FROM candle WHERE id = NEW.id),
        latestTime = (SELECT MAX(time) FROM candle WHERE id = NEW.id)
    WHERE id = NEW.id AND time = NEW.time;
END;

CREATE TABLE trigger_log (
    id TEXT,
    new_time INTEGER,
    old_time INTEGER,
    event TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER purge_data_after_insert
    AFTER INSERT ON candle
BEGIN
    -- Log rows being purged (based on db_entry_time)
    INSERT INTO trigger_log (id, new_time, old_time, event)
    SELECT NEW.id, NEW.time, m.db_entry_time, 'purge_data_after_insert fired'
    FROM candle_db_metrics m
    WHERE m.id = NEW.id AND m.time = NEW.time
      AND (strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', m.db_entry_time)) > 168 * 3600;

    -- Delete from candle (if metrics entry confirms expiration)
    DELETE FROM candle
    WHERE id = NEW.id
      AND time = NEW.time
      AND EXISTS (
        SELECT 1 FROM candle_db_metrics
        WHERE id = NEW.id AND time = NEW.time
          AND (strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', db_entry_time)) > 168 * 3600
    );

    -- Delete corresponding metrics row
    DELETE FROM candle_db_metrics
    WHERE id = NEW.id
      AND time = NEW.time
      AND (strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', db_entry_time)) > 168 * 3600;
END;

CREATE TRIGGER purge_data_after_update
    AFTER UPDATE ON candle
BEGIN
    -- Log rows being purged (based on db_entry_time)
    INSERT INTO trigger_log (id, new_time, old_time, event)
    SELECT NEW.id, NEW.time, m.db_entry_time, 'purge_data_after_update fired'
    FROM candle_db_metrics m
    WHERE m.id = NEW.id AND m.time = NEW.time
      AND (strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', m.db_entry_time)) > 168 * 3600;

    -- Delete from candle
    DELETE FROM candle
    WHERE id = NEW.id
      AND time = NEW.time
      AND EXISTS (
        SELECT 1 FROM candle_db_metrics
        WHERE id = NEW.id AND time = NEW.time
          AND (strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', db_entry_time)) > 168 * 3600
    );

    -- Delete from candle_db_metrics
    DELETE FROM candle_db_metrics
    WHERE id = NEW.id
      AND time = NEW.time
      AND (strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', db_entry_time)) > 168 * 3600;
END;
