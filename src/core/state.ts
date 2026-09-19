export enum ConnectionState {
  IDLE = "idle",
  SCANNING = "scanning",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DEGRADED = "degraded",
  RECOVERING = "recovering",
  FAILED = "failed",
}

export interface StateTransitionEvent {
  timestamp: string;
  from: ConnectionState;
  to: ConnectionState;
  reason?: string;
}

export class ConnectionMachine {
  public state: ConnectionState;
  public history: StateTransitionEvent[] = [];

  constructor(initialState: ConnectionState = ConnectionState.IDLE) {
    this.state = initialState;
    this.history = [
      {
        timestamp: new Date().toISOString(),
        from: initialState,
        to: initialState,
        reason: "Initial state",
      },
    ];
  }

  public transition(newState: ConnectionState, reason?: string): ConnectionState {
    const from = this.state;
    this.state = newState;
    this.history.unshift({
      timestamp: new Date().toISOString(),
      from,
      to: newState,
      reason: reason || "Manual/Auto transition",
    });
    // Keep last 50 transitions
    if (this.history.length > 50) {
      this.history.pop();
    }
    return this.state;
  }
}
