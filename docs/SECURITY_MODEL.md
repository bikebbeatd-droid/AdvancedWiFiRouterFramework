# Security Model

Network selection may use open networks or protected networks explicitly authorized/configured by the administrator. The framework must never recover, guess, crack, or bypass Wi-Fi credentials.

Hardware-specific firmware generation is blocked until the target is identified. Required identity data:
- exact router model/revision
- SoC
- Wi-Fi chipset/radios
- RAM and flash size
- bootloader/recovery method
- current firmware/build system

Runtime principles:
- validate configuration before applying it
- prefer atomic changes with rollback
- keep recovery access available
- never log passwords or other secrets
- rate-limit repeated reconnect attempts
