from wifi_framework.runtime import RuntimeAction, WifiRuntimeController
from wifi_framework.models import Network, Security

def net(name,quality):
    return Network(ssid=name,bssid="00:11:22:33:44:"+str(quality),channel=1,frequency_mhz=5180,rssi_dbm=-45,security=Security.OPEN,quality=quality)

def test_runtime_initial_selection():
    chosen=[]
    r=WifiRuntimeController(scan=lambda:[net("a",80)],health=lambda _:90,switch=lambda n:chosen.append(n.ssid))
    result=r.cycle(0)
    assert result.action==RuntimeAction.SWITCH
    assert chosen==["a"]

def test_runtime_stays_when_healthy():
    r=WifiRuntimeController(scan=lambda:[net("a",80)],health=lambda _:90)
    r.cycle(0)
    result=r.cycle(60)
    assert result.action==RuntimeAction.STAY

def test_runtime_reconnects_without_candidates():
    calls=[]
    r=WifiRuntimeController(scan=lambda:[],health=lambda _:20,reconnect=lambda:calls.append("reconnect"))
    result=r.cycle(0)
    assert result.action==RuntimeAction.NO_CANDIDATE
    assert calls==["reconnect"]
