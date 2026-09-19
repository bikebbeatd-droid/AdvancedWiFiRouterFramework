import { Security, Network } from "../core/models.js";

export interface CommandRunner {
  run(command: string, args?: string[]): Promise<{ stdout: string; stderr: string; code: number }>;
}

export interface HardwareSnapshot {
  networks: Network[];
  active_ssid: string | null;
  signal_dbm: number | null;
  gateway: string | null;
  dns: string[];
  clients: number | null;
}

export interface WispConnectOptions {
  ssid: string;
  password?: string;
  security: Security;
  bssid?: string;
  radioDevice?: string;
  upstreamNetwork?: string;
}

export interface DiagnosticsResult {
  gateway: string | null;
  gateway_reachable: boolean | null;
  dns_servers: string[];
  dns_reachable: boolean | null;
  internet_reachable: boolean | null;
  latency_ms: number | null;
  packet_loss_pct: number | null;
}

function validateInterface(name: string): string {
  if (!/^(wlan|phy)[0-9]+$/.test(name)) throw new Error("Invalid wireless interface");
  return name;
}

export class OpenWrtAdapter {
  constructor(private readonly runner: CommandRunner) {}

  async scan(interfaceName = "wlan0"): Promise<Network[]> {
    const iface = validateInterface(interfaceName);
    const result = await this.runner.run("iw", ["dev", iface, "scan"]);
    if (result.code !== 0) throw new Error(result.stderr || "Wi-Fi scan failed");
    return parseIwScan(result.stdout);
  }

  async connectWisp(options: WispConnectOptions): Promise<{ success: boolean; detail: string }> {
    const ssid = options.ssid;
    const security = options.security;
    if (!ssid || ssid.length > 32) throw new Error("Invalid SSID");
    if (security !== Security.OPEN && (!options.password || options.password.length < 8 || options.password.length > 63)) {
      throw new Error("Protected Wi-Fi requires an 8-63 character credential");
    }
    const radio = options.radioDevice || "radio0";
    if (!/^(radio|wlan|phy)[0-9]+$/.test(radio)) throw new Error("Invalid radio device");
    const bssid = options.bssid;
    if (bssid && !/^[0-9A-Fa-f:]{17}$/.test(bssid)) throw new Error("Invalid BSSID");

    // This creates only the dedicated AWRF WWAN STA section; existing AP sections are not replaced.
    const commands: string[][] = [
      ["-q", "delete", "network.awrf_wwan"],
      ["set", "network.awrf_wwan=interface"],
      ["set", "network.awrf_wwan.proto=dhcp"],
      ["-q", "delete", "wireless.awrf_wisp"],
      ["set", "wireless.awrf_wisp=wifi-iface"],
      ["set", "wireless.awrf_wisp.device=" + radio],
      ["set", "wireless.awrf_wisp.network=awrf_wwan"],
      ["set", "wireless.awrf_wisp.mode=sta"],
      ["set", "wireless.awrf_wisp.ssid=" + ssid],
    ];
    for (const args of commands) {
      const result = await this.runner.run("uci", args);
      if (result.code !== 0) throw new Error(result.stderr || "UCI configuration failed");
    }
    if (security !== Security.OPEN) {
      const encryption = security === Security.WPA3 ? "sae" : security === Security.WPA_PSK ? "psk" : "psk2";
      for (const args of [
        ["set", "wireless.awrf_wisp.encryption=" + encryption],
        ["set", "wireless.awrf_wisp.key=" + options.password],
      ]) {
        const result = await this.runner.run("uci", args);
        if (result.code !== 0) throw new Error(result.stderr || "Wi-Fi credential configuration failed");
      }
    } else {
      const result = await this.runner.run("uci", ["set", "wireless.awrf_wisp.encryption=none"]);
      if (result.code !== 0) throw new Error(result.stderr || "Open Wi-Fi configuration failed");
    }
    if (bssid) {
      const result = await this.runner.run("uci", ["set", "wireless.awrf_wisp.bssid=" + bssid]);
      if (result.code !== 0) throw new Error(result.stderr || "BSSID configuration failed");
    }
    for (const config of ["network", "wireless"]) {
      const result = await this.runner.run("uci", ["commit", config]);
      if (result.code !== 0) throw new Error(result.stderr || "UCI commit failed");
    }
    const wifi = await this.runner.run("wifi", ["reload"]);
    if (wifi.code !== 0) throw new Error(wifi.stderr || "Wi-Fi reload failed");
    const up = await this.runner.run("ifup", ["awrf_wwan"]);
    if (up.code !== 0) throw new Error(up.stderr || "WWAN interface startup failed");
    return { success: true, detail: "WISP STA configuration applied and WWAN DHCP started" };
  }

