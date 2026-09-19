import { SelectorWeights, defaultWeights } from "./selector.js";

export interface RouterPolicy {
  allow_open_networks: boolean;
  allow_saved_credentials: boolean;
  never_bypass_authentication: boolean;
  auto_reconnect: boolean;
  adaptive_channel: boolean;
  max_reconnect_attempts: number;
}

export interface SelectorConfig {
  minimum_rssi_dbm: number;
  switch_hysteresis: number;
  weights: SelectorWeights;
}

export interface HealthConfig {
  probe_interval_seconds: number;
  failure_threshold: number;
  recovery_threshold: number;
}

export interface RouterConfig {
  policy: RouterPolicy;
  selector: SelectorConfig;
  health: HealthConfig;
}

export const defaultRouterConfig: RouterConfig = {
  policy: {
    allow_open_networks: true,
    allow_saved_credentials: true,
    never_bypass_authentication: true,
    auto_reconnect: true,
    adaptive_channel: true,
    max_reconnect_attempts: 3,
  },
  selector: {
    minimum_rssi_dbm: -82,
    switch_hysteresis: 12,
    weights: { ...defaultWeights },
  },
  health: {
    probe_interval_seconds: 10,
    failure_threshold: 3,
    recovery_threshold: 2,
  },
};
