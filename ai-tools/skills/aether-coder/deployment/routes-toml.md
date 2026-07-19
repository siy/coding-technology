# HTTP Routing: routes.toml

Each slice has a `routes.toml` in its resources directory:

```toml
prefix = "/api/v1/payments"   # optional

[security]
default = "public"            # baseline policy; optional override_policy = "strengthen_only"

[routes]
processPayment = "POST /process"
processRefund = "POST /refund"
getTransaction = "GET /transactions/{id}"
listByStatus = "GET /by-status/{status:String}"

[errors]
default = 500
HTTP_404 = ["*NotFound*"]
HTTP_400 = ["*Invalid*", "*InsufficientFunds*"]
HTTP_402 = ["*Declined*"]
HTTP_504 = ["*GATEWAY_TIMEOUT*"]
```

## Rules

- `prefix` — optional URL prefix for all routes in this slice.
- `[security]` — per-slice route security; `default` sets the baseline (e.g. `"public"`), with optional `override_policy`.
- `[routes]` — maps method names to HTTP verb + path. Path params use `{name}` or typed `{name:Type}` (e.g. `{id}`, `{code:Integer}`, `{status:String}`).
- `[errors]` — maps Cause patterns to HTTP status codes using glob patterns. `default` is the fallback.

The annotation processor generates a `{SliceName}Routes` class from this file.
