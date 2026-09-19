# AP and WISP orchestration

The AP runtime provides validation and read-only hostapd status/station inspection. The orchestration plan groups upstream WISP, LAN, DHCP, and firewall settings into one validated object.

Applying changes should validate hardware capabilities, stage configuration, commit atomically, verify connectivity, and roll back on failure.
