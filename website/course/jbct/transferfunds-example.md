## blurb
Aspects in a real workflow: retry, timeout, and audit logging composed around a funds transfer.

## learn
- Retry for transient failures
- Timeout for slow operations
- Audit logging as a best-effort aspect
- Aspects compose around the core operation

## exercise
### Add an Audit Aspect | ~20 min
Take an operation in your codebase that changes state (a payment, an update, a status change). Add an
audit-logging aspect around it that records the outcome, success or failure, without ever failing the
operation itself - modeled on TransferFunds's audit trail.
