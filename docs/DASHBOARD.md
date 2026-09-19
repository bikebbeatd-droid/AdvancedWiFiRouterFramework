# Dashboard

The project includes a mobile-responsive dashboard and a dependency-free read-only status/scan API.

## Pages
- Dashboard status cards
- Wi-Fi scan table

## Scan API
`GET /api/scan` returns normalized scan records when `scan_interface` is configured. If no interface is configured, the endpoint returns a safe 503 response rather than guessing a radio.

Configuration-changing endpoints should only be added with authentication, authorization, validation and rollback protections.
