from dataclasses import dataclass
import re
import subprocess

_INTERFACE_RE=re.compile(r"^[A-Za-z0-9_.:-]{1,64}$")
_NETWORK_ID_RE=re.compile(r"^[0-9]{1,9}$")

class OpenWrtWifiError(RuntimeError):
    pass

@dataclass(frozen=True)
class WpaSupplicantAdapter:
    interface: str
    binary: str="wpa_cli"
    timeout: float=8.0

    def __post_init__(self):
        if not _INTERFACE_RE.fullmatch(self.interface):
            raise ValueError("Invalid Wi-Fi interface")
        if not self.binary:
            raise ValueError("wpa_cli binary is required")
        if self.timeout <= 0:
            raise ValueError("Timeout must be positive")

    def _run(self,*args: str) -> str:
        if any(not isinstance(arg,str) or not arg for arg in args):
            raise ValueError("Invalid wpa_cli argument")
        try:
            result=subprocess.run(
                [self.binary,"-i",self.interface,*args],
                check=True,capture_output=True,text=True,timeout=self.timeout,
            )
        except (OSError,subprocess.TimeoutExpired,subprocess.CalledProcessError) as exc:
            raise OpenWrtWifiError("wpa_cli operation failed") from exc
        return result.stdout.strip()

    def status(self) -> dict[str,str]:
        output=self._run("status")
        data={}
        for line in output.splitlines():
            if "=" in line:
                key,value=line.split("=",1)
                data[key]=value
        return data

    def reconnect(self) -> None:
        self._run("reconnect")

    def disconnect(self) -> None:
        self._run("disconnect")

    def select_saved_network(self, network_id: str) -> None:
        if not _NETWORK_ID_RE.fullmatch(network_id):
            raise ValueError("Network ID must be a numeric saved-network ID")
        self._run("select_network",network_id)

    def rescan(self) -> None:
        self._run("scan")

    def current_ssid(self) -> str | None:
        return self.status().get("ssid") or None
