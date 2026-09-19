# Continuous Roaming Coordinator

The roaming coordinator combines health state with the existing failover selector. It supports bounded decisions: stay on the current network, switch to an eligible candidate, reconnect when health repeatedly fails, or report that no candidate exists.

It never bypasses Wi-Fi authentication. Candidate authorization remains enforced by the existing selector.

This layer is policy/orchestration only. Actual association, 802.11k/v/r actions, AP steering, and driver-specific roaming must be implemented by capability-aware platform adapters.
