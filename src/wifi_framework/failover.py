from dataclasses import dataclass
from .models import Network
from .selector import SelectorWeights, choose_network

@dataclass(frozen=True)
class FailoverPolicy:
    minimum_score: float=45.0
    switch_margin: float=8.0
    cooldown_seconds: float=30.0
    def validate(self):
        if not 0 <= self.minimum_score <= 100 or self.switch_margin < 0 or self.cooldown_seconds < 0: raise ValueError('Invalid failover policy')

@dataclass
class FailoverEngine:
    weights: SelectorWeights=SelectorWeights()
    policy: FailoverPolicy=FailoverPolicy()
    current: Network|None=None
    last_switch_at: float=0.0
    def choose(self, networks, now: float):
        self.policy.validate()
        candidate=choose_network(networks,self.weights)
        if candidate is None: return None
        if self.current is None: self.current=candidate; self.last_switch_at=now; return candidate
        if candidate.ssid == self.current.ssid and candidate.bssid == self.current.bssid: return self.current
        if now-self.last_switch_at < self.policy.cooldown_seconds: return self.current
        if candidate.quality < self.policy.minimum_score: return self.current
        if self.current.quality is not None and candidate.quality < self.current.quality + self.policy.switch_margin: return self.current
        self.current=candidate; self.last_switch_at=now; return candidate
