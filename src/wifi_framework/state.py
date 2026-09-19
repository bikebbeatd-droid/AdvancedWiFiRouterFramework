from enum import Enum


class ConnectionState(str, Enum):
    IDLE = "idle"
    SCANNING = "scanning"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    DEGRADED = "degraded"
    RECOVERING = "recovering"
    FAILED = "failed"


class ConnectionMachine:
    def __init__(self) -> None:
        self.state = ConnectionState.IDLE

    def transition(self, new_state: ConnectionState) -> ConnectionState:
        self.state = new_state
        return self.state
