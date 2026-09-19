# Routing, NAT and QoS

This layer provides hardware-neutral abstractions for WISP routing and Linux traffic control.

## WISP path
A wireless STA is the upstream interface. Downstream clients use a separate LAN/AP interface. IPv4 forwarding and NAT are required when the upstream network does not route the downstream subnet.

The framework validates interface separation before a routing plan is accepted. Platform-specific firewall/NAT application remains separate so an OpenWrt target can use its normal firewall and netifd stack.

## QoS
QoS configuration is represented separately from command execution. The initial adapter can inspect Linux `tc` qdiscs; shaping can later be integrated with OpenWrt traffic-control facilities.

## Safety
Never use the same interface as both WAN and LAN. Never log Wi-Fi passwords or other secrets. Target-router changes should be transactional and have a recovery path.
