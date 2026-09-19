import subprocess
from dataclasses import dataclass

class HostapdError(RuntimeError):
    pass

@dataclass(frozen=True)
class HostapdControl:
    interface: str
    cli_binary: str = "hostapd_cli"

    def command(self, command: str) -> str:
        r=subprocess.run([self.cli_binary,"-i",self.interface,command],
            capture_output=True,text=True,timeout=10)
        if r.returncode != 0:
            raise HostapdError(r.stderr.strip() or command)
        return r.stdout.strip()

    def status(self) -> str:
        return self.command("status")

    def stations(self) -> str:
        return self.command("list_sta")
