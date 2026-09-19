from wifi_framework.models import Network, Security
from wifi_framework.wisp import WispConfigError, build_wisp_plan

def test_protected_wisp_requires_credentials():
    n=Network(ssid='secure',bssid='00:11:22:33:44:55',channel=1,frequency_mhz=2412,rssi_dbm=-50,security=Security.WPA2)
    try:
        build_wisp_plan(n,'wlan0','br-lan',None,True)
    except WispConfigError:
        pass
    else:
        raise AssertionError('credential reference required')
