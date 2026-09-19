import React from "react";
import { Cpu, CheckCircle2, XCircle, Shield, Radio, Layers, Zap } from "lucide-react";
import { WifiCapabilities } from "../types.js";

interface CapabilitiesInspectorProps {
  capabilities: WifiCapabilities;
  supportedFeaturesList: string[];
  onToggleCapability: (capKey: keyof WifiCapabilities, enabled: boolean) => void;
}

export const CapabilitiesInspector: React.FC<CapabilitiesInspectorProps> = ({
  capabilities,
  supportedFeaturesList,
  onToggleCapability,
}) => {
  const capabilityGroups = [
    {
      title: "Frequency Bands (Physical PHY)",
      items: [
        {
          key: "bands_2ghz" as keyof WifiCapabilities,
          label: "2.4 GHz Band (Legacy & IoT)",
          desc: "Supports 802.11b/g/n channels 1-14 with high wall penetration.",
        },
        {
          key: "bands_5ghz" as keyof WifiCapabilities,
          label: "5 GHz Band (High Throughput)",
          desc: "Supports 802.11a/n/ac/ax UNII-1/2/3 channels for low congestion.",
        },
        {
          key: "bands_6ghz" as keyof WifiCapabilities,
          label: "6 GHz Band (Wi-Fi 6E / Wi-Fi 7)",
          desc: "Supports ultra-wide 160MHz channels in 5.925–7.125 GHz spectrum.",
        },
      ],
    },
    {
      title: "Operating Modes & Orchestration",
      items: [
        {
          key: "ap" as keyof WifiCapabilities,
          label: "Access Point (AP Mode)",
          desc: "hostapd master mode broadcasting BSSID for wireless clients.",
        },
        {
          key: "sta" as keyof WifiCapabilities,
          label: "Station (STA / Client Mode)",
          desc: "wpa_supplicant managed mode for connecting to upstream WAN/WISP.",
        },
        {
          key: "concurrent_ap_sta" as keyof WifiCapabilities,
          label: "Concurrent Dual-Role AP + STA",
          desc: "Virtual interface virtualization allowing simultaneous WISP uplink and local AP downlink.",
        },
        {
          key: "mesh_80211s" as keyof WifiCapabilities,
          label: "802.11s Wireless Mesh",
          desc: "Peer-to-peer decentralized mesh routing protocol without central AP.",
        },
      ],
    },
    {
      title: "Fast Roaming & Assisted Steering",
      items: [
        {
          key: "ieee80211k" as keyof WifiCapabilities,
          label: "IEEE 802.11k (Radio Resource Measurement)",
          desc: "Provides neighbor AP reports to optimize client roaming decisions.",
        },
        {
          key: "ieee80211v" as keyof WifiCapabilities,
          label: "IEEE 802.11v (Wireless Network Management)",
          desc: "Directs stations to switch to optimal BSSIDs under load conditions.",
        },
        {
          key: "ieee80211r" as keyof WifiCapabilities,
          label: "IEEE 802.11r (Fast BSS Transition)",
          desc: "Zero-loss cryptographic key caching for sub-50ms handoffs.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-400" />
            Hardware Capabilities & Safe Feature Gating
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Detects underlying wireless chipset features from nl80211. Features are strictly gated so unsupported radios or bands are never assumed during network negotiation.
          </p>
        </div>

        <div className="bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Active Features:</span>
          <span className="font-mono font-bold text-blue-400">
            {supportedFeaturesList.length} / {Object.keys(capabilities).length}
          </span>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {capabilityGroups.map((group) => (
          <div key={group.title} className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
              {group.title}
            </h4>

            <div className="space-y-3">
              {group.items.map((item) => {
                const isEnabled = Boolean(capabilities[item.key]);
                return (
                  <div
                    key={item.key}
                    className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">{item.label}</span>
                      <button
                        onClick={() => onToggleCapability(item.key, !isEnabled)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase transition ${
                          isEnabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
