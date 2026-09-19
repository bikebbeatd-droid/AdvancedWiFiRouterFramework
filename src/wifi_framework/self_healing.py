from dataclasses import dataclass
from enum import Enum
from time import monotonic
from .backoff import ExponentialBackoff

class RecoveryAction(str,Enum): NONE='none'; RECONNECT='reconnect'; ROLLBACK='rollback'; ALERT='alert'
@dataclass(frozen=True)
class HealthPolicy:
    min_score: float=60.0
    failure_limit: int=3
    def validate(self):
        if not 0 <= self.min_score <= 100 or self.failure_limit < 1: raise ValueError('Invalid health policy')
@dataclass
class SelfHealing:
    policy: HealthPolicy=HealthPolicy()
    backoff: ExponentialBackoff=ExponentialBackoff()
    failures: int=0
    last_action: RecoveryAction=RecoveryAction.NONE
    def evaluate(self, score: float):
        self.policy.validate()
        if score >= self.policy.min_score:
            self.failures=0; self.backoff.reset(); self.last_action=RecoveryAction.NONE
            return RecoveryAction.NONE
        self.failures += 1
        if self.failures < self.policy.failure_limit:
            self.last_action=RecoveryAction.RECONNECT; return RecoveryAction.RECONNECT
        self.last_action=RecoveryAction.ROLLBACK; return RecoveryAction.ROLLBACK
    def next_delay(self): return self.backoff.next_delay()
