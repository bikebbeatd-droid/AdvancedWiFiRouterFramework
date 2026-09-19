from wifi_framework.dhcp import DhcpConfig
from wifi_framework.firewall import FirewallForward

def test_dhcp_range(): DhcpConfig('br-lan',100,100).validate()
def test_firewall_zones_differ(): FirewallForward('lan','wan').validate()
def test_firewall_same_zone_rejected():
    try: FirewallForward('lan','lan').validate()
    except Exception: pass
    else: raise AssertionError('same zone must fail')
