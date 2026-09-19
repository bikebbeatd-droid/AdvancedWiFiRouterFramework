import { Security, Network } from "../core/models.js";
import { RouterConfig } from "../core/config.js";

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

export class OpenWrtAdapter {
  constructor(private readonly runner: CommandRunner) {}

  async scan(interfaceName = "wlan0"): Promise<Network[]> {
    const result = await this.runner.run("iw", ["dev", interfaceName, "scan"]);
    if (result.code !== 0) throw new Error(result.stderr || "Wi-Fi scan failed");
    return parseIwScan(result.stdout);
  }

  async snapshot(interfaceName = "wlan0"): Promise<HardwareSnapshot> {
    const link = await this.runner.run("iw", ["dev", interfaceName, "link"]);
    const route = await this.runner.run("ip", ["route"]);
    const dns = await this.runner.run("sh", ["-c", "cat /tmp/resolv.conf.d/resolv.conf.auto 2>/dev/null || cat /etc/resolv.conf"]);
    const clients = await this.runner.run("sh", ["-c", "iw dev " + interfaceName + " station dump 2>/dev/null | grep -c '^Station ' || true"]);
    const active = parseIwLink(link.stdout);
    return {
      networks: [],
      active_ssid: active.ssid,
      signal_dbm: active.signal_dbm,
      gateway: parseGateway(route.stdout),
      dns: parseDns(dns.stdout),
      clients: Number.isFinite(Number(clients.stdout.trim())) ? Number(clients.stdout.trim()) : null,
    };
  }
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
  return [...text.matchAll(/^\s*(?:nameserver|list server)\s+(\S+)/gm)].map(m => m[1]);
}

function securityFromText(text: string): Security {
  if (/WPA3/i.test(text)) return Security.WPA3;
  if (/WPA2|RSN/i.test(text)) return Security.WPA2;
  if (/WPA|WEP/i.test(text)) return Security.WPA_PSK;
  return Security.OPEN;
}

export function parseIwScan(text: string): Network[] {
  const blocks = text.split(/^BSS /m).slice(1);
  return blocks.map(block => {
    const bssid = block.split(/\s+/)[0] || undefined;
    const ssid = block.match(/^\s*SSID:\s*(.*)$/m)?.[1]?.trim() || "<hidden>";
    const signal = block.match(/^\s*signal:\s*(-?\d+(?:\.\d+)?)\s*dBm$/m)?.[1];
    const channel = block.match(/^\s*DS Parameter set:\s*channel\s+(\d+)/m)?.[1];
    const frequency = block.match(/^\s*freq:\s*(\d+)/m)?.[1];
    return {
      ssid, bssid, channel: channel ? Number(channel) : undefined,
      frequency_mhz: frequency ? Number(frequency) : undefined,
      rssi_dbm: signal ? Number(signal) : undefined,
      security: securityFromText(block), authorized: false,
      quality: 0, latency_ms: undefined, packet_loss_pct: undefined, stability: 0,
      metadata: { source: "openwrt-iw" }
    };
  });
}
