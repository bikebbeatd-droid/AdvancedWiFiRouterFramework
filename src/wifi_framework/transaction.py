from dataclasses import dataclass, field
from enum import Enum
from time import monotonic
class ApplyError(RuntimeError): pass
class ApplyState(str,Enum): IDLE='idle'; STAGED='staged'; APPLIED='applied'; VERIFIED='verified'; ROLLED_BACK='rolled_back'
@dataclass
class ApplyTransaction:
    state: ApplyState=ApplyState.IDLE
    rollback_actions: list=field(default_factory=list)
    started_at: float=field(default_factory=monotonic)
    def stage(self, action):
        if self.state not in (ApplyState.IDLE,ApplyState.STAGED): raise ApplyError('Invalid transaction state')
        self.rollback_actions.append(action); self.state=ApplyState.STAGED
    def mark_applied(self):
        if self.state != ApplyState.STAGED: raise ApplyError('Nothing staged')
        self.state=ApplyState.APPLIED
    def verify(self, healthy):
        if self.state != ApplyState.APPLIED: raise ApplyError('Changes are not applied')
        if not healthy: self.rollback(); raise ApplyError('Connectivity verification failed')
        self.state=ApplyState.VERIFIED
    def rollback(self):
        for action in reversed(self.rollback_actions): action()
        self.state=ApplyState.ROLLED_BACK
