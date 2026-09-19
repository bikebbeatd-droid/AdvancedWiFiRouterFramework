# Self-Healing

The self-healing engine evaluates a bounded health score and chooses a recovery action: no action while healthy, reconnect during transient failures, and rollback after the configured failure limit.

Reconnect timing uses the existing exponential backoff. The engine is intentionally bounded and does not perform credential recovery or authentication bypass.
