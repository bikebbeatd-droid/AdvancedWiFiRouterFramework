from dataclasses import dataclass, field
from enum import Enum
from time import monotonic

class ApplyError(RuntimeError): pass
class ApplyState(str,Enum):
    IDLE="idle"; STAGED="staged"; APPLIED="applied"; VERIFIED="verified"; ROLLED_BACK="rolled_back"

@dataclass
class ApplyTransaction:
    state: ApplyState=ApplyState.IDLE
    apply_actions:list=field(default_factory=list)
    rollback_actions:list=field(default_factory=list)
    started_at:float=field(default_factory=monotonic)

    def stage(self, action, rollback=None):
        if self.state not in (ApplyState.IDLE,ApplyState.STAGED):
            raise ApplyError("Invalid transaction state")
        if not callable(action):
            raise ApplyError("Apply action must be callable")
        self.apply_actions.append(action)
        if rollback is not None:
            if not callable(rollback): raise ApplyError("Rollback action must be callable")
            self.rollback_actions.append(rollback)
        self.state=ApplyState.STAGED

    def mark_applied(self):
        if self.state != ApplyState.STAGED: raise ApplyError("Nothing staged")
        try:
            for action in self.apply_actions: action()
        except Exception as exc:
            try: self.rollback()
            except Exception as rollback_exc: raise ApplyError("Apply failed and rollback also failed") from rollback_exc
            raise ApplyError("Apply action failed; configuration was rolled back") from exc
        self.state=ApplyState.APPLIED

    def verify(self, healthy):
        if self.state != ApplyState.APPLIED: raise ApplyError("Changes are not applied")
        if not healthy:
            self.rollback()
            raise ApplyError("Connectivity verification failed")
        self.state=ApplyState.VERIFIED

    def rollback(self):
        if self.state == ApplyState.ROLLED_BACK: return
        errors=[]
        for action in reversed(self.rollback_actions):
            try: action()
            except Exception as exc: errors.append(exc)
        self.state=ApplyState.ROLLED_BACK
        if errors: raise ApplyError("One or more rollback actions failed") from errors[0]
