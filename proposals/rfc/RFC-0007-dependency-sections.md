---
RFC: 0007
Title: Dependency Sections
Status: Draft
Author: Sergiy Yevtushenko
Created: 2026-01-16
Updated: 2026-01-16
Affects: [jbct-cli, aether]
---

## Summary

Defines the dependency file sections (`[api]`, `[shared]`, `[infra]`, `[slices]`) and how Aether's ClassLoader hierarchy treats each category.

## Motivation

Slices have different types of dependencies with different sharing semantics:
- API interfaces need to be shared across proxies
- Libraries can be shared to reduce memory
- Infrastructure needs shared instances (not just classes)
- Slice dependencies need full isolation

This RFC establishes the dependency categorization contract between the packager (jbct-cli) and the runtime ClassLoader (aether).

## Design

### Boundaries

- **jbct-cli**: Generates dependency file with categorized sections during `jbct:package-slices`
- **aether**: Reads dependency file, configures ClassLoader hierarchy accordingly

### 1. Dependency File Location

```
META-INF/dependencies/{FactoryClassName}
```

Example: For `org.example.order.OrderServiceFactory`:
```
META-INF/dependencies/org.example.order.OrderServiceFactory
```

### 2. File Format

INI-style sections with Maven coordinates:

```
[api]
org.example:inventory-service-api:^1.0.0
org.example:payment-service-api:^2.0.0

[shared]
org.pragmatica-lite:core:^0.9.10
com.fasterxml.jackson.core:jackson-databind:^2.15.0

[infra]
org.pragmatica-lite.aether:infra-cache:^0.7.5
org.pragmatica-lite.aether:infra-metrics:^0.7.5

[slices]
org.example:inventory-service:^1.0.0
org.example:payment-service:^2.0.0
```

### 3. Version Format

Semver ranges following npm/Cargo conventions:

| Format | Meaning | Example |
|--------|---------|---------|
| `^1.0.0` | Compatible with 1.x.x | `>=1.0.0 <2.0.0` |
| `~1.0.0` | Patch-level compatible | `>=1.0.0 <1.1.0` |
| `1.0.0` | Exact version | `=1.0.0` |

### 4. Section Definitions

#### `[api]` - Slice API Interfaces

**Purpose:** API interfaces for generated proxy records

**Classification criteria:**
- Slice dependencies (JARs containing `META-INF/slice-api.properties`)
- Converted to `-api` artifact (`payment-service` → `payment-service-api`)

**ClassLoader treatment:**
- Loaded in SharedLibraryClassLoader (parent of slice classloaders)
- Visible to all slices
- No instance sharing (interfaces only)

**Example:**
```
[api]
org.example:inventory-service-api:^1.0.0
```

**Usage:** Proxy records implement these interfaces:
```java
record InventoryServiceProxy(SliceInvokerFacade invoker)
    implements InventoryService {  // From [api] section
    ...
}
```

#### `[shared]` - Shared Libraries

**Purpose:** Third-party libraries shared across slices

**Classification criteria:**
- `provided` scope dependencies (non-infra)
- Not slice dependencies
- Not Aether runtime libraries

**ClassLoader treatment:**
- Loaded in SharedLibraryClassLoader
- JAR shared, but instances are per-slice
- Reduces memory by sharing class definitions

**Example:**
```
[shared]
org.pragmatica-lite:core:^0.9.10
org.pragmatica-lite:json:^0.9.10
```

**Usage:** Libraries like pragmatica-lite core are used by multiple slices without duplication.

#### `[infra]` - Infrastructure Dependencies

**Purpose:** Infrastructure components with shared instances

**Classification criteria:**
- `artifactId` starts with `infra-`
- Implements infrastructure pattern (caches, databases, etc.)

**ClassLoader treatment:**
- Loaded in SharedLibraryClassLoader
- JAR shared across slices
- **Instances shared** via InfraStore pattern

**Example:**
```
[infra]
org.pragmatica-lite.aether:infra-cache:^0.7.5
org.pragmatica-lite.aether:infra-database:^0.7.5
```

**InfraStore Pattern:**
```java
public static CacheService cacheService() {
    return InfraStore.instance()
        .getOrCreate(
            "org.pragmatica-lite.aether:infra-cache",
            Version.version("0.7.5").unwrap(),
            CacheService.class,
            () -> InMemoryCacheService.create()
        );
}
```

Multiple slices calling `cacheService()` get the same instance.

#### `[slices]` - Slice Dependencies

**Purpose:** Other slice implementations this slice depends on

**Classification criteria:**
- Slice dependencies (external, from different package)
- Used for dependency ordering in blueprint

