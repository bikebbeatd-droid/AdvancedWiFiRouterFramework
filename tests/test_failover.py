from wifi_framework.failover import FailoverEngine,FailoverPolicy
from wifi_framework.models import Network,Security

def n(ssid,rssi,quality): return Network(ssid=ssid,bssid='00:11:22:33:44:'+str(len(ssid)).zfill(2),channel=1,frequency_mhz=2412,rssi_dbm=rssi,security=Security.OPEN,quality=quality)
def test_cooldown_keeps_current():
    h=FailoverEngine(policy=FailoverPolicy(cooldown_seconds=30,switch_margin=0))
    a=n('a',-40,80); b=n('b',-30,95)
    assert h.choose([a],0).ssid=='a'; assert h.choose([b],10).ssid=='a'
def test_switch_after_cooldown_and_margin():
    h=FailoverEngine(policy=FailoverPolicy(cooldown_seconds=10,switch_margin=5))
    a=n('a',-40,60); b=n('b',-30,80)
    h.choose([a],0); assert h.choose([b],11).ssid=='b'
