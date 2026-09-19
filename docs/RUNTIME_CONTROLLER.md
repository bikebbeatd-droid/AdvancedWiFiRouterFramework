# Wi-Fi Runtime Controller

The runtime controller is the orchestration layer between platform adapters and the selection/roaming engines.

Cycle:
1. Scan using an injected platform scanner.
2. Evaluate the current connection health.
3. Let the roaming/failover policies decide whether to stay, switch, or reconnect.
4. Invoke injected switch/reconnect callbacks.
5. Keep the current network only after a decision is made.

Platform-specific operations remain injectable so the framework does not assume a particular router chipset, OpenWrt layout, or wpa_supplicant control socket.

Security: candidate authorization is still enforced by the selector/failover layers. The controller does not discover, recover, crack, or bypass Wi-Fi credentials.
