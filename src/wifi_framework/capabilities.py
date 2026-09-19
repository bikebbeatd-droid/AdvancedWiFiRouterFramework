from dataclasses import dataclass


@dataclass(frozen=True)
class WifiCapabilities:
    bands_2ghz: bool = False
    bands_5ghz: bool = False
    bands_6ghz: bool = False
    ap: bool = False
    sta: bool = False
    concurrent_ap_sta: bool = False
    mesh_80211s: bool = False
    ieee80211k: bool = False
    ieee80211v: bool = False
    ieee80211r: bool = False


def supported_features(cap: WifiCapabilities) -> list[str]:
    return [name for name, enabled in vars(cap).items() if enabled]
