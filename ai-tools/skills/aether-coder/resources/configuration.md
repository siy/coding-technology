# Configuration

Slices never access configuration directly. The runtime provisions resources from TOML config sections automatically.

## How It Works

1. Slice declares a qualifier annotation (built-in `@Sql` or custom `@OrderDb`)
2. Runtime reads the matching config section (`[database]` or `[database.orders]`)
3. Runtime creates the resource (connection pool, HTTP client, etc.)
4. Resource injected into slice factory

## Config Sources (merge order, highest priority first)

1. **SLICE** — per-slice overrides
2. **NODE** — infrastructure config (`aether.toml` `[endpoints.*]`)
3. **GLOBAL** — application config from blueprint (`resources.toml`)

## Blueprint resources.toml

Travels with blueprint artifact:
```toml
[feature-flags]
enable-premium = "true"

[thresholds]
max-order-amount = "10000"
```

## Secret Resolution

Values containing `${secrets:path}` are resolved at config load time via cloud provider (AWS SM, GCP SM, Azure KV, env vars):

```toml
[database]
password = "${secrets:db/password}"
```

## Dynamic Config Updates

Operators change config at runtime via Management API (`/api/config`). Changes propagate through consensus KV-Store. No slice code changes needed.

**What that does not do: refresh a running slice.** A resource is built from the values current when it was provisioned, and nothing rebuilds it when the stored configuration changes. `SpiResourceProvider` mutates its promise cache only on first provision and on last release; there is no invalidation path on config change, and `ConfigNotificationManager.notifyChange` has no callers (#381). So a slice sees new configuration when it is next reloaded, and not before.

This applies to every resource, `ConfigurationSection` included — config reaches slices only through provisioned resources, so "propagated to the cluster" and "in effect in a slice" are different states.
