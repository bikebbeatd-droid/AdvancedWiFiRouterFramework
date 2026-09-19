import subprocess
from dataclasses import dataclass

class WPAError(RuntimeError):
    pass

@dataclass(frozen=True)
class WPAControl:
    interface: str
    cli_binary: str = "wpa_cli"

    def command(self, command: str) -> str:
        r=subprocess.run([self.cli_binary,"-i",self.interface,command],
            capture_output=True,text=True,timeout=10)
        if r.returncode != 0:
            raise WPAError(r.stderr.strip() or command)
        return r.stdout.strip()

    def status(self) -> str:
        return self.command("status")

    def reconnect(self) -> str:
        return self.command("reconnect")
