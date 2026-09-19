from dataclasses import dataclass, field
from enum import Enum
from time import monotonic
from .band_steering import BandPolicy, choose_band_candidate
from .failover import FailoverEngine

class RoamingAction(str, Enum):
    STAY="stay"; SWITCH="switch"; RECONNECT="reconnect"; NO_CANDIDATE="no_candidate"

@dataclass(frozen=True)
class RoamingPolicy:
    minimum_health: float=60.0
    weak_signal_dbm: int=-75
    failure_limit: int=3
    def validate(self):
        if not 0 <= self.minimum_health <= 100: raise ValueError("Invalid minimum health")
        if not -100 <= self.weak_signal_dbm <= -20: raise ValueError("Invalid weak signal")
        if self.failure_limit < 1: raise ValueError("Invalid failure limit")

@dataclass
class RoamingCoordinator:
    failover: FailoverEngine=field(default_factory=FailoverEngine)
    band_policy: BandPolicy=field(default_factory=BandPolicy)
    policy: RoamingPolicy=field(default_factory=RoamingPolicy)
    failures: int=0
    last_action: RoamingAction=RoamingAction.STAY

    def evaluate(self,current,candidates,health_score:float,now:float|None=None):
        self.policy.validate()
        timestamp=monotonic() if now is None else now
        if not candidates:
            self.failures+=1
            self.last_action=RoamingAction.RECONNECT if self.failures < self.policy.failure_limit else RoamingAction.NO_CANDIDATE
            return self.last_action,None
        if health_score < self.policy.minimum_health: self.failures+=1
        else: self.failures=0
        eligible=[n for n in candidates if getattr(n,"rssi_dbm",-100) >= self.policy.weak_signal_dbm]
        preferred=choose_band_candidate(eligible,self.band_policy) if eligible else None
        chosen=self.failover.choose([preferred] if preferred else [],timestamp)
        if chosen is None:
            chosen=self.failover.choose(eligible,timestamp)
        if chosen is None:
            self.last_action=RoamingAction.RECONNECT
            return self.last_action,None
        if current is not None and chosen.ssid==current.ssid and chosen.bssid==current.bssid:
            self.last_action=RoamingAction.RECONNECT if self.failures>=self.policy.failure_limit else RoamingAction.STAY
            return self.last_action,current
        self.failures=0
        self.last_action=RoamingAction.SWITCH
        return self.last_action,chosen
