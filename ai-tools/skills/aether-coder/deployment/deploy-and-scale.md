# Deployment & Scaling

## Blueprint (Auto-Generated)

```bash
mvn jbct:generate-blueprint
```

Deploy (push the artifact, then deploy its blueprint):
```bash
aether -c <node>:8080 artifacts push org.example:my-app:1.0.0
aether -c <node>:8080 blueprints deploy org.example:my-app:1.0.0 --wait
```

Coordinates are `group:artifact:version` and the version is a release: the cluster's artifact repository is write-once and refuses a SNAPSHOT (cluster deploys use release versions; SNAPSHOT is for Forge and local builds). `blueprints deploy` appends `:blueprint` itself, so do not write the suffix. `--wait` blocks until the deploy settles. On a secured cluster (the default, `API_KEY`), `artifacts push` needs an OPERATOR or ADMIN key.

## Blueprint Assembly from External Slices

Teams publish slices independently; an ops team assembles a deployment blueprint.

### Pure Assembly (no local slices)

```xml
<!-- pom.xml — no src/main/java -->
<dependencies>
    <dependency>
        <groupId>com.acme.slices</groupId>
        <artifactId>ordering</artifactId>
        <version>2.1.0</version>
    </dependency>
    <dependency>
        <groupId>com.acme.slices</groupId>
        <artifactId>inventory</artifactId>
        <version>1.5.0</version>
    </dependency>
</dependencies>
```

```bash
mvn package    # scans dependency JARs for slice manifests, generates blueprint
```

### Mixed Assembly (local + external)

Local `@Slice` depends on external slice JAR on classpath:

```java
@Slice
public interface Ordering {
    static Ordering ordering(Inventory inventory, @Sql SqlConnector db) {
        return request -> inventory.checkStock(request.itemId())
                                   .flatMap(stock -> persistOrder(db, request, stock));
    }
}
```

Plugin discovers manifests from both `target/classes/META-INF/slice/` and dependency JARs.

### Rules

- External slices use `SliceConfig.defaultConfig()` — publishing team controls config
- Dependency on classpath = included in blueprint
- Inter-slice dependencies resolved and sorted topologically

## Scaling

```bash
aether scale org.example:my-service:1.0.0 -n 5 --placement WORKER_PREFERRED --wait
```

`--placement` is `CORE_ONLY`, `WORKER_PREFERRED` or `WORKER_ONLY`. Blueprint per-slice config:
```toml
[[slices]]
artifact = "org.example:payments:1.0.0"
instances = 3
maxInstances = 10
```

Parsed keys per slice: `artifact`, `instances`, `minAvailable`, `maxInstances`, `scaleUpThreshold`, `scaleDownThreshold` (BlueprintParser.java). A per-slice autoscaler (on by default, runs on the leader) moves each slice one instance at a time between its bounds, from that slice's own load (active invocations and p95 latency).

## Deployment Strategies

`aether deploy <coords>` replaces the running version in place, the same immediate deploy as `blueprints deploy`. To prove a version on live traffic first, use a gradual strategy (`--canary`; `--blue-green` and `--rolling` also exist) whose promotion is gated on measured health:

```bash
aether deploy org.example:my-app:1.1.0 --canary --traffic 5 --error-rate 0.01 --latency 500
aether deploy promote  <deploymentId> --traffic 25
aether deploy complete <deploymentId>
aether deploy rollback <deploymentId>
```

The canary starts at 5 percent of traffic and holds; `--error-rate` and `--latency` are the gates it measures against.

## Monitoring

```bash
aether status                    # Cluster overview
aether slices                    # Deployed slices
aether metrics                   # Prometheus metrics
aether invocation-metrics        # Per-method latencies
aether routes                    # HTTP route table
```

## Build

```bash
mvn install                          # Build + install slice artifacts
mvn jbct:generate-blueprint          # Generate blueprint from manifests
mvn jbct:check                       # Format + lint
```
