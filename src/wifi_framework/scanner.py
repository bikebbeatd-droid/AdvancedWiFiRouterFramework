from dataclasses import dataclass
import re
import subprocess
from .models import Network, Security

@dataclass(frozen=True)
class ScanCommand:
    interface: str
    timeout_seconds: int = 15

def _security_from_block(block: str) -> Security:
    text = block.upper()
    if "SAE" in text or "WPA3" in text:
        return Security.WPA3
    if "WPA" in text:
        return Security.WPA2
    return Security.OPEN

def parse_iw_scan(output: str) -> list[Network]:
    blocks = re.split(r"(?=^BSS\s+)", output, flags=re.MULTILINE)
    networks = []
    for block in blocks:
        bss = re.search(r"^BSS\s+([0-9a-f:]{17})", block, re.MULTILINE | re.I)
        ssid = re.search(r"^\s*SSID:\s*(.*)$", block, re.MULTILINE)
        signal = re.search(r"^\s*signal:\s*(-?\d+(?:\.\d+)?)\s*dBm", block, re.MULTILINE)
        channel = re.search(r"\(channel\s+(\d+)\)", block, re.I)
        freq = re.search(r"^\s*freq:\s*(\d+)", block, re.MULTILINE)
        if not bss or not ssid:
            continue
        name = ssid.group(1).strip()
        if not name:
            continue
        rssi = round(float(signal.group(1))) if signal else None
        ch = int(channel.group(1)) if channel else None
        frequency = int(freq.group(1)) if freq else None
        networks.append(Network(ssid=name, bssid=bss.group(1).lower(), channel=ch,
            frequency_mhz=frequency, rssi_dbm=rssi,
            security=_security_from_block(block), authorized=False))
    return networks

def scan_linux(command: ScanCommand) -> list[Network]:
    result = subprocess.run(["iw", "dev", command.interface, "scan"],
        check=True, capture_output=True, text=True, timeout=command.timeout_seconds)
    return parse_iw_scan(result.stdout)
