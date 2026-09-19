# Band Steering

The band steering helper classifies 2.4, 5 and 6 GHz from operating frequency and applies conservative RSSI gating plus configurable preference bonuses.

It does not assume that a radio supports a band. Hardware capability detection remains authoritative. A candidate below the configured RSSI floor is ignored, and unknown frequencies receive no preference bonus.

Multi-radio concurrency, DFS handling, regulatory-domain validation and 802.11k/v/r roaming should be added only through capability-aware platform adapters.
