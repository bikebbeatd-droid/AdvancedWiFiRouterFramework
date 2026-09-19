import subprocess
from dataclasses import dataclass

class UCIError(RuntimeError):
    pass

@dataclass(frozen=True)
class UCI:
    binary: str = "uci"

    def get(self, key: str) -> str:
        r = subprocess.run([self.binary, "-q", "get", key], capture_output=True, text=True, timeout=5)
        if r.returncode != 0:
            raise UCIError(f"uci get failed: {key}")
        return r.stdout.strip()

    def set(self, key: str, value: str) -> None:
        r = subprocess.run([self.binary, "set", f"{key}={value}"], capture_output=True, text=True, timeout=5)
        if r.returncode != 0:
            raise UCIError(r.stderr.strip() or f"uci set failed: {key}")

    def commit(self, package: str) -> None:
        r = subprocess.run([self.binary, "commit", package], capture_output=True, text=True, timeout=10)
        if r.returncode != 0:
            raise UCIError(r.stderr.strip() or f"uci commit failed: {package}")

    def rollback(self, package: str) -> None:
        r = subprocess.run([self.binary, "revert", package], capture_output=True, text=True, timeout=10)
        if r.returncode != 0:
            raise UCIError(r.stderr.strip() or f"uci revert failed: {package}")
