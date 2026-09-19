import re
import subprocess
from dataclasses import dataclass

from .capabilities import WifiCapabilities


class IwCapabilityError(RuntimeError):
    pass


@dataclass(frozen=True)
class IwListCommand:
    timeout_seconds: int = 15


def _channel_from_frequency(freq_mhz: int):
    if 2412 <= freq_mhz <= 2484:
        return (14, "2ghz") if freq_mhz == 2484 else (round((freq_mhz - 2407) / 5), "2ghz")
    if 5000 <= freq_mhz < 5925:
        return round((freq_mhz - 5000) / 5), "5ghz"
    if 5925 <= freq_mhz <= 7125:
        return round((freq_mhz - 5950) / 5), "6ghz"
    return None


def parse_iw_list(output: str) -> WifiCapabilities:
    f2, f5, f6 = set(), set(), set()
    for match in re.finditer(r"^\\s*\\*\\s*(\\d+)\\s*MHz", output, re.MULTILINE | re.I):
        result = _channel_from_frequency(int(match.group(1)))
        if result:
            ch, band = result
            {"2ghz": f2, "5ghz": f5, "6ghz": f6}[band].add(ch)
    lower = output.lower()
    ap = bool(re.search(r"^\\s*\\*\\s*ap\\s*$", lower, re.MULTILINE))
    sta = bool(re.search(r"^\\s*\\*\\s*managed\\s*$", lower, re.MULTILINE))
    combos = re.search(r"valid interface combinations:(.*?)(?:\\n\\S|\\Z)", lower, re.S)
    concurrent = bool(combos and "ap" in combos.group(1) and "managed" in combos.group(1))
    mesh = "mesh point" in lower or "mesh_point" in lower
    return WifiCapabilities(bands_2ghz=bool(f2), bands_5ghz=bool(f5), bands_6ghz=bool(f6), ap=ap, sta=sta, concurrent_ap_sta=concurrent, mesh_80211s=mesh, channels_2ghz=tuple(sorted(f2)), channels_5ghz=tuple(sorted(f5)), channels_6ghz=tuple(sorted(f6)))


def detect_linux_capabilities(command: IwListCommand = IwListCommand()) -> WifiCapabilities:
    try:
        result = subprocess.run(["iw", "list"], check=True, capture_output=True, text=True, timeout=command.timeout_seconds)
    except (OSError, subprocess.SubprocessError) as exc:
        raise IwCapabilityError("Unable to execute iw list") from exc
    return parse_iw_list(result.stdout)
