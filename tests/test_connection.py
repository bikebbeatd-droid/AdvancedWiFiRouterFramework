import pytest
from wifi_framework.connection import ConnectionError, ConnectionRequest, validate_request

def test_protected_network_requires_authorization():
    with pytest.raises(ConnectionError):
        validate_request(ConnectionRequest("wlan0", "Private", False, "wpa2"))

def test_open_network_is_allowed():
    validate_request(ConnectionRequest("wlan0", "Cafe", False, "open"))
