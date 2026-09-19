# Wi-Fi performance strategy

## Stability
- Automatic reconnect with bounded retry count.
- Health probes and packet-loss tracking.
- Adaptive channel policy without overriding regulatory limits.
- Recovery/fallback instead of endless blind reconnect loops.

## Range
Software cannot create unlimited range. Transmit power is constrained by hardware and local regulations. Better results come from correct country configuration, clean channel selection, suitable channel width, placement and antenna orientation.

## Latency
Optional SQM can reduce bufferbloat, but it consumes CPU and should be enabled only after measuring WAN throughput.

## Roaming
802.11k/v/r are capability- and client-dependent. They are not forcibly enabled on the single-radio R4CM profile.

## Security
Protected upstream Wi-Fi always requires valid administrator-supplied credentials. The framework never bypasses authentication.
