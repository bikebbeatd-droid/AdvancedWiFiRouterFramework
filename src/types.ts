import { Security, Network } from "./core/models.js";
import { ConnectionState, StateTransitionEvent } from "./core/state.js";
import { WifiCapabilities } from "./core/capabilities.js";
import { RouterConfig } from "./core/config.js";
import { HealthSample } from "./core/health.js";
import { ScoreDetails, SelectorWeights } from "./core/selector.js";

export { Security, ConnectionState };
export type {
  Network,
  StateTransitionEvent,
  WifiCapabilities,
  RouterConfig,
  HealthSample,
  ScoreDetails,
  SelectorWeights,
};

export interface SystemStatus {
  system: string;
  version: string;
  state: ConnectionState;
  activeNetwork: Network | null;
  recommendedNetwork: Network | null;
  healthScore: number;
  networkCount: number;
  supportedFeatures: string[];
  policy: RouterConfig["policy"];
  timestamp: string;
}
