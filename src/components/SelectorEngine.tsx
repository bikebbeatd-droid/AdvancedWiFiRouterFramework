import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Network, ScoreDetails, SelectorWeights } from "../types.js";
import { defaultWeights } from "../core/selector.js";

interface SelectorEngineProps {
  networks: Network[];
  bestEvaluation: {
    best: { network: Network; score: number } | null;
    allScores: Array<{ network: Network; details: ScoreDetails }>;
  } | null;
  weights: SelectorWeights;
  onUpdateWeights: (weights: SelectorWeights) => void;
  onConnect: (ssid: string) => void;
  selectedBreakdownNetwork: Network | null;
  onSelectBreakdownNetwork: (network: Network | null) => void;
}

export const SelectorEngine: React.FC<SelectorEngineProps> = ({
  networks,
  bestEvaluation,
  weights,
  onUpdateWeights,
  onConnect,
  selectedBreakdownNetwork,
  onSelectBreakdownNetwork,
}) => {
  const [localWeights, setLocalWeights] = useState<SelectorWeights>({ ...weights });
  const [hasChanges, setHasChanges] = useState(false);

  const handleWeightChange = (key: keyof SelectorWeights, val: number) => {
    const updated = { ...localWeights, [key]: val };
    setLocalWeights(updated);
    setHasChanges(true);
    onUpdateWeights(updated);
  };

  const handleResetWeights = () => {
    setLocalWeights({ ...defaultWeights });
    setHasChanges(false);
    onUpdateWeights({ ...defaultWeights });
  };

  const currentBreakdown = selectedBreakdownNetwork
    ? bestEvaluation?.allScores.find((s) => s.network.ssid === selectedBreakdownNetwork.ssid)?.details
    : bestEvaluation?.best
    ? bestEvaluation.allScores.find((s) => s.network.ssid === bestEvaluation.best?.network.ssid)?.details
    : null;

  const currentFocusNetwork =
    selectedBreakdownNetwork || bestEvaluation?.best?.network || (networks.length > 0 ? networks[0] : null);

  const sortedCandidates = bestEvaluation?.allScores
    ? [...bestEvaluation.allScores].sort((a, b) => b.details.total - a.details.total)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner with Selector Concept */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-base">
            <ShieldCheck className="h-5 w-5" />
            <h3>Deterministic Scoring & Selection Engine</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Calculates an unassailable mathematical score for all open and authorized networks.
            Protected networks without credentials receive <code className="text-rose-400 font-mono">-Infinity</code> to prevent unauthorized authentication bypass.
          </p>
        </div>

        {bestEvaluation?.best && (
          <div className="bg-blue-950/40 border border-blue-500/40 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Award className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <span className="text-[11px] text-blue-300 font-medium block">
                Top Candidate (Score: {bestEvaluation.best.score.toFixed(3)})
              </span>
              <span className="text-sm font-semibold text-white">
                {bestEvaluation.best.network.ssid}
              </span>
            </div>
            <button
              onClick={() => onConnect(bestEvaluation.best!.network.ssid)}
              className="ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              Connect
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Interactive Weight Adjuster */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              Weight Matrix Tuning
            </h4>
            <button
              onClick={handleResetWeights}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              title="Reset to framework defaults"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Adjust multi-objective scoring priorities in real time:
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Signal (RSSI dBm)</span>
                <span className="font-mono text-blue-400">{(localWeights.signal * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.60"
                step="0.05"
                value={localWeights.signal}
                onChange={(e) => handleWeightChange("signal", parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500">Normalizes (rssi + 100) / 60 into [0, 1]</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Link Quality</span>
                <span className="font-mono text-blue-400">{(localWeights.quality * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.60"
                step="0.05"
                value={localWeights.quality}
                onChange={(e) => handleWeightChange("quality", parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500">Direct physical link quality [0, 1]</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Latency (RTT Ping)</span>
                <span className="font-mono text-blue-400">{(localWeights.latency * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.60"
                step="0.05"
                value={localWeights.latency}
                onChange={(e) => handleWeightChange("latency", parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500">Inverse score: 1.0 - latency / 500ms</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Packet Loss Tolerance</span>
                <span className="font-mono text-blue-400">{(localWeights.packet_loss * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.60"
                step="0.05"
                value={localWeights.packet_loss}
                onChange={(e) => handleWeightChange("packet_loss", parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500">Inverse score: 1.0 - loss_pct / 100</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Historical Stability</span>
                <span className="font-mono text-blue-400">{(localWeights.stability * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.60"
                step="0.05"
                value={localWeights.stability}
                onChange={(e) => handleWeightChange("stability", parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500">Connection persistence & beacon consistency</span>
            </div>
          </div>
        </div>

        {/* Column 2: Candidate Ranking Table */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span>Ranked Candidates</span>
            <span className="text-xs text-slate-500 font-normal">Deterministic Order</span>
          </h4>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {sortedCandidates.map((item, index) => {
              const isSelected = currentFocusNetwork?.ssid === item.network.ssid;
              const isBest = index === 0 && item.details.eligible;

              return (
                <div
                  key={item.network.ssid}
                  onClick={() => onSelectBreakdownNetwork(item.network)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-900/30 border-blue-500/50"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-xs font-mono font-bold w-5 h-5 rounded flex items-center justify-center ${
                          isBest
                            ? "bg-amber-500/20 text-amber-300"
                            : item.details.eligible
                            ? "bg-slate-800 text-slate-300"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {item.network.ssid}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      {item.details.eligible ? (
                        <span className="text-xs font-bold text-blue-400">
                          {item.details.total.toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-400 uppercase font-semibold">
                          -Infinity
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{item.network.security.toUpperCase()}</span>
                    <span>{item.network.rssi_dbm} dBm</span>
                    <span>{item.network.latency_ms?.toFixed(0)} ms</span>
                    <span>{item.details.eligible ? "Eligible" : "Blocked"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Mathematical Formula Breakdown */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span>Score Calculation Breakdown</span>
            {currentFocusNetwork && (
              <span className="text-xs text-blue-400 font-mono font-normal">
                {currentFocusNetwork.ssid}
              </span>
            )}
          </h4>

          {currentBreakdown ? (
            currentBreakdown.eligible ? (
              <div className="space-y-4">
                {/* Total Score Banner */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Composite Score:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {currentBreakdown.total.toFixed(4)}
                  </span>
                </div>

                {/* Subscore Components */}
                <div className="space-y-2.5 text-xs font-mono">
                  {Object.entries(currentBreakdown.subscores).map(([key, sub]) => (
                    <div key={key} className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                      <div className="flex justify-between items-center text-slate-300 mb-1">
                        <span className="capitalize font-sans font-medium text-slate-300">
                          {key.replace("_", " ")}
                        </span>
                        <span className="text-blue-400 font-semibold">
                          +{sub.weighted.toFixed(3)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, sub.normalized * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>raw: {sub.raw ?? "null"}</span>
                        <span>norm: {sub.normalized.toFixed(2)}</span>
                        <span>wt: {sub.weight.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {currentFocusNetwork && (
                  <button
                    onClick={() => onConnect(currentFocusNetwork.ssid)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-sm transition"
                  >
                    Connect to {currentFocusNetwork.ssid}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl text-center space-y-2">
                <XCircle className="h-8 w-8 text-rose-400 mx-auto" />
                <h5 className="text-sm font-semibold text-rose-300">Ineligible for Auto-Selection</h5>
                <p className="text-xs text-slate-400">
                  {currentBreakdown.ineligibilityReason ||
                    "Security policy forbids connecting to protected networks without explicit saved credentials."}
                </p>
              </div>
            )
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              Select a candidate network to inspect its mathematical subscores.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
