from dataclasses import dataclass
from enum import Enum

class ConnectionBackend(str, Enum):
    WPA_SUPPLICANT = "wpa_supplicant"
    NETWORK_MANAGER = "network_manager"

@dataclass(frozen=True)
class ConnectionRequest:
    interface: str
    ssid: str
    authorized: bool
    security: str

class ConnectionError(RuntimeError):
    pass

def validate_request(request: ConnectionRequest) -> None:
    if not request.ssid:
        raise ConnectionError("SSID must not be empty")
    if not request.authorized and request.security.lower() not in {"open", "none"}:
        raise ConnectionError("Protected Wi-Fi requires explicit administrator authorization.")
