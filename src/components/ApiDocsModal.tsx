import React, { useState } from "react";
import { Terminal, Copy, Check, ExternalLink } from "lucide-react";

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const endpoints = [
    {
      method: "GET",
      path: "/api/status",
      desc: "Full system state, active AP, health score, capabilities summary.",
      curl: "curl -s http://localhost:3000/api/status",
    },
    {
      method: "GET",
      path: "/api/networks",
      desc: "List all normalized beacon probe scan records.",
      curl: "curl -s http://localhost:3000/api/networks",
    },
    {
      method: "POST",
      path: "/api/networks/scan",
      desc: "Trigger hardware channel scan on 2.4/5/6GHz radios.",
      curl: "curl -X POST http://localhost:3000/api/networks/scan",
    },
    {
      method: "POST",
      path: "/api/networks/authorize",
      desc: "Provision or revoke pre-shared credentials for an SSID.",
      curl: `curl -X POST http://localhost:3000/api/networks/authorize -H 'Content-Type: application/json' -d '{"ssid":"HomeOffice_5G","authorized":true}'`,
    },
    {
      method: "GET",
      path: "/api/selector/choose",
      desc: "Compute deterministic score rankings and optimal AP recommendation.",
      curl: "curl -s http://localhost:3000/api/selector/choose",
    },
    {
      method: "POST",
      path: "/api/health/sample",
      desc: "Record RTT latency, packet loss, and link quality probe telemetry.",
      curl: `curl -X POST http://localhost:3000/api/health/sample -H 'Content-Type: application/json' -d '{"latency_ms":18.4,"packet_loss_pct":0.0,"link_quality":0.95}'`,
    },
    {
      method: "POST",
      path: "/api/state/transition",
      desc: "Transition connection machine state (idle, scanning, connecting, connected, degraded, recovering, failed).",
      curl: `curl -X POST http://localhost:3000/api/state/transition -H 'Content-Type: application/json' -d '{"state":"connected","reason":"Manual association"}'`,
    },
    {
      method: "GET",
      path: "/api/capabilities",
      desc: "Hardware Wi-Fi features and supported 802.11 bands.",
      curl: "curl -s http://localhost:3000/api/capabilities",
    },
    {
      method: "GET",
      path: "/api/config",
      desc: "Router policies, selector weights, and health thresholds.",
      curl: "curl -s http://localhost:3000/api/config",
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Machine-Readable REST API Endpoints
              </h3>
              <p className="text-xs text-slate-400">
                Integration layer for OpenWrt, hostapd, wpa_supplicant, and remote web/mobile dashboards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Endpoints List */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {endpoints.map((ep, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                      ep.method === "GET"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {ep.path}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(ep.curl, idx)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 hover:border-slate-700 transition"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>cURL</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400">{ep.desc}</p>

              <div className="bg-slate-900/90 p-2 rounded text-[11px] font-mono text-blue-300 overflow-x-auto">
                {ep.curl}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
