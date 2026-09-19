import React, { useState } from "react";
import {
  Wifi,
  Lock,
  Unlock,
  Radio,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Signal,
  SlidersHorizontal,
} from "lucide-react";
import { Network, Security } from "../types.js";

interface NetworkScannerProps {
  networks: Network[];
  activeSsid: string | null;
  onScan: () => void;
  isScanning: boolean;
  onAuthorize: (ssid: string, authorized: boolean) => void;
  onConnect: (ssid: string) => void;
  onAddNetwork: (network: Partial<Network>) => void;
  onSelectForBreakdown: (network: Network) => void;
}

export const NetworkScanner: React.FC<NetworkScannerProps> = ({
  networks,
  activeSsid,
  onScan,
  isScanning,
  onAuthorize,
  onConnect,
  onAddNetwork,
  onSelectForBreakdown,
}) => {
  const [filter, setFilter] = useState<"all" | "authorized" | "open" | "5g_6g">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSsid, setNewSsid] = useState("");
  const [newSecurity, setNewSecurity] = useState<Security>(Security.WPA2);
  const [newRssi, setNewRssi] = useState(-55);
  const [newChannel, setNewChannel] = useState(36);
  const [newAuthorized, setNewAuthorized] = useState(true);

  const getRssiColor = (rssi?: number) => {
    if (rssi === undefined) return "text-slate-500";
    if (rssi >= -55) return "text-emerald-400";
    if (rssi >= -70) return "text-blue-400";
    if (rssi >= -82) return "text-amber-400";
    return "text-rose-400";
  };

  const getSecurityBadge = (sec: Security, auth: boolean) => {
    switch (sec) {
      case Security.OPEN:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Unlock className="h-3 w-3" /> Open
          </span>
        );
      case Security.WPA3:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Lock className="h-3 w-3" /> WPA3 SAE
          </span>
        );
      case Security.WPA2:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Lock className="h-3 w-3" /> WPA2-PSK
          </span>
        );
      case Security.WPA_PSK:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="h-3 w-3" /> WPA-PSK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Unknown
          </span>
        );
    }
  };

  const filteredNetworks = networks.filter((n) => {
    if (filter === "authorized") return n.authorized;
    if (filter === "open") return n.security === Security.OPEN;
    if (filter === "5g_6g") return (n.frequency_mhz || 0) >= 5000;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSsid.trim()) return;

    const freq = newChannel > 14 ? (newChannel > 60 ? 6295 : 5180 + (newChannel - 36) * 5) : 2407 + newChannel * 5;

    onAddNetwork({
      ssid: newSsid.trim(),
      security: newSecurity,
      rssi_dbm: Number(newRssi),
      channel: Number(newChannel),
      frequency_mhz: freq,
      authorized: newAuthorized,
      quality: Math.min(1.0, Math.max(0.2, (Number(newRssi) + 100) / 70)),
      latency_ms: 22.0,
      packet_loss_pct: 0.0,
      stability: 0.95,
      metadata: { vendor: "Custom AP simulator", band: newChannel > 14 ? "5GHz" : "2.4GHz" },
    });

    setNewSsid("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-400" />
            Wi-Fi Environment & Scan Table
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time beacon probe frames normalized from cfg80211 / nl80211 scan results
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onScan}
            disabled={isScanning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning Airwaves..." : "Trigger Channel Scan"}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            <Plus className="h-3.5 w-3.5 text-blue-400" />
            <span>Add Simulation AP</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs border-b border-slate-800 pb-2">
        <span className="text-slate-500 font-medium mr-1">Filter:</span>
        {(
          [
            { id: "all", label: `All APs (${networks.length})` },
            { id: "authorized", label: `Authorized (${networks.filter((n) => n.authorized).length})` },
            { id: "open", label: `Open (${networks.filter((n) => n.security === Security.OPEN).length})` },
            {
              id: "5g_6g",
              label: `5GHz / 6GHz (${networks.filter((n) => (n.frequency_mhz || 0) >= 5000).length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1 rounded-md transition ${
              filter === tab.id
                ? "bg-slate-800 text-blue-400 font-medium border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Network List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNetworks.map((net) => {
          const isActive = net.ssid === activeSsid;
          const isEligible = net.security === Security.OPEN || net.authorized;

          return (
            <div
              key={net.ssid}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-500/5"
                  : isEligible
                  ? "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  : "bg-slate-900/20 border-slate-800/60 opacity-80"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-2 rounded-lg border ${
                        isActive
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-400"
                      }`}
                    >
                      <Wifi className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-100 text-sm truncate">
                          {net.ssid}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {net.bssid || "00:00:00:00:00:00"}
                      </p>
                    </div>
                  </div>
                  <div>{getSecurityBadge(net.security, net.authorized)}</div>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Signal (RSSI)</span>
                    <span className={`font-semibold ${getRssiColor(net.rssi_dbm)}`}>
                      {net.rssi_dbm ?? -90} dBm
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Band / Channel</span>
                    <span className="text-slate-300 font-medium">
                      {net.frequency_mhz && net.frequency_mhz > 5900
                        ? "6GHz"
                        : net.frequency_mhz && net.frequency_mhz > 4900
                        ? "5GHz"
                        : "2.4GHz"}{" "}
                      (Ch {net.channel ?? "auto"})
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Latency</span>
                    <span className="text-slate-300 font-medium">
                      {net.latency_ms !== undefined ? `${net.latency_ms.toFixed(1)} ms` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Stability</span>
                    <span className="text-slate-300 font-medium">
                      {(net.stability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Eligibility Notice */}
                {!isEligible && (
                  <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1.5 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Requires administrator credentials to authorize.</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectForBreakdown(net)}
                  className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 py-1 px-1.5 rounded hover:bg-slate-800 transition"
                  title="Inspect mathematical selector scoring"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Score Breakdown</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {net.security !== Security.OPEN && (
                    <button
                      onClick={() => onAuthorize(net.ssid, !net.authorized)}
                      className={`text-xs px-2.5 py-1 rounded font-medium border transition ${
                        net.authorized
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          : "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {net.authorized ? "Revoke Auth" : "Authorize"}
                    </button>
                  )}

                  <button
                    onClick={() => onConnect(net.ssid)}
                    disabled={isActive || !isEligible}
                    className={`text-xs px-3 py-1 rounded font-medium transition ${
                      isActive
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : isEligible
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    {isActive ? "Connected" : "Connect"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Simulation AP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-400" />
                Simulate Wi-Fi Access Point
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">SSID (Network Name)</label>
                <input
                  type="text"
                  value={newSsid}
                  onChange={(e) => setNewSsid(e.target.value)}
                  placeholder="e.g. Starlink_Satellite_5G"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Security Standard</label>
                  <select
                    value={newSecurity}
                    onChange={(e) => setNewSecurity(e.target.value as Security)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value={Security.OPEN}>OPEN</option>
                    <option value={Security.WPA2}>WPA2-PSK</option>
                    <option value={Security.WPA3}>WPA3 SAE</option>
                    <option value={Security.WPA_PSK}>WPA-PSK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Channel (Band)</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>Ch 1 (2.4GHz)</option>
                    <option value={6}>Ch 6 (2.4GHz)</option>
                    <option value={11}>Ch 11 (2.4GHz)</option>
                    <option value={36}>Ch 36 (5GHz)</option>
                    <option value={149}>Ch 149 (5GHz)</option>
                    <option value={69}>Ch 69 (6GHz Wi-Fi 6E)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Signal Strength: {newRssi} dBm
                </label>
                <input
                  type="range"
                  min="-95"
                  max="-30"
                  value={newRssi}
                  onChange={(e) => setNewRssi(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-95 dBm (Weak)</span>
                  <span>-30 dBm (Excellent)</span>
                </div>
              </div>

              {newSecurity !== Security.OPEN && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="auth_check"
                    checked={newAuthorized}
                    onChange={(e) => setNewAuthorized(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <label htmlFor="auth_check" className="text-slate-300">
                    Administrator has provisioned credentials (Authorized)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-lg font-medium"
                >
                  Save Access Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
