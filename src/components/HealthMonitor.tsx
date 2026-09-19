import React, { useState } from "react";
import {
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Send,
  Gauge,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { HealthSample } from "../types.js";
import { healthScore } from "../core/health.js";

interface HealthMonitorProps {
  history: Array<{ timestamp: string; sample: HealthSample; score: number }>;
  onSendProbe: (sample: HealthSample) => void;
}

export const HealthMonitor: React.FC<HealthMonitorProps> = ({ history, onSendProbe }) => {
  const [probeLatency, setProbeLatency] = useState(18.5);
  const [probeLoss, setProbeLoss] = useState(0.0);
  const [probeQuality, setProbeQuality] = useState(0.95);

  const latest = history[history.length - 1] || {
    sample: { latency_ms: 20, packet_loss_pct: 0, link_quality: 0.9 },
    score: 0.88,
    timestamp: new Date().toISOString(),
  };

  const currentScore = latest.score;

  const handleCustomProbeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendProbe({
      latency_ms: Number(probeLatency),
      packet_loss_pct: Number(probeLoss),
      link_quality: Number(probeQuality),
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.75) return "text-emerald-400";
    if (score >= 0.45) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Connection Health & Telemetry Scoring
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Monitors real-time link quality, round-trip ping latency, and packet loss using the framework formula:
            <code className="text-blue-300 font-mono ml-1">
              Score = Latency(35%) + Loss(35%) + LinkQuality(30%)
            </code>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/60 px-5 py-3 rounded-xl border border-slate-800">
          <Gauge className="h-8 w-8 text-blue-400 shrink-0" />
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Composite Health Index</span>
            <span className={`text-2xl font-bold font-mono ${getScoreColor(currentScore)}`}>
              {(currentScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Ping Latency (RTT)</span>
            <span className="font-mono text-blue-400">Weight: 35%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {latest.sample.latency_ms !== null ? `${latest.sample.latency_ms.toFixed(1)} ms` : "N/A"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Target: &lt; 50ms (Ceiling: 500ms)
          </p>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Packet Loss Rate</span>
            <span className="font-mono text-blue-400">Weight: 35%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {latest.sample.packet_loss_pct !== null
              ? `${latest.sample.packet_loss_pct.toFixed(1)}%`
              : "0.0%"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Target: 0.0% loss (Ceiling: 100%)
          </p>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Physical Link Quality</span>
            <span className="font-mono text-blue-400">Weight: 30%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {latest.sample.link_quality !== null
              ? `${(latest.sample.link_quality * 100).toFixed(0)}%`
              : "N/A"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Normalized 802.11 link frame SNR
          </p>
        </div>
      </div>

      {/* Health History & Live Probe Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health History Sparkline / Bars */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Telemetry Probe History (Last {history.length} samples)
            </h4>
            <span className="text-xs text-slate-500">Auto-sampled every 10s</span>
          </div>

          <div className="h-48 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800">
            {history.map((entry, idx) => {
              const heightPct = Math.max(5, Math.min(100, entry.score * 100));
              const barColor =
                entry.score >= 0.75
                  ? "bg-emerald-500/80 hover:bg-emerald-400"
                  : entry.score >= 0.45
                  ? "bg-amber-500/80 hover:bg-amber-400"
                  : "bg-rose-500/80 hover:bg-rose-400";

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full mb-2 z-20 bg-slate-950 border border-slate-700 p-2 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl">
                    <div>Score: {(entry.score * 100).toFixed(1)}%</div>
                    <div>Lat: {entry.sample.latency_ms?.toFixed(1)}ms</div>
                    <div>Loss: {entry.sample.packet_loss_pct?.toFixed(1)}%</div>
                    <div>Quality: {((entry.sample.link_quality ?? 0) * 100).toFixed(0)}%</div>
                    <div className="text-slate-500 text-[9px]">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${barColor}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
            <span>Older probes</span>
            <span>Latest probe</span>
          </div>
        </div>

        {/* Live Probe Injector */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-400" />
            Inject Test Health Probe
          </h4>
          <p className="text-xs text-slate-400">
            Simulate network conditions to test router degradation and recovery thresholds:
          </p>

          <form onSubmit={handleCustomProbeSubmit} className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Simulated Latency: {probeLatency} ms</span>
              </div>
              <input
                type="range"
                min="5"
                max="350"
                value={probeLatency}
                onChange={(e) => setProbeLatency(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Packet Loss: {probeLoss}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={probeLoss}
                onChange={(e) => setProbeLoss(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Link Quality: {(probeQuality * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={probeQuality}
                onChange={(e) => setProbeQuality(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="pt-2">
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800 mb-3 flex justify-between font-mono">
                <span>Projected Score:</span>
                <span className="font-bold text-blue-400">
                  {(
                    healthScore({
                      latency_ms: probeLatency,
                      packet_loss_pct: probeLoss,
                      link_quality: probeQuality,
                    }) * 100
                  ).toFixed(1)}
                  %
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-sm transition"
              >
                Record Health Probe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
