from enum import Enum

class WifiMode(str, Enum):
    STA = "sta"
    AP = "ap"
    WISP = "wisp"
    REPEATER = "repeater"

def validate_mode(mode: WifiMode, concurrent_ap_sta: bool) -> None:
    if mode in {WifiMode.WISP, WifiMode.REPEATER} and not concurrent_ap_sta:
        raise ValueError("This mode requires concurrent AP+STA capability.")
