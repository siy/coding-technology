# HTTP Routing: routes.toml

Each slice has a `routes.toml` in its resources directory:

```toml
prefix = "/api/v1/payments"

[routes]
processPayment = "POST /process"
processRefund = "POST /refund"
getTransaction = "GET /transactions/{id}"

[errors]
default = 500
HTTP_404 = ["*NotFound*"]
HTTP_400 = ["*Invalid*", "*InsufficientFunds*"]
HTTP_402 = ["*Declined*"]
HTTP_504 = ["*GATEWAY_TIMEOUT*"]
```

## Rules

- `prefix` — URL prefix for all routes in this slice
- `[routes]` — maps method names to HTTP verb + path. Path params use `{name}`.
- `[errors]` — maps sealed Cause type names to HTTP status codes using glob patterns. `default` is the fallback.

The annotation processor generates a `{SliceName}Routes` class from this file.
