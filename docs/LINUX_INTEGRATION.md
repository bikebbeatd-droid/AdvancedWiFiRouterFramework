# Linux/OpenWrt Integration

The framework sits above the standard Linux wireless stack instead of replacing it.

Current integration layer:
- scanner.py parses iw scan output
- linux_backend.py reads interfaces and link state
- health_probe.py provides a reachability/latency probe
- connection.py validates administrator authorization for protected networks

Planned runtime adapters:
1. wpa_supplicant control adapter for STA/WISP
2. hostapd control adapter for AP
3. OpenWrt UCI/netifd adapter
4. firewall/NAT adapter
5. tc/QoS adapter
6. capability discovery from iw list and sysfs
7. recovery and atomic configuration manager

Every hardware-dependent option must be capability-gated.
