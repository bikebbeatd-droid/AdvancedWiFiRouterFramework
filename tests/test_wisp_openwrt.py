import pytest
from wifi_framework.wisp_openwrt import OpenWrtWispRuntime,WispApplyPlan
from wifi_framework.openwrt_network import WispNetworkConfig,OpenWrtNetworkRuntime
from wifi_framework.dhcp import DhcpConfig,OpenWrtDhcpRuntime
from wifi_framework.firewall import FirewallForward,OpenWrtFirewallRuntime

class FakeUci:
    def __init__(self): self.calls=[]
    def set(self,key,value): self.calls.append((key,value)); return ""
    
def runtime():
    u=FakeUci()
    return OpenWrtWispRuntime(OpenWrtNetworkRuntime(u),OpenWrtDhcpRuntime(u),OpenWrtFirewallRuntime(u)),u

def plan():
    return WispApplyPlan(WispNetworkConfig("wlan0","br-lan"),DhcpConfig("br-lan"),FirewallForward())

def test_plan_validates_and_stages():
    rt,u=runtime()
    tx=rt.prepare(plan())
    assert len(tx.rollback_actions)==0
    assert ("network.lan.ipaddr","192.168.50.1") in u.calls
    assert ("dhcp.lan.interface","br-lan") in u.calls

def test_dhcp_must_match_lan():
    rt,_=runtime()
    bad=WispApplyPlan(WispNetworkConfig("wlan0","br-lan"),DhcpConfig("wlan1"),FirewallForward())
    with pytest.raises(Exception):
        rt.validate(bad)
