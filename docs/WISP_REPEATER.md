# WISP / Repeater Runtime Design

WISP uses a wireless STA uplink and routes downstream clients through the router's normal network stack. Repeater mode additionally requires a hardware/driver combination that supports concurrent AP+STA operation.

The framework must:
- detect AP+STA capability before enabling repeater mode
- keep upstream credentials administrator-supplied
- configure routing/NAT using the platform network stack
- monitor uplink health and reconnect with bounded backoff
- preserve a management/recovery path
- never assume dual-radio or multi-band support

This module is orchestration only; it does not implement or bypass Wi-Fi authentication.
