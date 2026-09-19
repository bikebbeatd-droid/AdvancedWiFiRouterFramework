import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { globalRouterEngine } from "./src/core/store.js";
import { ConnectionState } from "./src/core/state.js";
import { Security } from "./src/core/models.js";
import { supportedFeatures } from "./src/core/capabilities.js";
import { defaultRouterConfig } from "./src/core/config.js";
import { createHardwareRuntime } from "./src/adapters/runtime.js";
import { isCredentialStoreConfigured, listCredentialProfiles, removeCredentialProfile, upsertCredentialProfile } from "./src/core/credentials.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const WIFI_INTERFACE = process.env.IFACE || "wlan0";
  const hardware = createHardwareRuntime();

  app.use(express.json());

  const requireAdminToken = (req: express.Request, res: express.Response): boolean => {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
      res.status(503).json({ error: "ADMIN_API_TOKEN is not configured" });
      return false;
    }
    const supplied = req.header("x-admin-token");
    if (!supplied || supplied !== expected) {
      res.status(401).json({ error: "Admin authentication required" });
      return false;
    }
    return true;
  };


  // --- REST API ROUTES FIRST ---

  // Encrypted WISP credential profiles. Passwords are accepted only on write and never returned.
  app.get("/api/credentials", async (req, res) => {
    if (!requireAdminToken(req, res)) return;
    if (!isCredentialStoreConfigured()) {
      res.status(503).json({ configured: false, error: "CREDENTIAL_STORE_KEY is not configured" });
      return;
    }
    res.json({ configured: true, profiles: await listCredentialProfiles() });
  });

  app.post("/api/credentials", async (req, res) => {
    if (!requireAdminToken(req, res)) return;
    if (!isCredentialStoreConfigured()) {
      res.status(503).json({ configured: false, error: "CREDENTIAL_STORE_KEY is not configured" });
      return;
    }
    const { id, ssid, security, password } = req.body || {};
    if (typeof ssid !== "string" || typeof password !== "string" || password.length === 0) {
      res.status(400).json({ error: "ssid and password are required" });
      return;
    }
    try {
      const profile = await upsertCredentialProfile({
        id,
        ssid,
        security: security || Security.WPA2,
        password,
      });
      res.status(201).json({ success: true, profile });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Credential save failed" });
    }
  });

  app.delete("/api/credentials/:id", async (req, res) => {
    if (!requireAdminToken(req, res)) return;
    if (!isCredentialStoreConfigured()) {
      res.status(503).json({ configured: false, error: "CREDENTIAL_STORE_KEY is not configured" });
      return;
    }
    const removed = await removeCredentialProfile(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Credential profile not found" });
      return;
    }
    res.json({ success: true });
  });



  // Health / Status Check
  app.get("/api/health", (req, res) => {
    const latestHealth =
      globalRouterEngine.healthHistory[globalRouterEngine.healthHistory.length - 1];
    res.json({
      status: "ok",
      state: globalRouterEngine.stateMachine.state,
      activeNetwork: globalRouterEngine.activeNetworkSsid,
      latestHealthScore: latestHealth ? latestHealth.score : 1.0,
      history: globalRouterEngine.healthHistory,
    });
  });

  // Comprehensive System Status
  app.get("/api/status", async (req, res) => {
    const latestHealth =
      globalRouterEngine.healthHistory[globalRouterEngine.healthHistory.length - 1];
    const selection = globalRouterEngine.selectBestNetwork();
    const active = globalRouterEngine.getNetworkBySsid(
      globalRouterEngine.activeNetworkSsid || ""
    );
    const healthScoreValue = latestHealth ? latestHealth.score : 1.0;
    let hardwareSnapshot = null;
    if (hardware.adapter) {
      try { hardwareSnapshot = await hardware.adapter.snapshot(WIFI_INTERFACE); } catch { hardwareSnapshot = null; }
    }
    res.json({
      system: "Advanced WiFi Router Framework",
      version: "0.1.0",
      state: globalRouterEngine.stateMachine.state,
      mode: globalRouterEngine.stateMachine.state.toUpperCase(),
      uplink: active?.ssid || null,
      signal_dbm: hardwareSnapshot?.signal_dbm ?? active?.rssi_dbm ?? null,
      latency_ms: latestHealth?.sample.latency_ms ?? active?.latency_ms ?? null,
      packet_loss_pct: latestHealth?.sample.packet_loss_pct ?? active?.packet_loss_pct ?? null,
      clients: hardwareSnapshot?.clients ?? null,
      health: Math.round(healthScoreValue * 100),
      activeNetwork: active || null,
      recommendedNetwork: selection.best?.network || null,
      healthScore: healthScoreValue,
      networkCount: globalRouterEngine.networks.length,
      supportedFeatures: supportedFeatures(globalRouterEngine.capabilities),
      policy: globalRouterEngine.config.policy,
      hardwareStatus: hardwareSnapshot ? { gateway: hardwareSnapshot.gateway, dns: hardwareSnapshot.dns, interface: WIFI_INTERFACE } : null,
      timestamp: new Date().toISOString(),
    });
  });

  // Networks List
  app.get("/api/networks", (req, res) => {
    res.json(globalRouterEngine.getNetworks());
  });

  // Trigger Scanner
  app.post("/api/networks/scan", async (req, res) => {
    if (hardware.adapter) {
      try {
        const scanned = await hardware.adapter.scan(WIFI_INTERFACE);
        const updated = scanned.map((network) => {
          const previous = globalRouterEngine.getNetworkBySsid(network.ssid);
          return { ...network, authorized: previous?.authorized ?? false, stability: previous?.stability ?? 0 };
        });
        updated.forEach((network) => globalRouterEngine.addOrUpdateNetwork(network));
        res.json({ success: true, source: "hardware", count: updated.length, networks: updated });
      } catch (error) {
        res.status(503).json({ success: false, source: "hardware", error: error instanceof Error ? error.message : "Hardware scan failed" });
      }
      return;
    }
    globalRouterEngine.stateMachine.transition(
      ConnectionState.SCANNING,
      "Initiated Wi-Fi environment channel scan"
    );
    const updated = globalRouterEngine.rescan(true);
    // After scanning, return to connected/idle
    setTimeout(() => {
      if (globalRouterEngine.stateMachine.state === ConnectionState.SCANNING) {
        globalRouterEngine.stateMachine.transition(
          ConnectionState.CONNECTED,
          "Scan completed, restored active link"
        );
      }
    }, 1500);

    res.json({
      success: true,
      count: updated.length,
      networks: updated,
    });
  });

  // Authorize Network
  app.post("/api/networks/authorize", (req, res) => {
    const { ssid, authorized } = req.body;
    if (!ssid || typeof authorized !== "boolean") {
      res.status(400).json({ error: "Missing required fields: ssid (string) and authorized (boolean)" });
      return;
    }
    const updated = globalRouterEngine.setAuthorized(ssid, authorized);
    if (!updated) {
      res.status(404).json({ error: `Network ${ssid} not found in scan table` });
      return;
    }
    res.json({ success: true, network: updated });
  });

  // Add / Edit Network
  app.post("/api/networks", (req, res) => {
    const { ssid, security, rssi_dbm, channel, frequency_mhz, authorized, quality, latency_ms, packet_loss_pct, stability, metadata } = req.body;
    if (!ssid) {
      res.status(400).json({ error: "SSID is required" });
      return;
    }

    const network = {
      ssid,
      security: security || Security.OPEN,
      rssi_dbm: typeof rssi_dbm === "number" ? rssi_dbm : -60,
      channel: typeof channel === "number" ? channel : 6,
      frequency_mhz: typeof frequency_mhz === "number" ? frequency_mhz : 2437,
      authorized: Boolean(authorized),
      quality: typeof quality === "number" ? quality : 0.8,
      latency_ms: typeof latency_ms === "number" ? latency_ms : 25,
      packet_loss_pct: typeof packet_loss_pct === "number" ? packet_loss_pct : 0,
      stability: typeof stability === "number" ? stability : 0.9,
      metadata: metadata || {},
    };

    const saved = globalRouterEngine.addOrUpdateNetwork(network);
    res.json({ success: true, network: saved });
  });

  // Network Selection Evaluation
  app.get("/api/selector/choose", (req, res) => {
    const result = globalRouterEngine.selectBestNetwork();
    res.json(result);
  });

  // Update Selector Weights
  app.post("/api/selector/weights", (req, res) => {
    const weights = req.body;
    if (weights) {
      globalRouterEngine.config.selector.weights = {
        ...globalRouterEngine.config.selector.weights,
        ...weights,
      };
    }
    res.json({ success: true, weights: globalRouterEngine.config.selector.weights });
  });

  // Record Health Sample
  app.post("/api/health/sample", (req, res) => {
    const { latency_ms, packet_loss_pct, link_quality } = req.body;
    const sample = {
      latency_ms: typeof latency_ms === "number" ? latency_ms : null,
      packet_loss_pct: typeof packet_loss_pct === "number" ? packet_loss_pct : null,
      link_quality: typeof link_quality === "number" ? link_quality : null,
    };
    const recorded = globalRouterEngine.recordHealthSample(sample);
    res.json({ success: true, recorded });
  });

  // State Machine Management
  app.get("/api/state", (req, res) => {
    res.json({
      currentState: globalRouterEngine.stateMachine.state,
      activeNetworkSsid: globalRouterEngine.activeNetworkSsid,
      history: globalRouterEngine.stateMachine.history,
    });
  });

  app.post("/api/state/transition", (req, res) => {
    const { state, reason, targetSsid } = req.body;
    if (!state || !Object.values(ConnectionState).includes(state)) {
      res.status(400).json({
        error: `Invalid state. Must be one of: ${Object.values(ConnectionState).join(", ")}`,
      });
      return;
    }
    if (targetSsid !== undefined) {
      globalRouterEngine.activeNetworkSsid = targetSsid;
    }
    const newState = globalRouterEngine.stateMachine.transition(state, reason);
    res.json({ success: true, state: newState, activeNetwork: globalRouterEngine.activeNetworkSsid });
  });

  // Capabilities API
  app.get("/api/capabilities", (req, res) => {
    res.json({
      capabilities: globalRouterEngine.capabilities,
      supportedFeatures: supportedFeatures(globalRouterEngine.capabilities),
    });
  });

  app.post("/api/capabilities", (req, res) => {
    const updates = req.body;
    if (updates && typeof updates === "object") {
      globalRouterEngine.capabilities = {
        ...globalRouterEngine.capabilities,
        ...updates,
      };
    }
    res.json({
      success: true,
      capabilities: globalRouterEngine.capabilities,
      supportedFeatures: supportedFeatures(globalRouterEngine.capabilities),
    });
  });

  // Configuration API
  app.get("/api/config", (req, res) => {
    res.json(globalRouterEngine.config);
  });

  app.post("/api/config", (req, res) => {
    const updates = req.body;
    if (updates) {
      if (updates.policy) {
        globalRouterEngine.config.policy = {
          ...globalRouterEngine.config.policy,
          ...updates.policy,
        };
      }
      if (updates.selector) {
        globalRouterEngine.config.selector = {
          ...globalRouterEngine.config.selector,
          ...updates.selector,
        };
      }
      if (updates.health) {
        globalRouterEngine.config.health = {
          ...globalRouterEngine.config.health,
          ...updates.health,
        };
      }
    }
    res.json({ success: true, config: globalRouterEngine.config });
  });

  app.post("/api/config/reset", (req, res) => {
    globalRouterEngine.config = JSON.parse(JSON.stringify(defaultRouterConfig));
    res.json({ success: true, config: globalRouterEngine.config });
  });

  // Reconnect active authorized uplink (hardware adapter can replace this simulation)
  app.post("/api/reconnect", (req, res) => {
    const ssid = globalRouterEngine.activeNetworkSsid;
    const network = ssid ? globalRouterEngine.getNetworkBySsid(ssid) : null;
    if (!network) {
      res.status(404).json({ success: false, error: "No active network selected" });
      return;
    }
    if (!network.authorized && network.security !== Security.OPEN) {
      res.status(403).json({ success: false, error: "Network is not authorized" });
      return;
    }
    globalRouterEngine.stateMachine.transition(ConnectionState.CONNECTING, "Manual reconnect requested");
    globalRouterEngine.stateMachine.transition(ConnectionState.CONNECTED, "Reconnect completed");
    res.json({ success: true, ssid: network.ssid, state: globalRouterEngine.stateMachine.state });
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("{*all}", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Advanced WiFi Router Framework server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
