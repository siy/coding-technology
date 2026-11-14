# Configuration

Slices never access configuration directly. The runtime provisions resources from TOML config sections automatically.

## How It Works

1. Slice declares a qualifier annotation (built-in `@Sql` or custom `@OrderDb`)
2. Runtime reads the matching config section (`[database]` or `[database.orders]`)
3. Runtime creates the resource (connection pool, HTTP client, etc.)
4. Resource injected into slice factory

## Config Sources (highest priority first)

1. **Operator changes** via the management API, stored in the cluster's consensus store
2. **Node** `aether.toml` — infrastructure facts (database hosts, endpoints, credentials)
3. **Slice defaults** — shipped in the slice jar as `META-INF/resources.toml`; the fallback for any key the deployment does not set

Lookup is first-wins per key, so an operator who overrides one key of a section leaves the section's other keys answering from below. `slices/<Name>.toml` is not a configuration layer: the blueprint generator reads it at build time (instance count).

## Slice Defaults: resources.toml

Write `src/main/resources/resources.toml`; the build packages it as `META-INF/resources.toml` in the slice jar. Put settings that are part of the app wherever it runs: topics, stream settings, feature flags, business thresholds.
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

Operators change config at runtime via Management API (`/api/config`). Changes propagate through the cluster's consensus store. No slice code changes needed.

**What that does not do: refresh a running slice by itself.** A resource is built from the values current when it was provisioned, and nothing rebuilds it when the stored configuration changes. A slice that must react to a change declares an update method for the section; a slice without one sees new configuration when it is next reloaded. The book does not give the update method's signature, so check the resource reference before writing one.

This applies to every resource, `ConfigurationSection` included: config reaches slices only through provisioned resources, so "propagated to the cluster" and "in effect in a slice" are different states.
