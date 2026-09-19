from dataclasses import dataclass
import subprocess
import time

@dataclass(frozen=True)
class ProbeResult:
    target: str
    latency_ms: float | None
    reachable: bool

def ping(target: str, timeout_seconds: int = 3) -> ProbeResult:
    started = time.perf_counter()
    try:
        subprocess.run(["ping", "-c", "1", "-W", str(timeout_seconds), target],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            timeout=timeout_seconds + 1)
        return ProbeResult(target, (time.perf_counter() - started) * 1000.0, True)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return ProbeResult(target, None, False)
