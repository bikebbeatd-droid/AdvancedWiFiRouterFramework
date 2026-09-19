from dataclasses import dataclass
import subprocess


class QosError(RuntimeError):
    pass


@dataclass(frozen=True)
class QosConfig:
    interface: str
    download_kbit: int | None = None
    upload_kbit: int | None = None

    def validate(self) -> None:
        if not self.interface:
            raise QosError("Interface is required")
        for value in (self.download_kbit, self.upload_kbit):
            if value is not None and value <= 0:
                raise QosError("QoS rates must be positive")


@dataclass(frozen=True)
class TcCommand:
    binary: str = "tc"

    def show(self, interface: str) -> str:
        if not interface:
            raise QosError("Interface is required")
        result = subprocess.run([self.binary, "qdisc", "show", "dev", interface], check=True, capture_output=True, text=True)
        return result.stdout
