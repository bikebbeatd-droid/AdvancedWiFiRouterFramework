import React, { useState } from "react";
import { Terminal, Save, RotateCcw, Copy, Check, ShieldCheck, Activity } from "lucide-react";
import { RouterConfig } from "../types.js";

interface ConfigEditorProps {
  config: RouterConfig;
  onSaveConfig: (config: RouterConfig) => void;
  onResetConfig: () => void;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({
  config,
  onSaveConfig,
  onResetConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<RouterConfig>(JSON.parse(JSON.stringify(config)));
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePolicyToggle = (key: keyof RouterConfig["policy"]) => {
    setLocalConfig({
      ...localConfig,
      policy: {
        ...localConfig.policy,
        [key]: !localConfig.policy[key],
      },
    });
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(localConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-400" />
            Router Policy & Dynamic Configuration
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Atomic configuration management matching <code className="text-blue-300 font-mono">config/example.json</code> with policy constraints and threshold triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetConfig}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-sm transition"
          >
            {savedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Apply Config</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Controls */}
        <div className="space-y-6">
          {/* Security & Authentication Policies */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              Security & Authentication Policy
            </h4>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.policy.allow_open_networks}
                  onChange={() => handlePolicyToggle("allow_open_networks")}
                  className="accent-blue-500 rounded mt-0.5"
                />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Allow Open Networks (allow_open_networks)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Permits connecting to unencrypted captive/public hotspots when no authorized AP is available.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.policy.allow_saved_credentials}
                  onChange={() => handlePolicyToggle("allow_saved_credentials")}
                  className="accent-blue-500 rounded mt-0.5"
                />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Allow Saved Credentials (allow_saved_credentials)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Allows automatic PSK/SAE handshake using credentials provisioned by admin.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.policy.never_bypass_authentication}
                  onChange={() => handlePolicyToggle("never_bypass_authentication")}
                  className="accent-blue-500 rounded mt-0.5"
                />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Never Bypass Authentication (never_bypass_authentication)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hard safety rule: strictly forbids attempting association to protected APs without pre-shared keys.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Selector & Health Thresholds */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Thresholds & Hysteresis
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Minimum RSSI Floor: {localConfig.selector.minimum_rssi_dbm} dBm
                </label>
                <input
                  type="range"
                  min="-95"
                  max="-65"
                  value={localConfig.selector.minimum_rssi_dbm}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      selector: {
                        ...localConfig.selector,
                        minimum_rssi_dbm: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Cutoff floor for candidate eligibility
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Switch Hysteresis: {localConfig.selector.switch_hysteresis} dBm
                </label>
                <input
                  type="range"
                  min="3"
                  max="25"
                  value={localConfig.selector.switch_hysteresis}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      selector: {
                        ...localConfig.selector,
                        switch_hysteresis: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Prevents flapping between equal-strength APs
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Probe Interval: {localConfig.health.probe_interval_seconds}s
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={localConfig.health.probe_interval_seconds}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      health: {
                        ...localConfig.health,
                        probe_interval_seconds: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Failure Threshold (probes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localConfig.health.failure_threshold}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      health: {
                        ...localConfig.health,
                        failure_threshold: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live JSON Preview */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 font-mono">
              config/example.json Schema
            </h4>
            <button
              onClick={handleCopyJson}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono text-blue-300 overflow-x-auto">
            {JSON.stringify(localConfig, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
