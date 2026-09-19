from wifi_framework.models import Network, Security
from wifi_framework.wisp import WispConfigError, build_wisp_plan

def network(security):
    return Network(ssid='test',bssid='00:11:22:33:44:55',channel=1,frequency_mhz=2412,rssi_dbm=-50,security=security)

def test_open_wisp_does_not_require_credentials():
    plan=build_wisp_plan(network(Security.OPEN),'wlan0','br-lan',None,True)
    assert plan.upstream_ssid=='test'

def test_protected_wisp_requires_credentials():
    try: build_wisp_plan(network(Security.WPA2),'wlan0','br-lan',None,True)
    except WispConfigError: pass
    else: raise AssertionError('credential reference required')
