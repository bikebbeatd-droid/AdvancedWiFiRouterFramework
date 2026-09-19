from dataclasses import dataclass
from enum import Enum

class Band(str, Enum):
    GHZ2 = "2.4GHz"
    GHZ5 = "5GHz"
    GHZ6 = "6GHz"
    UNKNOWN = "unknown"

def band_for_frequency(frequency_mhz: int) -> Band:
    if 2400 <= frequency_mhz < 2500:
        return Band.GHZ2
    if 4900 <= frequency_mhz < 5925:
        return Band.GHZ5
    if 5925 <= frequency_mhz <= 7125:
        return Band.GHZ6
    return Band.UNKNOWN

@dataclass(frozen=True)
class BandPolicy:
    prefer_5ghz: bool = True
    prefer_6ghz: bool = True
    minimum_rssi_dbm: int = -80
    band_bonus: float = 4.0

    def validate(self):
        if not -100 <= self.minimum_rssi_dbm <= -20:
            raise ValueError("Invalid minimum RSSI")
        if self.band_bonus < 0:
            raise ValueError("Band bonus cannot be negative")

def band_score(frequency_mhz: int, rssi_dbm: int, policy: BandPolicy) -> float:
    policy.validate()
    if rssi_dbm < policy.minimum_rssi_dbm:
        return float("-inf")
    band = band_for_frequency(frequency_mhz)
    bonus = 0.0
    if band == Band.GHZ6 and policy.prefer_6ghz:
        bonus = policy.band_bonus
    elif band == Band.GHZ5 and policy.prefer_5ghz:
        bonus = policy.band_bonus
    return float(rssi_dbm + bonus)

def choose_band_candidate(candidates, policy: BandPolicy = BandPolicy()):
    eligible = [n for n in candidates if band_score(n.frequency_mhz, n.rssi_dbm, policy) != float("-inf")]
    if not eligible:
        return None
    return max(eligible, key=lambda n: band_score(n.frequency_mhz, n.rssi_dbm, policy))
