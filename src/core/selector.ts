import { Network, Security } from "./models.js";

export interface SelectorWeights {
  signal: number;
  quality: number;
  latency: number;
  packet_loss: number;
  stability: number;
}

export const defaultWeights: SelectorWeights = {
  signal: 0.25,
  quality: 0.2,
  latency: 0.2,
  packet_loss: 0.15,
  stability: 0.2,
};

export function signalScore(rssi: number | null | undefined): number {
  if (rssi === null || rssi === undefined) {
    return 0.0;
  }
  return Math.max(0.0, Math.min(1.0, (rssi + 100) / 60));
}

export function inverseScore(value: number | null | undefined, ceiling: number): number {
  if (value === null || value === undefined) {
    return 0.0;
  }
  return Math.max(0.0, Math.min(1.0, 1.0 - value / ceiling));
}

export interface ScoreDetails {
  total: number;
  eligible: boolean;
  ineligibilityReason?: string;
  subscores: {
    signal: { raw: number | undefined; normalized: number; weighted: number; weight: number };
    quality: { raw: number; normalized: number; weighted: number; weight: number };
    latency: { raw: number | undefined; normalized: number; weighted: number; weight: number };
    packet_loss: { raw: number | undefined; normalized: number; weighted: number; weight: number };
    stability: { raw: number; normalized: number; weighted: number; weight: number };
  };
}

export function scoreBreakdown(
  network: Network,
  weights: SelectorWeights = defaultWeights
): ScoreDetails {
  const isEligible = network.security === Security.OPEN || network.authorized;
  if (!isEligible) {
    return {
      total: -Infinity,
      eligible: false,
      ineligibilityReason: `Unauthorized ${network.security.toUpperCase()} network`,
      subscores: {
        signal: { raw: network.rssi_dbm, normalized: 0, weighted: 0, weight: weights.signal },
        quality: { raw: network.quality, normalized: 0, weighted: 0, weight: weights.quality },
        latency: { raw: network.latency_ms, normalized: 0, weighted: 0, weight: weights.latency },
        packet_loss: { raw: network.packet_loss_pct, normalized: 0, weighted: 0, weight: weights.packet_loss },
        stability: { raw: network.stability, normalized: 0, weighted: 0, weight: weights.stability },
      },
    };
  }

  const sNorm = signalScore(network.rssi_dbm);
  const qNorm = Math.max(0.0, Math.min(1.0, network.quality));
  const lNorm = inverseScore(network.latency_ms, 500.0);
  const pNorm = inverseScore(network.packet_loss_pct, 100.0);
  const stNorm = Math.max(0.0, Math.min(1.0, network.stability));

  const sWeighted = sNorm * weights.signal;
  const qWeighted = qNorm * weights.quality;
  const lWeighted = lNorm * weights.latency;
  const pWeighted = pNorm * weights.packet_loss;
  const stWeighted = stNorm * weights.stability;

  const total = sWeighted + qWeighted + lWeighted + pWeighted + stWeighted;

  return {
    total,
    eligible: true,
    subscores: {
      signal: { raw: network.rssi_dbm, normalized: sNorm, weighted: sWeighted, weight: weights.signal },
      quality: { raw: network.quality, normalized: qNorm, weighted: qWeighted, weight: weights.quality },
      latency: { raw: network.latency_ms, normalized: lNorm, weighted: lWeighted, weight: weights.latency },
      packet_loss: { raw: network.packet_loss_pct, normalized: pNorm, weighted: pWeighted, weight: weights.packet_loss },
      stability: { raw: network.stability, normalized: stNorm, weighted: stWeighted, weight: weights.stability },
    },
  };
}

export function scoreNetwork(
  network: Network,
  weights: SelectorWeights = defaultWeights
): number {
  if (network.security !== Security.OPEN && !network.authorized) {
    return -Infinity;
  }

  return (
    signalScore(network.rssi_dbm) * weights.signal +
    Math.max(0.0, Math.min(1.0, network.quality)) * weights.quality +
    inverseScore(network.latency_ms, 500.0) * weights.latency +
    inverseScore(network.packet_loss_pct, 100.0) * weights.packet_loss +
    Math.max(0.0, Math.min(1.0, network.stability)) * weights.stability
  );
}

export function chooseNetwork(
  networks: Network[],
  weights: SelectorWeights = defaultWeights
): { network: Network; score: number } | null {
  const eligible = networks
    .map((n) => ({ network: n, score: scoreNetwork(n, weights) }))
    .filter((item) => item.score !== -Infinity && !Number.isNaN(item.score));

  if (eligible.length === 0) {
    return null;
  }

  return eligible.reduce((best, curr) => (curr.score > best.score ? curr : best), eligible[0]);
}
