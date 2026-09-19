from dataclasses import dataclass
from .models import Network, Security


@dataclass
class SelectorWeights:
    signal: float = 0.25
    quality: float = 0.20
    latency: float = 0.20
    packet_loss: float = 0.15
    stability: float = 0.20


def _signal_score(rssi: int | None) -> float:
    if rssi is None:
        return 0.0
    return max(0.0, min(1.0, (rssi + 100) / 60))


def _inverse(value: float | None, ceiling: float) -> float:
    if value is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - value / ceiling))


def score(network: Network, weights: SelectorWeights = SelectorWeights()) -> float:
    # Only open or explicitly authorized networks are eligible.
    if network.security != Security.OPEN and not network.authorized:
        return float("-inf")

    return (
        _signal_score(network.rssi_dbm) * weights.signal
        + max(0.0, min(1.0, network.quality)) * weights.quality
        + _inverse(network.latency_ms, 500.0) * weights.latency
        + _inverse(network.packet_loss_pct, 100.0) * weights.packet_loss
        + max(0.0, min(1.0, network.stability)) * weights.stability
    )


def choose_network(networks: list[Network], weights: SelectorWeights = SelectorWeights()) -> Network | None:
    eligible = [(score(n, weights), n) for n in networks]
    eligible = [(s, n) for s, n in eligible if s != float("-inf")]
    return max(eligible, key=lambda item: item[0])[1] if eligible else None
