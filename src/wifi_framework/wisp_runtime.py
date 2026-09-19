from dataclasses import dataclass
from .backoff import ExponentialBackoff
from .health_probe import ping
from .wisp import WispPlan
from .wpa_runtime import WPAControl

@dataclass
class WispRuntime:
    wpa: WPAControl
    backoff: ExponentialBackoff = ExponentialBackoff()
    def reconnect(self):
        self.wpa.reconnect()
        return self.backoff.next_delay()
    def reset_backoff(self): self.backoff.reset()
