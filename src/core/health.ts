export interface HealthSample {
  latency_ms: number | null;
  packet_loss_pct: number | null;
  link_quality: number | null;
}

export function healthScore(sample: HealthSample): number {
  const latency =
    sample.latency_ms === null || sample.latency_ms === undefined
      ? 0.0
      : Math.max(0.0, 1.0 - sample.latency_ms / 500.0);

  const loss =
    sample.packet_loss_pct === null || sample.packet_loss_pct === undefined
      ? 0.0
      : Math.max(0.0, 1.0 - sample.packet_loss_pct / 100.0);

  const quality =
    sample.link_quality === null || sample.link_quality === undefined
      ? 0.0
      : Math.max(0.0, Math.min(1.0, sample.link_quality));

  return latency * 0.35 + loss * 0.35 + quality * 0.3;
}
