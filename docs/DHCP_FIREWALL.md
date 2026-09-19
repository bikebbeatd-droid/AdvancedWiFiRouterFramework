# DHCP and Firewall

The OpenWrt runtime now has validation/planning adapters for LAN DHCP and LAN-to-WAN forwarding. These adapters use UCI rather than editing configuration files directly.

The framework validates interface and zone separation before preparing changes. Applying configuration should be wrapped by the platform's existing atomic/rollback mechanism before production deployment.
