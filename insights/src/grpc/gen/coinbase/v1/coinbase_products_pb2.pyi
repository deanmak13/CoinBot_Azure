from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ProductCandle(_message.Message):
    __slots__ = ("product_id", "start", "low", "high", "open", "close", "volume")
    PRODUCT_ID_FIELD_NUMBER: _ClassVar[int]
    START_FIELD_NUMBER: _ClassVar[int]
    LOW_FIELD_NUMBER: _ClassVar[int]
    HIGH_FIELD_NUMBER: _ClassVar[int]
    OPEN_FIELD_NUMBER: _ClassVar[int]
    CLOSE_FIELD_NUMBER: _ClassVar[int]
    VOLUME_FIELD_NUMBER: _ClassVar[int]
    product_id: str
    start: int
    low: float
    high: float
    open: float
    close: float
    volume: float
    def __init__(self, product_id: _Optional[str] = ..., start: _Optional[int] = ..., low: _Optional[float] = ..., high: _Optional[float] = ..., open: _Optional[float] = ..., close: _Optional[float] = ..., volume: _Optional[float] = ...) -> None: ...

class ProductCandleRequest(_message.Message):
    __slots__ = ("product_id", "granularity", "requests", "data_points_limit")
    PRODUCT_ID_FIELD_NUMBER: _ClassVar[int]
    GRANULARITY_FIELD_NUMBER: _ClassVar[int]
    REQUESTS_FIELD_NUMBER: _ClassVar[int]
    DATA_POINTS_LIMIT_FIELD_NUMBER: _ClassVar[int]
    product_id: _containers.RepeatedScalarFieldContainer[str]
    granularity: int
    requests: int
    data_points_limit: int
    def __init__(self, product_id: _Optional[_Iterable[str]] = ..., granularity: _Optional[int] = ..., requests: _Optional[int] = ..., data_points_limit: _Optional[int] = ...) -> None: ...

class ProductCandleResponse(_message.Message):
    __slots__ = ("product_candles",)
    PRODUCT_CANDLES_FIELD_NUMBER: _ClassVar[int]
    product_candles: _containers.RepeatedCompositeFieldContainer[ProductCandle]
    def __init__(self, product_candles: _Optional[_Iterable[_Union[ProductCandle, _Mapping]]] = ...) -> None: ...
