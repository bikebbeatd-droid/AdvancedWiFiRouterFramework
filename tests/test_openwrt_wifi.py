import pytest
from wifi_framework.openwrt_wifi import WpaSupplicantAdapter

def test_invalid_interface():
    with pytest.raises(ValueError):
        WpaSupplicantAdapter("wlan0;reboot")

def test_invalid_network_id():
    adapter=WpaSupplicantAdapter("wlan0")
    with pytest.raises(ValueError):
        adapter.select_saved_network("1;reboot")

def test_status_parses_output(monkeypatch):
    adapter=WpaSupplicantAdapter("wlan0")
    monkeypatch.setattr(adapter,"_run",lambda *args:"wpa_state=COMPLETED\nssid=HomeWiFi\nfreq=5180")
    assert adapter.status()["ssid"]=="HomeWiFi"
    assert adapter.current_ssid()=="HomeWiFi"
