from dataclasses import dataclass
import subprocess

@dataclass(frozen=True)
class LinuxWifiBackend:
    iw_binary: str = "iw"

    def interfaces(self) -> list[str]:
        result = subprocess.run([self.iw_binary, "dev"], check=True,
            capture_output=True, text=True, timeout=10)
        return [line.strip().split(maxsplit=1)[1]
                for line in result.stdout.splitlines()
                if line.strip().startswith("Interface ")]

    def link_info(self, interface: str) -> str:
        result = subprocess.run([self.iw_binary, "dev", interface, "link"],
            check=True, capture_output=True, text=True, timeout=10)
        return result.stdout
