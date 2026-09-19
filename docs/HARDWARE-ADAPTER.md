# Hardware adapter layer

The framework now includes an OpenWrt-compatible adapter boundary. It uses command runners so the web server can stay testable without requiring a router during development.

## Supported operations
- Wi-Fi scan through `iw dev <interface> scan`
- Current STA link through `iw dev <interface> link`
- Default gateway from `ip route`
- DNS discovery from OpenWrt resolver configuration
- Associated station count through `iw dev <interface> station dump`

## Important
This adapter is an integration boundary, not a claim that the Mi Router 4C firmware can run it unchanged. The target firmware/SoC/chipset and available commands must be verified before flashing anything.

Protected Wi-Fi still requires administrator-supplied credentials. The adapter does not crack, bypass, or recover passwords.
