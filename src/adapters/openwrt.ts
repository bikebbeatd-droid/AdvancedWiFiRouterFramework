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
