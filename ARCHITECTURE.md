# Architecture

```
Web UI / Mobile UI
        |
      REST API
        |
  Framework Core
  |      |       |
Scanner Selector Health
  |      |       |
Connection Manager
        |
WISP / STA / AP / Repeater
        |
Linux networking + hostapd + wpa_supplicant
        |
cfg80211 / nl80211 / driver
        |
Wi-Fi chipset
```

## Modules

- **core**: configuration, events, state and lifecycle
- **scanner**: normalized Wi-Fi scan records
- **selector**: deterministic scoring of authorized/open networks
- **health**: latency, packet loss, link quality and reconnect tracking
- **connection**: connection state machine and backoff
- **routing**: DHCP/DNS/NAT/firewall integration points
- **qos**: traffic-control policy integration
- **diagnostics**: logs, interface state and connectivity tests
- **api**: machine-readable status/config interfaces

The initial implementation is deliberately dependency-light so it can be ported to a router firmware build later.
