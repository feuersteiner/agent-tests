# Payment retries keep the idempotency key

When code under `src/` retries a payment request, every attempt sends the idempotency key of the first attempt. A new key per attempt can charge the customer twice.
