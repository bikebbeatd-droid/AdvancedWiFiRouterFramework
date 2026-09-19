from wifi_framework.roaming import RoamingAction, RoamingCoordinator, RoamingPolicy
from wifi_framework.models import Network, Security

def make_network(name, quality):
    return Network(ssid=name,bssid="00:11:22:33:44:"+str(quality),channel=1,frequency_mhz=5180,rssi_dbm=-45,security=Security.OPEN,quality=quality)

def test_stays_on_current_during_healthy_state():
    coordinator=RoamingCoordinator()
    current=make_network("current",80)
    assert coordinator.evaluate(current,[current],90,0)[0] == RoamingAction.STAY

def test_switches_to_better_candidate():
    coordinator=RoamingCoordinator()
    current=make_network("current",50)
    candidate=make_network("better",90)
    assert coordinator.evaluate(current,[candidate],40,60)[0] == RoamingAction.SWITCH

def test_no_candidates_requests_reconnect_before_final_failure():
    coordinator=RoamingCoordinator(policy=RoamingPolicy(failure_limit=3))
    current=make_network("current",80)
    assert coordinator.evaluate(current,[],30,0)[0] == RoamingAction.RECONNECT
