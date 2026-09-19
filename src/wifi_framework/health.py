from dataclasses import dataclass


@dataclass
class HealthSample:
    latency_ms: float | None
    packet_loss_pct: float | None
    link_quality: float | None


def health_score(sample: HealthSample) -> float:
    latency = 0.0 if sample.latency_ms is None else max(0.0, 1.0 - sample.latency_ms / 500.0)
    loss = 0.0 if sample.packet_loss_pct is None else max(0.0, 1.0 - sample.packet_loss_pct / 100.0)
    quality = 0.0 if sample.link_quality is None else max(0.0, min(1.0, sample.link_quality))
    return latency * 0.35 + loss * 0.35 + quality * 0.30
