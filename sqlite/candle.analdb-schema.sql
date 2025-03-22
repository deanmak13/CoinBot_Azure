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
    -- Log each row that will be deleted
    INSERT INTO trigger_log (id, new_time, old_time, event)
    SELECT NEW.id, NEW.time, time, 'purge_data_after_insert fired'
    FROM candle
    WHERE id = NEW.id
      AND NEW.time - time > 24 * 3600;

    -- Delete each row older than 24hrs
    DELETE FROM candle
    WHERE candle.id = NEW.id
      AND NEW.time - candle.time > 24 * 3600;
END;

CREATE TRIGGER purge_data_after_update
    AFTER UPDATE ON candle
BEGIN
    -- Log each row that will be deleted
    INSERT INTO trigger_log (id, new_time, old_time, event)
    SELECT NEW.id, NEW.time, time, 'purge_data_after_update fired'
    FROM candle
    WHERE id = NEW.id
      AND NEW.time - time > 24 * 3600;

    -- Delete each row that is older than 24hrs
    DELETE FROM candle
    WHERE candle.id = NEW.id
      AND NEW.time - candle.time > 24 * 3600;
END;
