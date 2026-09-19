import React, { useState } from "react";
import {
  RefreshCw,
  Play,
  Pause,
  AlertOctagon,
  LifeBuoy,
  Zap,
  Activity,
  Radio,
  CheckCircle,
  Clock,
} from "lucide-react";
import { ConnectionState, StateTransitionEvent, Network } from "../types.js";

interface ConnectionManagerProps {
  currentState: ConnectionState;
  activeNetwork: Network | null;
  history: StateTransitionEvent[];
  onTransition: (state: ConnectionState, reason: string) => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  currentState,
  activeNetwork,
  history,
  onTransition,
}) => {
  const [customReason, setCustomReason] = useState("");

  const allStates: Array<{
    id: ConnectionState;
    label: string;
    description: string;
    color: string;
  }> = [
    {
      id: ConnectionState.IDLE,
      label: "IDLE",
      description: "Interface standby, no active association",
      color: "border-slate-700 text-slate-400 bg-slate-900/40",
    },
    {
      id: ConnectionState.SCANNING,
      label: "SCANNING",
      description: "Performing active/passive channel beacon scan",
      color: "border-blue-500/40 text-blue-400 bg-blue-950/20",
    },
    {
      id: ConnectionState.CONNECTING,
      label: "CONNECTING",
      description: "Performing 802.11 auth & 4-way handshake",
      color: "border-indigo-500/40 text-indigo-400 bg-indigo-950/20",
    },
    {
      id: ConnectionState.CONNECTED,
      label: "CONNECTED",
      description: "STA associated with active DHCP lease & default route",
      color: "border-emerald-500/40 text-emerald-400 bg-emerald-950/20",
    },
    {
      id: ConnectionState.DEGRADED,
      label: "DEGRADED",
      description: "Packet loss or high latency threshold breached",
      color: "border-amber-500/40 text-amber-400 bg-amber-950/20",
    },
    {
      id: ConnectionState.RECOVERING,
      label: "RECOVERING",
      description: "Self-healing trigger: channel switch / re-association",
      color: "border-cyan-500/40 text-cyan-400 bg-cyan-950/20",
    },
    {
      id: ConnectionState.FAILED,
      label: "FAILED",
      description: "Association failed or maximum retry backoff reached",
      color: "border-rose-500/40 text-rose-400 bg-rose-950/20",
    },
  ];

  const handleTransitionClick = (state: ConnectionState) => {
    const reason =
      customReason.trim() || `Manual transition to ${state} via Web Dashboard`;
    onTransition(state, reason);
    setCustomReason("");
  };

  return (
    <div className="space-y-6">
      {/* State Machine Overview */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              Connection State Machine Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic finite state machine (FSM) driving 802.11 STA association, roaming, and self-healing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current State:</span>
            <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {currentState}
            </span>
          </div>
        </div>

        {/* State Flow Diagram Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2">
          {allStates.map((st) => {
            const isCurrent = currentState === st.id;
            return (
              <div
                key={st.id}
                className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                  isCurrent
                    ? `${st.color} ring-2 ring-blue-500/50 shadow-lg`
                    : "bg-slate-950/30 border-slate-800/80 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">{st.label}</span>
                    {isCurrent && (
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                    {st.description}
                  </p>
                </div>

                <button
                  onClick={() => handleTransitionClick(st.id)}
                  disabled={isCurrent}
                  className={`mt-3 text-[11px] py-1 px-2 rounded font-medium transition ${
                    isCurrent
                      ? "bg-slate-800/60 text-slate-500 cursor-default"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  {isCurrent ? "Active" : "Switch State"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Transition & Self-Healing Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trigger Quick Actions */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-400" />
            Router Scenario Triggers
          </h4>
          <p className="text-xs text-slate-400">
            Simulate operational lifecycle events to verify failover and recovery mechanisms:
          </p>

          <div className="space-y-2 text-xs">
            <button
              onClick={() => onTransition(ConnectionState.SCANNING, "Triggered background beacon probe scan")}
              className="w-full text-left p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-between group transition"
            >
              <div>
                <span className="font-medium text-slate-200 block group-hover:text-blue-400">
                  Channel Scan Cycle
                </span>
                <span className="text-[11px] text-slate-500">Scan → Select → Connect</span>
              </div>
              <Radio className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
            </button>

            <button
              onClick={() =>
                onTransition(
                  ConnectionState.DEGRADED,
                  "Simulated link degradation: packet loss threshold exceeded"
                )
              }
              className="w-full text-left p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-between group transition"
            >
              <div>
                <span className="font-medium text-amber-300 block">Simulate Link Degradation</span>
                <span className="text-[11px] text-slate-500">
                  Triggers backoff and health warnings
                </span>
              </div>
              <AlertOctagon className="h-4 w-4 text-amber-400" />
            </button>

            <button
              onClick={() =>
                onTransition(
                  ConnectionState.RECOVERING,
                  "Automatic self-healing: Initiated AP roamer protocol"
                )
              }
              className="w-full text-left p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-between group transition"
            >
              <div>
                <span className="font-medium text-cyan-300 block">Trigger Self-Healing Recovery</span>
                <span className="text-[11px] text-slate-500">
                  Execute 802.11v BSS transition / re-association
                </span>
              </div>
              <LifeBuoy className="h-4 w-4 text-cyan-400" />
            </button>

            <button
              onClick={() => onTransition(ConnectionState.IDLE, "Operator initiated clean disconnect")}
              className="w-full text-left p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-between group transition"
            >
              <div>
                <span className="font-medium text-slate-300 block">Disconnect to IDLE</span>
                <span className="text-[11px] text-slate-500">Release radio lease</span>
              </div>
              <Pause className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Audit Log / Transition History */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              State Transition Audit Log
            </h4>
            <span className="text-xs text-slate-500">{history.length} recorded events</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {history.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono uppercase text-slate-400">{evt.from}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-mono uppercase font-bold text-blue-400">{evt.to}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {evt.reason || "Automatic state machine cycle"}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
