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
