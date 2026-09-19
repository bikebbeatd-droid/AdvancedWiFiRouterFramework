export enum Security {
  OPEN = "open",
  WPA_PSK = "wpa-psk",
  WPA2 = "wpa2",
  WPA3 = "wpa3",
  UNKNOWN = "unknown",
}

export interface Network {
  ssid: string;
  bssid?: string;
  channel?: number;
  frequency_mhz?: number;
  rssi_dbm?: number;
  security: Security;
  authorized: boolean;
  quality: number;
  latency_ms?: number;
  packet_loss_pct?: number;
  stability: number;
  credential_ref?: string;
  metadata?: Record<string, any>;
}
