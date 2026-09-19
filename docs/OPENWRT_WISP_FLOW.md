# OpenWrt WISP Apply Flow

This layer combines LAN preparation, DHCP preparation, and firewall-forwarding
preparation behind one validated WISP plan.

Safety properties:
- upstream and LAN interfaces must differ;
- DHCP must target the configured WISP LAN interface;
- changes are staged through the transaction abstraction;
- apply errors attempt rollback;
- no Wi-Fi password is accepted or stored by this layer.

Important: UCI section names are platform/configuration dependent. The current
firewall adapter is intentionally a framework adapter, not a guarantee that
every OpenWrt release uses these exact section identifiers. Production hardware
integration should first inspect the target firmware's actual UCI schema.