  async disconnectWisp(): Promise<{ success: boolean }> {
    await this.runner.run("ifdown", ["awrf_wwan"]);
    await this.runner.run("uci", ["-q", "delete", "wireless.awrf_wisp"]);
    await this.runner.run("uci", ["-q", "delete", "network.awrf_wwan"]);
    await this.runner.run("uci", ["commit", "wireless"]);
    await this.runner.run("uci", ["commit", "network"]);
    await this.runner.run("wifi", ["reload"]);
    return { success: true };
  }

  async diagnostics(interfaceName = "awrf_wwan"): Promise<DiagnosticsResult> {
    if (!/^(wlan|phy|awrf_wwan|wwan)[0-9_-]*$/.test(interfaceName)) throw new Error("Invalid diagnostic interface");
    const route = await this.runner.run("ip", ["route"]);
    const gateway = parseGateway(route.stdout);
    const pingTarget = gateway || "1.1.1.1";
    const gatewayPing = gateway ? await this.runner.run("ping", ["-c", "3", "-W", "2", gateway]) : null;
    const internetPing = await this.runner.run("ping", ["-c", "3", "-W", "2", "1.1.1.1"]);
    const dnsFile = await this.runner.run("cat", ["/tmp/resolv.conf.d/resolv.conf.auto"]);
    const dnsText = dnsFile.code === 0 ? dnsFile.stdout : (await this.runner.run("cat", ["/etc/resolv.conf"])).stdout;
    const dnsServers = parseDns(dnsText);
    const dnsPing = dnsServers[0] ? await this.runner.run("ping", ["-c", "1", "-W", "2", dnsServers[0]) : null;
    const latency = parsePingLatency(internetPing.stdout);
    const loss = parsePingLoss(internetPing.stdout);
    return {
      gateway,
      gateway_reachable: gatewayPing ? gatewayPing.code === 0 : null,
      dns_servers: dnsServers,
      dns_reachable: dnsPing ? dnsPing.code === 0 : null,
      internet_reachable: internetPing.code === 0,
      latency_ms: latency,
      packet_loss_pct: loss,
    };
  }

  async snapshot(interfaceName = "wlan0"): Promise<HardwareSnapshot> {
    const iface = validateInterface(interfaceName);
    const link = await this.runner.run("iw", ["dev", iface, "link"]);
    const route = await this.runner.run("ip", ["route"]);
    const dns = await this.runner.run("cat", ["/tmp/resolv.conf.d/resolv.conf.auto"]);
    const dnsFallback = dns.code === 0 ? dns : await this.runner.run("cat", ["/etc/resolv.conf"]);
    const clients = await this.runner.run("iw", ["dev", iface, "station", "dump"]);
    const active = parseIwLink(link.stdout);
    return {
      networks: [],
      active_ssid: active.ssid,
      signal_dbm: active.signal_dbm,
      gateway: parseGateway(route.stdout),
      dns: parseDns(dnsFallback.stdout),
      clients: parseStationCount(clients.stdout),
    };
  }
}

function parsePingLatency(text: string): number | null {
  const m = text.match(/=\s*[\d.]+\/(\d+(?:\.\d+)?)\//);
  return m ? Number(m[1]) : null;
}

function parsePingLoss(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)%\s*packet loss/i);
  return m ? Number(m[1]) : null;
}

