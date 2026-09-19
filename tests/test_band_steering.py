from wifi_framework.band_steering import Band, BandPolicy, band_for_frequency, choose_band_candidate
from wifi_framework.models import Network, Security

def make_network(name, freq, rssi):
    return Network(ssid=name,bssid="00:11:22:33:44:55",channel=1,frequency_mhz=freq,rssi_dbm=rssi,security=Security.OPEN)

def test_frequency_bands():
    assert band_for_frequency(2412) == Band.GHZ2
    assert band_for_frequency(5180) == Band.GHZ5
    assert band_for_frequency(5955) == Band.GHZ6

def test_band_selection_prefers_configured_band():
    policy=BandPolicy(prefer_5ghz=True, prefer_6ghz=False, band_bonus=4)
    low=make_network("low",2412,-45)
    high=make_network("high",5180,-42)
    assert choose_band_candidate([low,high],policy).ssid == "high"

def test_rssi_floor_blocks_weak_candidates():
    policy=BandPolicy(minimum_rssi_dbm=-70)
    weak=make_network("weak",5180,-75)
    assert choose_band_candidate([weak],policy) is None
