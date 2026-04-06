# Forge & Local Development

## Starting Forge

```bash
./run-forge.sh                # Build + start
./run-forge.sh --skip-build   # Skip Maven build
./run-forge.sh --with-load    # Start with built-in load generator
```

- Dashboard: `http://localhost:8888`
- App HTTP: `http://localhost:8070` (nodes: 8070+)
- Management: `http://localhost:5150`

## forge.toml

```toml
[cluster]
nodes = 5
management_port = 5150
dashboard_port = 8888
app_http_port = 8070

[observability]
depth_threshold = -1
```

## PostgreSQL for Local Development

Auto-detects docker or podman:

```bash
./start-postgres.sh          # Start container, init schema
./start-postgres.sh --reset  # Drop and recreate from scratch
./stop-postgres.sh           # Stop (data persists in volume)
./stop-postgres.sh --purge   # Stop and delete data volume
```

Default: `jdbc:postgresql://localhost:5432/forge` (user: `forge`, password: `forge`).

Container: `postgres:18-alpine`, port 5432, volume `forge-pgdata`, max connections 500.

Schema migrations applied automatically by Aether on blueprint deploy.

## Testing with curl

```bash
curl -s -X POST http://localhost:8070/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{"customerId":"CUST-001","items":[{"productId":"LAPTOP-PRO","quantity":1}]}' | jq
```

## Unit Tests (JBCT Style)

```java
@Test
void processPayment_succeeds_forValidCard() {
    var service = PaymentService.paymentService(mockDb, mockInventory);
    service.processPayment(validRequest)
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(response -> assertEquals("APPROVED", response.status().name()));
}
```

## Development Workflow

```bash
jbct check src/main/java        # JBCT format + lint
mvn test                         # Unit tests
./start-postgres.sh              # Start DB (if needed)
./run-forge.sh --skip-build &    # Start Forge
./k6/run-steady.sh 100 30s      # Quick load test
./stop-postgres.sh               # Cleanup
```
