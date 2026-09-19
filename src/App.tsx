import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.js";
import { NetworkScanner } from "./components/NetworkScanner.js";
import { SelectorEngine } from "./components/SelectorEngine.js";
import { ConnectionManager } from "./components/ConnectionManager.js";
import { HealthMonitor } from "./components/HealthMonitor.js";
import { CapabilitiesInspector } from "./components/CapabilitiesInspector.js";
import { ConfigEditor } from "./components/ConfigEditor.js";
import { ApiDocsModal } from "./components/ApiDocsModal.js";
import {
  Network,
  SystemStatus,
  ConnectionState,
  ScoreDetails,
  SelectorWeights,
  WifiCapabilities,
  RouterConfig,
  HealthSample,
  StateTransitionEvent,
} from "./types.js";
import { defaultWeights } from "./core/selector.js";
import { defaultCapabilities, supportedFeatures } from "./core/capabilities.js";
import { defaultRouterConfig } from "./core/config.js";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("networks");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showApiDocs, setShowApiDocs] = useState<boolean>(false);

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [activeSsid, setActiveSsid] = useState<string | null>("HomeOffice_5G");
  const [currentState, setCurrentState] = useState<ConnectionState>(ConnectionState.CONNECTED);
  const [stateHistory, setStateHistory] = useState<StateTransitionEvent[]>([]);

  const [bestEvaluation, setBestEvaluation] = useState<{
    best: { network: Network; score: number } | null;
    allScores: Array<{ network: Network; details: ScoreDetails }>;
  } | null>(null);

  const [weights, setWeights] = useState<SelectorWeights>({ ...defaultWeights });
  const [selectedBreakdownNetwork, setSelectedBreakdownNetwork] = useState<Network | null>(null);
  const [healthHistory, setHealthHistory] = useState<
    Array<{ timestamp: string; sample: HealthSample; score: number }>
  >([]);
  const [capabilities, setCapabilities] = useState<WifiCapabilities>({ ...defaultCapabilities });
  const [config, setConfig] = useState<RouterConfig>({ ...defaultRouterConfig });

  // Fetch all live state from backend
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, netRes, selectRes, healthRes, stateRes, capRes, cfgRes] =
        await Promise.all([
          fetch("/api/status").then((r) => r.json()),
          fetch("/api/networks").then((r) => r.json()),
          fetch("/api/selector/choose").then((r) => r.json()),
          fetch("/api/health").then((r) => r.json()),
          fetch("/api/state").then((r) => r.json()),
          fetch("/api/capabilities").then((r) => r.json()),
          fetch("/api/config").then((r) => r.json()),
        ]);

      setStatus(statusRes);
      setNetworks(netRes);
      setBestEvaluation(selectRes);
      setActiveSsid(stateRes.activeNetworkSsid);
      setCurrentState(stateRes.currentState);
      setStateHistory(stateRes.history || []);
      setHealthHistory(healthRes.history || []);
      if (capRes.capabilities) setCapabilities(capRes.capabilities);
      if (cfgRes) {
        setConfig(cfgRes);
        if (cfgRes.selector?.weights) setWeights(cfgRes.selector.weights);
      }
    } catch (err) {
      console.error("Failed to fetch router state:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/networks/scan", { method: "POST" });
      const data = await res.json();
      if (data.networks) {
        setNetworks(data.networks);
      }
      // Refresh evaluation
      const evalRes = await fetch("/api/selector/choose").then((r) => r.json());
      setBestEvaluation(evalRes);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setTimeout(() => setIsScanning(false), 1200);
    }
  };

  const handleAuthorize = async (ssid: string, authorized: boolean) => {
    try {
      await fetch("/api/networks/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, authorized }),
      });
      fetchAllData();
    } catch (err) {
      console.error("Authorize failed:", err);
    }
  };

  const handleConnect = async (ssid: string) => {
    try {
      await fetch("/api/state/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: ConnectionState.CONNECTING,
          reason: `Associating to SSID: ${ssid}`,
          targetSsid: ssid,
        }),
      });
      setActiveSsid(ssid);
      setCurrentState(ConnectionState.CONNECTING);

      setTimeout(async () => {
        await fetch("/api/state/transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: ConnectionState.CONNECTED,
            reason: `DHCP lease bound to ${ssid}`,
            targetSsid: ssid,
          }),
        });
        fetchAllData();
      }, 1500);
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  const handleAddNetwork = async (newNet: Partial<Network>) => {
    try {
      await fetch("/api/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNet),
      });
      fetchAllData();
    } catch (err) {
      console.error("Add network failed:", err);
    }
  };

  const handleUpdateWeights = async (newWeights: SelectorWeights) => {
    setWeights(newWeights);
    try {
      await fetch("/api/selector/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWeights),
      });
      const evalRes = await fetch("/api/selector/choose").then((r) => r.json());
      setBestEvaluation(evalRes);
    } catch (err) {
      console.error("Update weights failed:", err);
    }
  };

  const handleStateTransition = async (newState: ConnectionState, reason: string) => {
    try {
      await fetch("/api/state/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState, reason }),
      });
      fetchAllData();
    } catch (err) {
      console.error("State transition failed:", err);
    }
  };

  const handleSendProbe = async (sample: HealthSample) => {
    try {
      await fetch("/api/health/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sample),
      });
      fetchAllData();
    } catch (err) {
      console.error("Send probe failed:", err);
    }
  };

  const handleToggleCapability = async (key: keyof WifiCapabilities, enabled: boolean) => {
    const updated = { ...capabilities, [key]: enabled };
    setCapabilities(updated);
    try {
      await fetch("/api/capabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: enabled }),
      });
    } catch (err) {
      console.error("Update capability failed:", err);
    }
  };

  const handleSaveConfig = async (newCfg: RouterConfig) => {
    setConfig(newCfg);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCfg),
      });
      fetchAllData();
    } catch (err) {
      console.error("Save config failed:", err);
    }
  };

  const handleResetConfig = async () => {
    try {
      await fetch("/api/config/reset", { method: "POST" });
      fetchAllData();
    } catch (err) {
      console.error("Reset config failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        status={status}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={fetchAllData}
        isRefreshing={isRefreshing}
        onOpenApiDocs={() => setShowApiDocs(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "networks" && (
          <NetworkScanner
            networks={networks}
            activeSsid={activeSsid}
            onScan={handleScan}
            isScanning={isScanning}
            onAuthorize={handleAuthorize}
            onConnect={handleConnect}
            onAddNetwork={handleAddNetwork}
            onSelectForBreakdown={(net) => {
              setSelectedBreakdownNetwork(net);
              setActiveTab("selector");
            }}
          />
        )}

        {activeTab === "selector" && (
          <SelectorEngine
            networks={networks}
            bestEvaluation={bestEvaluation}
            weights={weights}
            onUpdateWeights={handleUpdateWeights}
            onConnect={handleConnect}
            selectedBreakdownNetwork={selectedBreakdownNetwork}
            onSelectBreakdownNetwork={setSelectedBreakdownNetwork}
          />
        )}

        {activeTab === "health" && (
          <HealthMonitor history={healthHistory} onSendProbe={handleSendProbe} />
        )}

        {activeTab === "state" && (
          <ConnectionManager
            currentState={currentState}
            activeNetwork={networks.find((n) => n.ssid === activeSsid) || null}
            history={stateHistory}
            onTransition={handleStateTransition}
          />
        )}

        {activeTab === "hardware" && (
          <CapabilitiesInspector
            capabilities={capabilities}
            supportedFeaturesList={supportedFeatures(capabilities)}
            onToggleCapability={handleToggleCapability}
          />
        )}

        {activeTab === "config" && (
          <ConfigEditor
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetConfig={handleResetConfig}
          />
        )}
      </main>

      <ApiDocsModal isOpen={showApiDocs} onClose={() => setShowApiDocs(false)} />
    </div>
  );
}
export default App;
