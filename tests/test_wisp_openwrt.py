import pytest
from wifi_framework.wisp_openwrt import OpenWrtWispRuntime,WispApplyPlan
from wifi_framework.openwrt_network import WispNetworkConfig,OpenWrtNetworkRuntime
from wifi_framework.dhcp import DhcpConfig,OpenWrtDhcpRuntime
from wifi_framework.firewall import FirewallForward,OpenWrtFirewallRuntime

class FakeUci:
    def __init__(self): self.calls=[]
    def set(self,key,value): self.calls.append(("set",key,value)); return ""
    def revert(self,package): self.calls.append(("revert",package)); return ""
    def commit(self,package): self.calls.append(("commit",package)); return ""

def runtime():
    u=FakeUci()
    return OpenWrtWispRuntime(OpenWrtNetworkRuntime(u),OpenWrtDhcpRuntime(u),OpenWrtFirewallRuntime(u)),u

def plan(): return WispApplyPlan(WispNetworkConfig("wlan0","br-lan"),DhcpConfig("br-lan"),FirewallForward())

def test_apply_executes_and_commits():
    rt,u=runtime(); tx=rt.apply(plan(),lambda:True)
    assert ("set","network.lan.ipaddr","192.168.50.1") in u.calls
    assert ("commit","network") in u.calls
    assert tx.state.value=="verified"

def test_failed_verification_reverts():
    rt,u=runtime()
    with pytest.raises(Exception): rt.apply(plan(),lambda:False)
    assert ("revert","network") in u.calls

def test_dhcp_must_match_lan():
    rt,_=runtime()
    bad=WispApplyPlan(WispNetworkConfig("wlan0","br-lan"),DhcpConfig("wlan1"),FirewallForward())
    with pytest.raises(Exception): rt.validate(bad)
