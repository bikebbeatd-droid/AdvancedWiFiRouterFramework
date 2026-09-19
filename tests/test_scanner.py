from wifi_framework.scanner import parse_iw_scan

SAMPLE = """
BSS aa:bb:cc:dd:ee:ff(on wlan0)
    freq: 5180
    signal: -48.00 dBm
    SSID: AuthorizedNet
    RSN:
        * Authentication suites: SAE
BSS 11:22:33:44:55:66(on wlan0)
    freq: 2412
    signal: -72.00 dBm
    SSID: OpenNet
"""

def test_parse_iw_scan():
    items = parse_iw_scan(SAMPLE)
    assert len(items) == 2
    assert items[0].ssid == "AuthorizedNet"
    assert items[0].rssi_dbm == -48
    assert items[0].security.value == "wpa3"
    assert items[1].security.value == "open"
