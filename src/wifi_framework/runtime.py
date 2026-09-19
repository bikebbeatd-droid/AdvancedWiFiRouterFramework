from dataclasses import dataclass, field
from enum import Enum
from time import monotonic
from collections.abc import Callable, Sequence

from .models import Network
from .roaming import RoamingAction, RoamingCoordinator

class RuntimeAction(str, Enum):
    STAY="stay"
    SWITCH="switch"
    RECONNECT="reconnect"
    NO_CANDIDATE="no_candidate"

@dataclass(frozen=True)
class RuntimeDecision:
    action: RuntimeAction
    network: Network | None
    reason: str

@dataclass
class WifiRuntimeController:
    scan: Callable[[], Sequence[Network]]
    health: Callable[[Network], float]
    roam: RoamingCoordinator = field(default_factory=RoamingCoordinator)
    reconnect: Callable[[], None] | None = None
    switch: Callable[[Network], None] | None = None
    current: Network | None = None

    def cycle(self, now: float | None = None) -> RuntimeDecision:
        timestamp = monotonic() if now is None else now
        candidates = list(self.scan())
        if self.current is None:
            if not candidates:
                if self.reconnect: self.reconnect()
                return RuntimeDecision(RuntimeAction.NO_CANDIDATE,None,"No eligible Wi-Fi candidate")
            chosen = self.roam.failover.choose(candidates,timestamp)
            if chosen is None:
                if self.reconnect: self.reconnect()
                return RuntimeDecision(RuntimeAction.NO_CANDIDATE,None,"No candidate met selection policy")
            if self.switch: self.switch(chosen)
            self.current = chosen
            return RuntimeDecision(RuntimeAction.SWITCH,chosen,"Initial uplink selected")

        score = float(self.health(self.current))
        action, chosen = self.roam.evaluate(self.current,candidates,score,timestamp)
        if action == RoamingAction.SWITCH and chosen is not None:
            if self.switch: self.switch(chosen)
            self.current = chosen
            return RuntimeDecision(RuntimeAction.SWITCH,chosen,"Roaming selected a better eligible candidate")
        if action == RoamingAction.RECONNECT:
            if self.reconnect: self.reconnect()
            return RuntimeDecision(RuntimeAction.RECONNECT,self.current,"Connection health requires reconnect")
        if action == RoamingAction.NO_CANDIDATE:
            if self.reconnect: self.reconnect()
            return RuntimeDecision(RuntimeAction.NO_CANDIDATE,None,"No eligible candidate available")
        return RuntimeDecision(RuntimeAction.STAY,self.current,"Current connection remains suitable")
