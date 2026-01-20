---
RFC: 0004
Title: Slice Packaging
Status: Draft
Author: Sergiy Yevtushenko
Created: 2026-01-16
Updated: 2026-01-16
Affects: [jbct-cli, aether]
---

## Summary

Defines the packaging format for slice artifacts, including JAR structure, MANIFEST.MF entries, dependency file format, and fat JAR bundling rules.

## Motivation

Slices are packaged into two JAR artifacts: an API JAR for consumers and an implementation JAR (fat JAR) for deployment. The runtime must understand the JAR structure to correctly load slices with proper classloader isolation. This RFC establishes the contract between the packaging process (jbct-cli) and the runtime loader (aether).

## Design

### Boundaries

- **jbct-cli**: Packages slices via `jbct:package-slices` Maven goal
- **aether**: Loads slice JARs, reads manifests and dependency files, configures classloaders

### 1. Artifact Naming

From a source module containing `@Slice` interface `OrderService`:

| Artifact | Naming Pattern | Example |
|----------|----------------|---------|
| API JAR | `{module}-{slice-suffix}-api-{version}.jar` | `commerce-order-service-api-1.0.0.jar` |
| Impl JAR | `{module}-{slice-suffix}-{version}.jar` | `commerce-order-service-1.0.0.jar` |
| API POM | `{module}-{slice-suffix}-api-{version}.pom` | `commerce-order-service-api-1.0.0.pom` |
| Impl POM | `{module}-{slice-suffix}-{version}.pom` | `commerce-order-service-1.0.0.pom` |

The `slice-suffix` is derived from the interface name using kebab-case conversion:
- `OrderService` → `order-service`
- `UserManagement` → `user-management`

### 2. API JAR Contents

The API JAR contains only the public contract:

```
commerce-order-service-api-1.0.0.jar
├── org/example/order/api/
│   └── OrderService.class          # Generated API interface
├── org/example/order/
│   ├── PlaceOrderRequest.class     # Request types (nested or standalone)
│   ├── PlaceOrderRequest$Item.class
│   └── OrderResult.class           # Response types
└── META-INF/
    └── MANIFEST.MF
```

**Inclusion rules:**
- Generated API interface (`{package}.api.{SliceName}`)
- All request types referenced by slice methods
- All response types referenced by slice methods
- Nested classes of request/response types

### 3. Impl JAR Contents (Fat JAR)

The implementation JAR is a fat JAR containing everything needed to run the slice:

```
commerce-order-service-1.0.0.jar
├── org/example/order/
│   ├── OrderService.class              # Original @Slice interface
│   ├── OrderServiceImpl.class          # Implementation
│   ├── OrderServiceFactory.class       # Generated factory
│   ├── OrderServiceFactory$orderServiceSlice.class
│   ├── OrderServiceFactory$PaymentServiceProxy.class
│   └── internal/                       # Subpackage classes
│       └── OrderValidator.class
├── org/example/shared/                 # Sibling shared package
│   └── CommonUtils.class
├── com/fasterxml/jackson/...           # Bundled external libs
├── META-INF/
│   ├── MANIFEST.MF                     # With Slice-* entries
│   ├── slice/
│   │   └── OrderService.manifest       # Slice manifest
│   ├── dependencies/
│   │   └── org.example.order.OrderServiceFactory  # Dependency file
│   └── services/                       # Merged service files
│       └── ...
└── ...
```

### 4. MANIFEST.MF Entries

The impl JAR's MANIFEST.MF includes slice-specific entries:

```
Manifest-Version: 1.0
Slice-Artifact: org.example:commerce-order-service:1.0.0
Slice-Class: org.example.order.OrderServiceFactory
```

| Entry | Description | Example |
|-------|-------------|---------|
| `Slice-Artifact` | Full Maven coordinates | `org.example:commerce-order-service:1.0.0` |
| `Slice-Class` | Fully qualified factory class name | `org.example.order.OrderServiceFactory` |

**Aether usage:**
```java
var manifest = jar.getManifest();
var artifact = manifest.getMainAttributes().getValue("Slice-Artifact");
var factoryClass = manifest.getMainAttributes().getValue("Slice-Class");
```

### 5. Dependency File Format

Location: `META-INF/dependencies/{FactoryClassName}`

```
[api]
org.example:inventory-service-api:^1.0.0
org.example:payment-service-api:^2.0.0

[shared]
org.pragmatica-lite:core:^0.9.0

[infra]
org.pragmatica-lite.aether:infra-cache:^0.7.0

[slices]
org.example:inventory-service:^1.0.0
org.example:payment-service:^2.0.0
```

#### Sections

| Section | Purpose | ClassLoader Treatment |
|---------|---------|----------------------|
| `[api]` | Slice API interfaces for generated proxies | Loaded in slice's parent classloader |
| `[shared]` | Libraries with shared instances | Loaded in shared classloader |
| `[infra]` | Infrastructure with shared instances via InfraStore | Loaded in infra classloader |
| `[slices]` | Slice dependencies (for resolution ordering) | Resolved recursively |

#### Version Format

Uses semver ranges:
- `^1.0.0` - Compatible with 1.x.x (>=1.0.0 <2.0.0)
- `~1.0.0` - Patch-level compatible (>=1.0.0 <1.1.0)
- `1.0.0` - Exact version

### 6. Fat JAR Bundling Rules

External dependencies (compile/runtime scope) are bundled into the impl JAR:

**Bundled:**
- Compile-scope dependencies (Jackson, Guava, etc.)
- Runtime-scope dependencies
- Application shared code (sibling `shared` package)
- Slice subpackages (internal utilities)

