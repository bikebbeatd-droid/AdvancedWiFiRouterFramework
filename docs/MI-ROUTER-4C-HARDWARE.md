# Xiaomi Mi Router 4C / R4CM hardware profile

Verified against current OpenWrt and Xiaomi documentation.

- SoC: MediaTek MT7628DA/DAN family
- RAM: 64 MB
- Flash: 16 MB
- Wireless: 2.4 GHz 802.11b/g/n, 2x2
- Ethernet: 10/100 Mbps, 1 WAN + 2 LAN
- OpenWrt target: ramips/mt76x8
- Bootloader: U-Boot

The exact flash chip and board revision must be checked on the physical unit before selecting or building an image. OpenWrt documents a compatibility warning for some 16 MB flash variants.

The stock global 3.0.23 image is documented by OpenWrt. This repository does not modify that binary in-place.

## Build direction

1. Build an OpenWrt image for the xiaomi_mi-router-4c target.
2. Add this framework as a web/API application or package.
3. Enable only hardware capabilities actually present on the board.
4. Test the generated image in a controlled environment and preserve recovery backups.
5. Flash only after the image and board revision are verified.

The framework's WISP logic requires administrator-supplied credentials for protected networks and never bypasses authentication.
