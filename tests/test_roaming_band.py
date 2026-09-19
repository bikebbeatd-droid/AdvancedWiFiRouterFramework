from wifi_framework.roaming import RoamingCoordinator,RoamingAction
from wifi_framework.models import Network,Security

def net(name,freq,rssi,quality):
    return Network(ssid=name,bssid="00:11:22:33:44:"+str(quality),channel=1,frequency_mhz=freq,rssi_dbm=rssi,security=Security.OPEN,quality=quality)

def test_band_aware_roaming():
    r=RoamingCoordinator()
    current=net("old",2412,-50,70)
    five=net("five",5180,-45,90)
    action,chosen=r.evaluate(current,[five],90,100)
    assert action==RoamingAction.SWITCH and chosen.ssid=="five"

def test_weak_candidates_are_ignored_before_reconnect():
    r=RoamingCoordinator()
    current=net("old",2412,-50,70)
    action,_=r.evaluate(current,[net("weak",5180,-90,95)],30,0)
    assert action==RoamingAction.RECONNECT
