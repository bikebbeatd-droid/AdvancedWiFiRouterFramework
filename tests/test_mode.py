import pytest
from wifi_framework.mode import WifiMode, validate_mode

def test_sta_allowed_without_concurrency():
    validate_mode(WifiMode.STA, False)

def test_repeater_requires_concurrency():
    with pytest.raises(ValueError):
        validate_mode(WifiMode.REPEATER, False)

def test_repeater_allowed_with_concurrency():
    validate_mode(WifiMode.REPEATER, True)
