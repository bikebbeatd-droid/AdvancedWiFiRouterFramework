from wifi_framework.models import Network, Security
from wifi_framework.selector import choose_network


def test_unauthorized_protected_network_is_not_selected():
    networks = [
        Network("protected", rssi_dbm=-40, security=Security.WPA2, authorized=False),
        Network("open", rssi_dbm=-65, security=Security.OPEN),
    ]
    assert choose_network(networks).ssid == "open"


def test_authorized_network_can_be_selected():
    networks = [
        Network("saved", rssi_dbm=-50, security=Security.WPA2, authorized=True, stability=1),
        Network("open", rssi_dbm=-45, security=Security.OPEN, stability=0.5),
    ]
    assert choose_network(networks).ssid == "saved"
