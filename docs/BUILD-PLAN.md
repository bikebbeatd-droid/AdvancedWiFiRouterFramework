# R4CM custom firmware build plan

## Goal
Produce a reproducible OpenWrt-based image for the Xiaomi Mi Router 4C/R4CM and integrate the Advanced WiFi Router Framework without treating the stock Xiaomi binary as directly editable.

## Stages

1. Framework: web dashboard, WISP flow, policy/config APIs and hardware adapter boundary.
2. Target profile: verified R4CM hardware profile and on-device diagnostic script.
3. OpenWrt integration: package/service that launches the framework and connects the adapter to real router interfaces.
4. Image build: use the official OpenWrt build system and verified board profile while respecting 16 MB flash.
5. Validation: boot, LAN, WAN, 2.4 GHz AP, STA/WISP, DHCP/DNS, persistence and recovery.

## Important
Do not flash an image solely because the model name matches. Verify board revision and flash chip first.
