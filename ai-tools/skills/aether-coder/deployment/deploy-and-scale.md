# Deployment & Scaling

## Blueprint (Auto-Generated)

```bash
mvn jbct:generate-blueprint
```

Deploy:
```bash
aether deploy blueprint.toml
aether blueprint deploy org.example:my-app:1.0.0:blueprint
```

## Blueprint Assembly from External Slices

Teams publish slices independently; an ops team assembles a deployment blueprint.

### Pure Assembly (no local slices)

```xml
<!-- pom.xml — no src/main/java -->
<dependencies>
    <dependency>
        <groupId>com.acme.slices</groupId>
        <artifactId>order-processor</artifactId>
        <version>2.1.0</version>
    </dependency>
    <dependency>
        <groupId>com.acme.slices</groupId>
        <artifactId>inventory-manager</artifactId>
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
public interface OrderProcessor {
    static OrderProcessor orderProcessor(InventoryManager inventory, @Sql SqlConnector db) {
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
aether scale org.example:my-service:1.0.0 --instances 5
```

Blueprint per-slice config:
```toml
[[slices]]
artifact = "org.example:payment-service:1.0.0"
instances = 3
timeout_ms = 30000
memory_mb = 512
```

## Deployment Strategies

```bash
aether deploy blueprint.toml --strategy canary
aether deploy promote
aether deploy rollback
aether deploy complete
```

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
