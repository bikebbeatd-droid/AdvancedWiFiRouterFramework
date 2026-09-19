import { Network, Security } from "./models.js";
import { ConnectionMachine, ConnectionState } from "./state.js";
import { WifiCapabilities, defaultCapabilities } from "./capabilities.js";
import { RouterConfig, defaultRouterConfig } from "./config.js";
import { healthScore, HealthSample } from "./health.js";
import { chooseNetwork, scoreBreakdown, ScoreDetails, SelectorWeights } from "./selector.js";

export class RouterEngine {
  public config: RouterConfig;
  public stateMachine: ConnectionMachine;
  public capabilities: WifiCapabilities;
  public networks: Network[];
  public activeNetworkSsid: string | null;
  public healthHistory: Array<{
    timestamp: string;
    sample: HealthSample;
    score: number;
  }>;

  constructor() {
    this.config = JSON.parse(JSON.stringify(defaultRouterConfig));
    this.stateMachine = new ConnectionMachine(ConnectionState.CONNECTED);
    this.capabilities = { ...defaultCapabilities };
    this.activeNetworkSsid = "HomeOffice_5G";
    this.healthHistory = [];

    // Seed realistic networks
    this.networks = [
      {
        ssid: "HomeOffice_5G",
        bssid: "74:83:C2:11:AA:01",
        channel: 36,
        frequency_mhz: 5180,
        rssi_dbm: -52,
        security: Security.WPA3,
        authorized: true,
        quality: 0.92,
        latency_ms: 18.4,
        packet_loss_pct: 0.0,
        stability: 0.98,
        metadata: { vendor: "OpenWrt AP", band: "5GHz", mode: "802.11ax" },
      },
      {
        ssid: "CommunityMesh_Public",
        bssid: "1A:2B:3C:4D:5E:6F",
        channel: 6,
        frequency_mhz: 2437,
        rssi_dbm: -64,
        security: Security.OPEN,
        authorized: false,
        quality: 0.74,
        latency_ms: 42.0,
        packet_loss_pct: 1.2,
        stability: 0.85,
        metadata: { vendor: "Municipal WISP", band: "2.4GHz", mode: "802.11n" },
      },
      {
        ssid: "CoffeeShop_Guest",
        bssid: "44:D9:E7:99:88:77",
        channel: 149,
        frequency_mhz: 5745,
        rssi_dbm: -71,
        security: Security.OPEN,
        authorized: false,
        quality: 0.61,
        latency_ms: 68.5,
        packet_loss_pct: 3.5,
        stability: 0.72,
        metadata: { vendor: "Ubiquiti UniFi", band: "5GHz", mode: "802.11ac" },
      },
      {
        ssid: "SecureCorp_Backup",
        bssid: "E8:48:B8:33:22:11",
        channel: 11,
        frequency_mhz: 2462,
        rssi_dbm: -45,
        security: Security.WPA2,
        authorized: false,
        quality: 0.89,
        latency_ms: 14.2,
        packet_loss_pct: 0.0,
        stability: 0.95,
        metadata: { vendor: "Cisco Catalyst", band: "2.4GHz", mode: "802.11ax" },
      },
      {
        ssid: "IoT_Gateway_Direct",
        bssid: "90:9A:4A:22:19:80",
        channel: 1,
        frequency_mhz: 2412,
        rssi_dbm: -79,
        security: Security.WPA_PSK,
        authorized: true,
        quality: 0.55,
        latency_ms: 120.0,
        packet_loss_pct: 8.0,
        stability: 0.6,
        metadata: { vendor: "ESP32 Mesh", band: "2.4GHz", mode: "802.11b/g/n" },
      },
      {
        ssid: "Metro_HighSpeed_6G",
        bssid: "CC:32:E5:00:12:44",
        channel: 69,
        frequency_mhz: 6295,
        rssi_dbm: -58,
        security: Security.WPA3,
        authorized: false,
        quality: 0.96,
        latency_ms: 9.2,
        packet_loss_pct: 0.0,
        stability: 0.99,
        metadata: { vendor: "Wi-Fi 6E TriBand", band: "6GHz", mode: "802.11axe" },
      },
    ];

    // Seed initial health history
    const now = Date.now();
    for (let i = 10; i >= 0; i--) {
      const sample: HealthSample = {
        latency_ms: Math.max(12, 18 + Math.sin(i) * 6 + (Math.random() * 4 - 2)),
        packet_loss_pct: Math.max(0, Math.random() < 0.2 ? Math.random() * 1.5 : 0),
        link_quality: Math.min(1.0, 0.92 + Math.cos(i) * 0.04),
      };
      this.healthHistory.push({
        timestamp: new Date(now - i * 10000).toISOString(),
        sample,
        score: healthScore(sample),
      });
    }
  }

  public getNetworks(): Network[] {
    return this.networks;
  }

  public getNetworkBySsid(ssid: string): Network | undefined {
    return this.networks.find((n) => n.ssid === ssid);
  }

  public addOrUpdateNetwork(network: Network): Network {
    const idx = this.networks.findIndex((n) => n.ssid === network.ssid);
    if (idx >= 0) {
      this.networks[idx] = { ...this.networks[idx], ...network };
      return this.networks[idx];
    } else {
      this.networks.push(network);
      return network;
    }
  }

  public setAuthorized(ssid: string, authorized: boolean): Network | null {
    const net = this.networks.find((n) => n.ssid === ssid);
    if (!net) return null;
    net.authorized = authorized;
    return net;
  }

  public rescan(randomizeJitter: boolean = true): Network[] {
    if (randomizeJitter) {
      this.networks.forEach((n) => {
        if (n.rssi_dbm !== undefined) {
          const delta = Math.floor(Math.random() * 7) - 3;
          n.rssi_dbm = Math.min(-30, Math.max(-95, n.rssi_dbm + delta));
        }
        if (n.latency_ms !== undefined) {
          const lDelta = (Math.random() * 6 - 3);
          n.latency_ms = Math.max(5, n.latency_ms + lDelta);
        }
      });
    }
    return this.networks;
  }

  public recordHealthSample(sample: HealthSample) {
    const score = healthScore(sample);
    const entry = {
      timestamp: new Date().toISOString(),
      sample,
      score,
    };
    this.healthHistory.push(entry);
    if (this.healthHistory.length > 50) {
      this.healthHistory.shift();
    }

    // Auto-state adjustment if in connected state
    if (score < 0.4 && this.stateMachine.state === ConnectionState.CONNECTED) {
      this.stateMachine.transition(ConnectionState.DEGRADED, "Health score dropped below 0.40");
    } else if (score >= 0.75 && this.stateMachine.state === ConnectionState.DEGRADED) {
      this.stateMachine.transition(ConnectionState.CONNECTED, "Health score recovered above 0.75");
    }

    return entry;
  }

  public selectBestNetwork(weights?: SelectorWeights): {
    best: { network: Network; score: number } | null;
    allScores: Array<{ network: Network; details: ScoreDetails }>;
  } {
    const activeWeights = weights || this.config.selector.weights;
    const best = chooseNetwork(this.networks, activeWeights);
    const allScores = this.networks.map((n) => ({
      network: n,
      details: scoreBreakdown(n, activeWeights),
    }));

    return { best, allScores };
  }
}

export const globalRouterEngine = new RouterEngine();