**ClassLoader treatment:**
- Each slice loaded in its own SliceClassLoader
- Full isolation between slice implementations
- Only API interfaces shared (via `[api]`)

**Example:**
```
[slices]
org.example:inventory-service:^1.0.0
org.example:payment-service:^2.0.0
```

**Usage:** Ensures correct deployment order in blueprint.

### 5. ClassLoader Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    System ClassLoader                        │
│                  (JDK classes, Aether core)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                SharedLibraryClassLoader                      │
│         [api] + [shared] + [infra] dependencies              │
│                                                              │
│  • Slice API interfaces (for proxy compilation)              │
│  • Shared libraries (pragmatica-lite, jackson, etc.)         │
│  • Infrastructure JARs (with InfraStore instances)           │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│    SliceClassLoader A   │  │    SliceClassLoader B   │
│                         │  │                         │
│  • Slice A impl JAR     │  │  • Slice B impl JAR     │
│  • Bundled libs         │  │  • Bundled libs         │
│  (conflict resolution)  │  │  (conflict resolution)  │
└─────────────────────────┘  └─────────────────────────┘
```

### 6. Conflict Resolution

When the same library appears in both shared and bundled:

1. **Shared wins** - If in `[shared]`, use shared version
2. **Bundle wins** - If not in `[shared]`, use bundled version

This allows slices to use different versions of non-shared libraries.

### 7. Excluded Dependencies

The following are NOT included in dependency file (always provided by platform):

| Artifact | Reason |
|----------|--------|
| `slice-annotations` | Compile-time only |
| `slice-api` | Aether runtime provides |
| `infra-api` | Aether runtime provides |

### Contracts Summary

| Section | jbct-cli Populates From | aether Loads Into | Instance Sharing |
|---------|------------------------|-------------------|------------------|
| `[api]` | Slice deps → `-api` suffix | SharedLibraryClassLoader | N/A (interfaces) |
| `[shared]` | Provided scope, non-infra | SharedLibraryClassLoader | No (per-slice) |
| `[infra]` | `infra-*` artifacts | SharedLibraryClassLoader | Yes (InfraStore) |
| `[slices]` | External slice deps | Per-slice ClassLoader | N/A (ordering only) |

## Examples

### Complete Dependency File

```
[api]
org.example:inventory-service-api:^1.0.0
org.example:payment-service-api:^2.0.0
org.example:shipping-service-api:^1.5.0

[shared]
org.pragmatica-lite:core:^0.9.10
org.pragmatica-lite:json:^0.9.10
org.pragmatica-lite:http-client:^0.9.10

[infra]
org.pragmatica-lite.aether:infra-cache:^0.7.5
org.pragmatica-lite.aether:infra-metrics:^0.7.5

[slices]
org.example:inventory-service:^1.0.0
org.example:payment-service:^2.0.0
org.example:shipping-service:^1.5.0
```

### InfraStore Usage

```java
// In OrderServiceFactory (generated)
public static Promise<OrderService> create(...) {
    // Get shared cache instance
    var cache = InfraStore.instance()
        .get("org.pragmatica-lite.aether:infra-cache", CacheService.class)
        .orElseGet(NoOpCache::new);

    var impl = new OrderServiceImpl(cache);
    return Promise.success(aspect.apply(impl));
}
```

### Version Resolution

When multiple slices declare different versions:

```
Slice A: org.example:payment-service-api:^1.0.0
Slice B: org.example:payment-service-api:^1.2.0
```

Aether resolves to highest compatible: `1.2.x` (satisfies both `^1.0.0` and `^1.2.0`)

## Edge Cases

### Empty Sections

Sections can be omitted if empty:

```
[api]
org.example:payment-service-api:^1.0.0

# No [shared], [infra], or [slices] sections
```

### No External Dependencies

If slice has no external dependencies, dependency file may only contain `[shared]`:

```
[shared]
org.pragmatica-lite:core:^0.9.10
```

### Circular Dependencies

Circular slice dependencies are allowed (proxies are lazy). ClassLoader hierarchy prevents circular class loading.

### Version Conflicts

If incompatible versions required:
- Error during Aether startup
- Must align versions across slices

## Breaking Changes

Changes requiring version bump:

1. Section names
2. Coordinate format
3. Version range syntax
4. ClassLoader hierarchy changes
5. InfraStore API changes

## References

- [RFC-0004: Slice Packaging](RFC-0004-slice-packaging.md) - Dependency file generation
- [RFC-0002: Dependency Protocol](RFC-0002-dependency-protocol.md) - Proxy generation
