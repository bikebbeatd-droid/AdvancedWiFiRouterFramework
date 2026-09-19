# Dashboard

The project now includes a lightweight mobile-responsive web dashboard and a dependency-free status API.

## Current dashboard
- Mode
- Uplink network
- Signal level
- Latency
- Connected client count
- Overall health
- Automatic status refresh every 5 seconds

The UI is intentionally separate from router-specific control logic. Future pages can add Wi-Fi scanning, network selection, WISP/repeater configuration, clients, QoS, diagnostics, logs, hardware capabilities and recovery controls.

The API currently exposes read-only `GET /api/status`. Configuration-changing endpoints should be added only with authentication, authorization, validation and rollback protections.
