import React from "react";
import { Wifi, Activity, Cpu, ShieldCheck, RefreshCw, Terminal } from "lucide-react";
import { SystemStatus, ConnectionState } from "../types.js";

interface HeaderProps {
  status: SystemStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenApiDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  onOpenApiDocs,
}) => {
  const getStateBadgeColor = (state: ConnectionState) => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case ConnectionState.SCANNING:
      case ConnectionState.CONNECTING:
      case ConnectionState.RECOVERING:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse";
      case ConnectionState.DEGRADED:
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case ConnectionState.FAILED:
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const navItems = [
    { id: "networks", label: "Scanner & Networks", icon: Wifi },
    { id: "selector", label: "Deterministic Selector", icon: ShieldCheck },
    { id: "health", label: "Health & Telemetry", icon: Activity },
    { id: "state", label: "State Machine", icon: RefreshCw },
    { id: "hardware", label: "Hardware & Gating", icon: Cpu },
    { id: "config", label: "Policy & Config", icon: Terminal },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/10">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 tracking-tight text-base">
                  Advanced WiFi Router Framework
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v0.1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Linux / OpenWrt Hardware-Aware Router Engine
              </p>
            </div>
          </div>

          {/* Status Indicators & Actions */}
          <div className="flex items-center gap-3">
            {status && (
              <div className="hidden md:flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Link:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-mono uppercase font-semibold ${getStateBadgeColor(
                      status.state
                    )}`}
                  >
                    {status.state}
                  </span>
                </div>

                {status.activeNetwork && (
                  <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                    <span className="text-xs text-slate-400">SSID:</span>
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                      {status.activeNetwork.ssid}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                  <span className="text-xs text-slate-400">Health:</span>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      status.healthScore >= 0.75
                        ? "text-emerald-400"
                        : status.healthScore >= 0.4
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {(status.healthScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={onOpenApiDocs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition"
              title="REST API Endpoints"
            >
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              <span>REST API</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-800 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/50 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
