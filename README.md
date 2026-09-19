# Advanced WiFi Router Framework

A modular, hardware-aware Wi-Fi router framework designed for Linux/OpenWrt-style systems.

## Goals
- Smart Wi-Fi discovery and network selection
- WISP, STA, AP and repeater orchestration
- Connection health monitoring and self-healing
- QoS, diagnostics, telemetry and client visibility
- Hardware capability detection with safe feature gating
- Atomic configuration, rollback and recovery
- Web/API integration points

## Safety and compatibility
The framework never bypasses WPA/WPA2/WPA3 authentication. Automatic connection is limited to open networks or credentials explicitly supplied by the administrator.

Hardware-dependent features are capability-gated; unsupported radios, bands or 802.11 features are never assumed.

## Project status
Initial architecture/skeleton. Hardware-specific integration should be added only after identifying the target router SoC, Wi-Fi chipset, RAM, flash, bootloader and firmware build system.

See [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/ROADMAP.md](docs/ROADMAP.md).