**NOT Bundled:**
- Aether runtime libraries (`slice-annotations`, `slice-api`, `infra-api`)
- Pragmatica Lite core (`org.pragmatica-lite:core`)
- Provided-scope dependencies (resolved by platform)
- Slice dependencies (loaded separately)
- Infrastructure dependencies (shared via InfraStore)

**Required `provided` Scope:**

All `org.pragmatica-lite` and `org.pragmatica-lite.aether` dependencies **must** use `provided` scope in slice projects. The `jbct:verify-slice` goal validates this requirement and fails the build if violated.

```xml
<!-- CORRECT: provided scope -->
<dependency>
    <groupId>org.pragmatica-lite</groupId>
    <artifactId>core</artifactId>
    <scope>provided</scope>
</dependency>

<!-- WRONG: compile scope (default) - causes build failure -->
<dependency>
    <groupId>org.pragmatica-lite</groupId>
    <artifactId>core</artifactId>
</dependency>
```

**Rationale:**
- Aether runtime provides these libraries with classloader isolation
- Bundling causes version conflicts and classloading issues
- Reduces slice JAR size significantly

**Bundling process:**
```java
// For each external dependency JAR:
// 1. Extract all class files
// 2. Skip META-INF/ except META-INF/services/
// 3. Skip module-info.class
// 4. Merge META-INF/services/ files
```

### 7. Slice Manifest Format

Location: `META-INF/slice/{SliceName}.manifest`

Properties file containing packaging metadata:

```properties
# Identity
slice.name=OrderService
slice.artifactSuffix=order-service
slice.package=org.example.order

# Classes for API JAR
api.classes=org.example.order.api.OrderService

# Classes for Impl JAR
impl.classes=org.example.order.OrderService,\
             org.example.order.OrderServiceFactory,\
             org.example.order.OrderServiceFactory$orderServiceSlice,\
             org.example.order.OrderServiceFactory$PaymentServiceProxy

# Request/Response types (included in API JAR)
request.classes=org.example.order.PlaceOrderRequest
response.classes=org.example.order.OrderResult

# Artifact coordinates
base.artifact=org.example:commerce
api.artifactId=commerce-order-service-api
impl.artifactId=commerce-order-service

# Dependencies
dependencies.count=2
dependency.0.interface=org.example.inventory.InventoryService
dependency.0.artifact=org.example:inventory-service
dependency.0.version=1.0.0
dependency.0.external=true
dependency.1.interface=org.example.order.validation.Validator
dependency.1.artifact=
dependency.1.version=
dependency.1.external=false

# Runtime config
config.file=slices/OrderService.toml

# Metadata
generated.timestamp=2026-01-15T10:30:00Z
processor.version=0.5.0
```

### 8. Shared Code Inclusion

Application shared code is automatically included in the impl JAR:

1. **Sibling shared package**: `org.example.shared` for slice `org.example.order.OrderService`
2. **Slice subpackages**: `org.example.order.internal`, `org.example.order.utils`, etc.

```
org.example/
├── order/              # Slice package
│   ├── OrderService.java
│   └── internal/       # Included in impl JAR
│       └── Helper.java
└── shared/             # Sibling shared - included in impl JAR
    └── Utils.java
```

### Contracts Summary

| Component | jbct-cli Generates | aether Expects |
|-----------|-------------------|----------------|
| API JAR | API interface + request/response types | Consumer dependency |
| Impl JAR | Fat JAR with all runtime code | Slice deployment unit |
| MANIFEST.MF | `Slice-Artifact`, `Slice-Class` | Slice discovery |
| Dependency file | `META-INF/dependencies/{Factory}` | ClassLoader configuration |
| Slice manifest | `META-INF/slice/{Name}.manifest` | Packaging metadata |

## Examples

### Multi-Slice Module

Source module with two slices:

```
commerce/
├── pom.xml
└── src/main/java/org/example/
    ├── order/
    │   ├── OrderService.java       # @Slice
    │   └── OrderServiceImpl.java
    └── payment/
        ├── PaymentService.java     # @Slice
        └── PaymentServiceImpl.java
```

Produces four JARs:
```
target/
├── commerce-order-service-api-1.0.0.jar
├── commerce-order-service-1.0.0.jar
├── commerce-payment-service-api-1.0.0.jar
└── commerce-payment-service-1.0.0.jar
```

### Dependency File Example

```
[api]
org.example:inventory-service-api:^1.0.0

[shared]
org.pragmatica-lite:core:^0.9.10
org.pragmatica-lite:json:^0.9.10

[infra]
org.pragmatica-lite.aether:infra-cache:^0.7.5
org.pragmatica-lite.aether:infra-metrics:^0.7.5

[slices]
org.example:inventory-service:^1.0.0
```

## Edge Cases

### No External Dependencies

If slice has no external dependencies, dependency file sections may be empty or omitted.

### Nested Request/Response Types

Nested types are included in API JAR:
```java
public interface OrderService {
    record PlaceOrderRequest(List<Item> items) {
        public record Item(String sku, int quantity) {}  // Included
    }
}
```

### Class Name Conflicts

If bundled libraries have conflicting class names, last-wins during extraction. Recommendation: Use shading or relocating if conflicts occur.

## Breaking Changes

Changes requiring version bump:

1. MANIFEST.MF entry names or format
2. Dependency file section names or format
3. Slice manifest property names
4. JAR naming convention changes
5. Bundling inclusion/exclusion rules

## References

- [RFC-0001: Core Slice Contract](RFC-0001-core-slice-contract.md) - Factory class naming
- [RFC-0002: Dependency Protocol](RFC-0002-dependency-protocol.md) - Artifact coordinates
- [RFC-0007: Dependency Sections](RFC-0007-dependency-sections.md) - ClassLoader hierarchy
