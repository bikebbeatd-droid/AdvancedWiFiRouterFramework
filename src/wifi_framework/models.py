from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Security(str, Enum):
    OPEN = "open"
    WPA_PSK = "wpa-psk"
    WPA2 = "wpa2"
    WPA3 = "wpa3"
    UNKNOWN = "unknown"


@dataclass
class Network:
    ssid: str
    bssid: Optional[str] = None
    channel: Optional[int] = None
    frequency_mhz: Optional[int] = None
    rssi_dbm: Optional[int] = None
    security: Security = Security.UNKNOWN
    authorized: bool = False
    quality: float = 0.0
    latency_ms: Optional[float] = None
    packet_loss_pct: Optional[float] = None
    stability: float = 0.0
    metadata: dict = field(default_factory=dict)