export function analyzeChannels(networks: Network[]) {
  const bands = new Map<string, Network[]>();
  for (const n of networks) {
    const band = n.frequency_mhz && n.frequency_mhz < 3000 ? "2.4GHz" : n.frequency_mhz && n.frequency_mhz < 5950 ? "5GHz" : "6GHz";
    const list = bands.get(band) || [];
    list.push(n);
    bands.set(band, list);
  }
  const result: Record<string, any> = {};
  for (const [band, list] of bands) {
    const occupancy = new Map<number, number>();
    for (const n of list) occupancy.set(n.channel || 0, (occupancy.get(n.channel || 0) || 0) + Math.max(1, Math.round((n.quality || 0.2) * 4)));
    const channels = [...occupancy.entries()].sort((a,b) => a[1]-b[1]);
    result[band] = {
      observed_networks: list.length,
      channel_load: Object.fromEntries(channels),
      recommended_channel: channels[0]?.[0] ?? null,
      note: band === "2.4GHz" ? "Prefer a legally permitted low-interference channel; do not exceed regulatory limits." : "Recommendation is based only on observed scan occupancy."
    };
  }
  return result;
}

export function parseStationCount(text: string): number | null {
  const count = [...text.matchAll(/^Station\s+\S+/gm)].length;
  return count > 0 ? count : text.trim() === "" ? 0 : null;
}

export function parseIwLink(text: string): { ssid: string | null; signal_dbm: number | null } {
  const ssid = text.match(/^\s*SSID:\s*(.*)$/m)?.[1]?.trim() || null;
  const signal = text.match(/^\s*signal:\s*(-?\d+(?:\.\d+)?)\s*dBm$/m)?.[1];
  return { ssid, signal_dbm: signal ? Number(signal) : null };
}

export function parseGateway(text: string): string | null {
  return text.match(/^default via (\S+)/m)?.[1] || null;
}

export function parseDns(text: string): string[] {
  return [...text.matchAll(/^\s*nameserver\s+(\S+)/gm)].map(m => m[1]);
}

function securityFromText(text: string): Security {
  if (/WPA3|SAE/i.test(text)) return Security.WPA3;
  if (/WPA2|RSN/i.test(text)) return Security.WPA2;
  if (/WPA|WEP/i.test(text)) return Security.WPA_PSK;
  return Security.OPEN;
}

function channelFromFrequency(freq: number | undefined): number | undefined {
  if (!freq) return undefined;
  if (freq >= 2412 && freq <= 2472) return Math.round((freq - 2407) / 5);
  if (freq === 2484) return 14;
  if (freq >= 5000 && freq <= 5900) return Math.round((freq - 5000) / 5);
  if (freq >= 5955 && freq <= 7115) return Math.round((freq - 5950) / 5);
  return undefined;
}

export function parseIwScan(text: string): Network[] {
  const blocks = text.split(/^BSS /m).slice(1);
  const parsed = blocks.map(block => {
    const bssid = block.split(/\s+/)[0] || undefined;
    const ssid = block.match(/^\s*SSID:\s*(.*)$/m)?.[1]?.trim() || "<hidden>";
    const signal = block.match(/^\s*signal:\s*(-?\d+(?:\.\d+)?)\s*dBm$/m)?.[1];
    const frequency = block.match(/^\s*freq:\s*(\d+)/m)?.[1];
    const freq = frequency ? Number(frequency) : undefined;
    const channelText = block.match(/^\s*DS Parameter set:\s*channel\s+(\d+)/m)?.[1];
    const channel = channelText ? Number(channelText) : channelFromFrequency(freq);
    const rssi = signal ? Number(signal) : undefined;
    return {
      ssid, bssid, channel, frequency_mhz: freq, rssi_dbm: rssi,
      security: securityFromText(block), authorized: false,
      quality: rssi === undefined ? 0 : Math.max(0, Math.min(1, (rssi + 90) / 60)),
      stability: 0,
      metadata: { source: "openwrt-iw" }
    };
  });
  const seen = new Set<string>();
  return parsed.filter(n => {
    const key = n.bssid || n.ssid;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
