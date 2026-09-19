# OpenWrt integration

This directory contains the service/package skeleton for running the Advanced WiFi Router Framework on an OpenWrt-based R4CM image.

The runtime is intentionally disabled by default until the target image and board are verified.

## Layout

- `files/etc/init.d/awrf` — procd service
- `files/etc/config/awrf` — UCI configuration
- `files/usr/bin/awrf-check` — runtime prerequisite check

The package expects the application runtime to be installed at `/usr/lib/awrf/server.js` in the final image. Do not copy a development `node_modules` tree blindly onto a 16 MB router.
