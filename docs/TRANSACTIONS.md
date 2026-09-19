# Atomic Apply and Rollback

Network changes can be staged in an ApplyTransaction. Rollback actions run in reverse order when connectivity verification fails.

This primitive does not claim every platform operation is reversible. Production adapters must register concrete rollback operations and preserve a separate management/recovery path.
