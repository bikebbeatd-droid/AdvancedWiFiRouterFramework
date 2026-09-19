# OpenWrt / wpa_supplicant Adapter

This adapter provides a small, capability-neutral runtime bridge to an existing
wpa_supplicant control interface through `wpa_cli`.

Supported operations:
- status inspection
- reconnect/disconnect
- rescan
- selecting an already configured numeric wpa_supplicant network ID

It intentionally does not accept raw passwords or attempt to discover credentials.
Protected Wi-Fi must already be configured by the administrator. The runtime only
selects an authorized saved profile.

The adapter does not assume a particular router chipset. Actual availability of
wpa_cli, control sockets, interface names, concurrent AP+STA operation, and
OpenWrt networking configuration depends on the target firmware and hardware.
