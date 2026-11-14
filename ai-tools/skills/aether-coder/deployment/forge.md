# Forge & Local Development

## Starting Forge

```bash
./run-forge.sh                # Build + start
./run-forge.sh --skip-build   # Skip Maven build
./run-forge.sh --with-load    # Start with built-in load generator
```

- Forge REST API (status, `/api/load`, `/api/chaos`): `http://localhost:8888`. There is no dashboard
- App HTTP: `http://localhost:8070` (nodes: 8070+)
- Management: `http://localhost:5150`

Ember is the single-JVM runtime: the whole cluster in one process, nodes reaching each other over localhost, a breakpoint anywhere; write and debug there. Forge is chaos testing built on Ember: several Ember nodes plus the REST API above, so you can kill a node or the leader, or roll a restart, while load runs. Forge is a simulation of distribution, not a distributed deployment: its nodes share one process, one memory and one failure domain, so "5 nodes" means five topology positions, not five machines. It injects node loss as a graceful stop (the node flushes its write-ahead log on the way down), so it proves recovery from a clean departure, not from a crash between a write and its fsync. Aether is the same nodes on separate machines.

Forge data lives under `.aether/forge-data` next to `forge.toml`.

## forge.toml

```toml
[cluster]
nodes = 5
management_port = 5150
forge_port = 8888
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

A slice's dependencies are plain interfaces, so a test fakes them with lambdas (`Inventory inventory = items -> Promise.success(...)`) and calls the factory directly:

```java
@Test
void processPayment_succeeds_forValidCard() {
    var payments = Payments.payments(mockDb, mockInventory);
    payments.processPayment(validRequest)
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
