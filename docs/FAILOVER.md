# Automatic Failover

The failover engine reuses the existing network selector, then applies a minimum-quality threshold, switch margin, and cooldown to avoid unstable rapid switching.

Only networks already eligible under the selector's authorization rules can be selected. Protected networks still require administrator-supplied credentials.
