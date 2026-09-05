---
tags: [java, architecture, distributedsystems, backend]
canonical_url: https://pragmatica.dev/articles/aether-let-java-be-java
description: The Aberration   We build Java applications like Go or Rust programs. Fat JARs. Docker...
published: true
---

# Pragmatica Aether: Let Java Be Java

## The Aberration

We build Java applications like Go or Rust programs. Fat JARs. Docker images. Kubernetes deployments. Everyone does it, so it looks normal.

It contradicts Java's design DNA.

Java has always been a language for managed environments. Applets ran inside browsers. Servlets ran inside application servers. EJBs ran inside containers like JBoss and WebLogic. OSGi bundles ran inside runtime containers like Eclipse Equinox. In every generation, the pattern was the same: a managed runtime hosts the application. The application handles business logic. The runtime handles infrastructure.

The fat-jar era threw that away. We stopped letting Java be Java. We started bundling web servers, serialization frameworks, service discovery clients, configuration management, health checks, metrics libraries, and logging frameworks into every application. Then we wrapped the result in a Docker container and deployed it to an orchestration platform that reimplements — poorly — the infrastructure management that Java runtimes used to provide natively.

This article introduces [Pragmatica Aether](https://pragmaticalabs.io/aether.html): a distributed runtime that returns Java to its natural habitat. Application handles business logic. Runtime handles infrastructure. This isn't radical — it's returning to what Java was designed for.

## The Problem: Infrastructure Wearing a Business Logic Mask

Think of what a typical Java microservice carries. A web server (Tomcat, Netty, Undertow). A serialization framework (Jackson, Gson). A dependency injection container (Spring, Guice). A service discovery client (Eureka, Consul). Health check endpoints. Configuration management (Spring Cloud Config, Consul KV). A metrics library (Micrometer, Dropwizard). A logging framework (Logback, Log4j2). Retry logic (Resilience4j). Circuit breakers. HTTP client configuration. The application is wearing a heavy winter coat of infrastructure, armed to the teeth to survive in a hostile environment.

Now consider the coupling this creates.

Update Java version — rebuild and test every service. Change your message broker from RabbitMQ to Kafka — modify, rebuild, and redeploy every application that touches messaging. Add a new observability tool — update dependencies in every microservice. Switch cloud providers — rewrite configuration, SDK calls, and deployment manifests across the entire fleet. Each change ripples through dozens or hundreds of services because infrastructure is entangled with business logic at the dependency level.

This is the coupling trap. Your application's `pom.xml` doesn't distinguish between business dependencies and infrastructure dependencies. They compile together, deploy together, and break together. A security patch in Netty requires a new build of every service that embeds a web server — which is all of them.

Framework lock-in makes this worse. It isn't a vendor problem — it's an architecture problem. Spring's dependency injection fights with Kubernetes service mesh for control over service routing and circuit breaking. The framework's configuration system overlaps with Consul KV and Kubernetes ConfigMaps. Your cloud SDK's retry logic conflicts with Resilience4j. Every layer claims authority over the same cross-cutting concerns, and the conflicts surface as subtle bugs in production — not during development.

This is an architecture problem. Architecture problems have architectural solutions.

## Aether: The Core Idea

What you write: an interface annotated with `@Slice`, plus business logic implementation.

```java
@Slice
public interface OrderService {
    Promise<OrderResult> placeOrder(PlaceOrderRequest request);

    static OrderService orderService(InventoryService inventory, PricingEngine pricing) {
        return request -> inventory.check(request.items())
                                   .flatMap(available -> pricing.calculate(available))
                                   .map(priced -> OrderResult.placed(priced));
    }
}
```

What you don't write: everything else.

No HTTP clients — inter-slice calls are direct method invocations via generated proxies. No service discovery — the runtime tracks where every slice instance lives. No retry logic — built-in retry with exponential backoff and node failover. No circuit breakers — the reliability fabric handles failure automatically. No serialization code — request/response types are serialized transparently.

A method call via imported interface is the only visible contract. The only hint that the actual call might be remote is a design requirement: slice methods should be idempotent. This isn't a limitation — it's what enables retry, scaling, and fault tolerance to work transparently. The same request, processed by any available instance, producing the same result. Most read operations are naturally idempotent. For writes, standard patterns like idempotency keys and conditional writes handle it cleanly.

Everything else is the environment's job: resource provisioning, scaling, transport, discovery, retries, circuit breakers, configuration, observability, logging, tracing, monitoring, security. None of these are application concerns and none should be handled at the business logic level.

The [JBCT Leaf pattern](https://pragmatica.dev/articles/six-patterns-that-cover-everything) serves two purposes here: it documents the design ("what we expect from an external implementation") and encourages exactly one interface per dependency. Different implementations may have different technical properties — performance, latency, memory consumption — but as long as they're compatible with the interface, business logic works unchanged.

You write basically pure business logic that scales from your local computer to a global multi-zone distributed deployment, transparently.

## Under The Hood: What Makes It Work

Five architectural decisions make this possible.

**Consensus KV Store.** A single source of truth for all configuration, deployment state, and service discovery. Based on the [Rabia protocol](https://dl.acm.org/doi/10.1145/3477132.3483582) — a crash-fault-tolerant, leaderless consensus algorithm published in 2021. Any node can propose; agreement is reached through a two-round voting protocol with a fast path when super-majority agrees in round one. No external config servers. No etcd. No Consul. Configuration changes propagate through consensus and take effect cluster-wide.

**Built-in Artifact Repository.** DHT-based storage with configurable replication — 3 replicas with quorum reads/writes in production, full replication in development. Artifacts are chunked into 64KB pieces, distributed across nodes via consistent hashing, and integrity-verified with MD5 and SHA-1 on every resolve. No external Nexus or Artifactory needed. During development, slices resolve from your local Maven repository. In production, the cluster is self-contained.

**ClassLoader Isolation.** Each slice runs in its own `SliceClassLoader` with child-first delegation. Two slices can use different versions of the same library without conflict. Shared dependencies like Pragmatica Lite core are loaded once in a parent classloader. No dependency conflicts. No classpath hell between slices.

**Declarative Deployment.** Blueprints — TOML files — describe the desired state: which slices, how many instances.

```toml
id = "org.example:commerce:1.0.0"

[[slices]]
artifact = "org.example:inventory-service:1.0.0"
instances = 3

[[slices]]
artifact = "org.example:order-processor:1.0.0"
instances = 5
```

Apply with one command: `aether blueprint apply commerce.toml`. The cluster resolves artifacts, loads slices, distributes instances across nodes, registers routes, and starts serving traffic. The cluster converges to the desired state automatically.

**Infrastructure Independence.** Aether nodes are identical — there's only one deployment artifact to manage at the infrastructure level. Node updates and application deployments run on completely independent schedules. Update Java — roll it out across nodes without touching applications. Update the Aether runtime — same. Update business logic — deploy new slice versions without touching infrastructure. Each independently, each without downtime. This is the fundamental benefit of proper separation: when layers don't share a deployment unit, they don't share a deployment schedule.

## Fault Tolerance: The 50% Rule

The system survives failure of less than half the nodes. Performance may degrade until replacements spin up, but functionality remains intact — actual redundancy, not just graceful degradation. A 5-node cluster tolerates 2 simultaneous failures. A 7-node cluster tolerates 3. The same request, processed by any available node, producing the same result. Quorum requires `(N/2) + 1` nodes — as long as a majority is alive, the cluster operates normally.

Leader failover is consensus-based and near-instant. Node replacement happens automatically — the Cluster Deployment Manager detects the deficit and provisions a replacement through the NodeProvider interface. The entire recovery sequence — from failure detection through state restoration to serving traffic — completes without human intervention.

When a node fails, the recovery is automatic. Requests to slices on the failed node are immediately retried on healthy nodes. A replacement node is provisioned. It connects to peers, restores consensus state from a cluster snapshot, re-resolves artifacts from the DHT, and re-activates assigned slices. Dead nodes are automatically removed from routing tables. The new leader reconciles stale state. No human intervention required.

Canary deployment leverages this fault tolerance to bring a new version in gradually, with an operator-settable traffic split:

```bash
aether deploy org.example:order-processor 2.0.0 --canary --traffic 25 -n 3
aether deploy promote <id> --traffic 50
aether deploy complete <id>          # 100% to v2, drain v1
```

Deploy during business hours. The first slice of traffic is 5% unless `--traffic` says otherwise; widen it with `promote` and watch it with `aether deploy status <id>`. If health degrades, `aether deploy rollback <id>` re-weights toward the previous version; requests already dispatched are unaffected.

The split is worth stating precisely, because "shift 25% of traffic" sounds more exact than what any cluster can do. It is per-node weighted selection over the endpoints that node currently knows, so a traffic change takes effect on each node as it observes the change. It is not atomic across the cluster and not instantaneous. Whether traffic then divides in the requested proportion is unverified: the mechanism is in the source, and no end-to-end test demonstrates the proportion. `--blue-green` and `--rolling` are the other two strategies, and the rolling one is a flag ahead of its server: the rolling-update API does not exist server-side ([#291](https://github.com/pragmaticalabs/pragmatica/issues/291)). Canary is the path this section describes.

*Corrected 2026-09-05. This section was written against `aether update`, a real command at publication that the CLI later consolidated into `aether deploy --canary`; the guarantee sentence above replaces "instant rollback" and "traffic immediately shifts back", which claimed more than the mechanism provides. Mechanism verified at source by the Aether maintainer.*

## For Every Project: Legacy, Greenfield, And Everything Between

### Legacy Migration

Your legacy Java system doesn't need a complete rewrite. It needs a path forward.

Pick a relatively independent part of your system — something hitting limits, something with clear boundaries. Extract an interface. Annotate it with `@Slice`. Wrap the legacy implementation:

```java
private Promise<Report> generateReport(ReportRequest request) {
    return Promise.lift(() -> legacyReportService.generate(request));
}
```

One line to enter the Aether world. `Promise.lift()` wraps the legacy call, catches exceptions, and returns a proper `Result` inside a `Promise`. Your legacy code keeps running. Call sites don't change. You haven't added risk — the initial deployment in Ember runs in the same JVM as your existing application, which means it's no worse than what you have today. You've laid the foundation for removing risk, not adding it. Moving from Ember to a full Aether cluster is a configuration change, not a code change — and that's when the 50% rule starts to apply.

From there, it's the strangler fig pattern. Extract a hot path, deploy it as a slice, route traffic, repeat. Each extracted slice can be gradually refactored using the [peeling pattern](https://pragmatica.dev/articles/fail-safe-legacy): first wrap everything in `Promise.lift()`, then decompose into a Sequencer with each step still wrapped, then peel individual steps into clean JBCT patterns. Tests pass at every step. The `lift()` calls mark exactly where legacy code remains, making progress visible and remaining work obvious.

No rewrite required. No big bang migration. One sprint to first slice in production. The [migration article](https://pragmatica.dev/articles/fail-safe-legacy) covers the full path in detail — from initial wrapping through gradual peeling to clean JBCT code.

### Greenfield Development

For new projects, slices enable a granularity that's impossible with traditional microservices.

Each slice can be as lean as a single method — and that's the recommended approach. There are no operational or complexity tradeoffs for small slices because Aether handles all the infrastructure overhead. No container to configure, no load balancer to provision, no monitoring to set up per service. You get per-use-case scaling: one slice serving 50 instances during peak load while another idles at minimum. That kind of granularity would be operationally insane with traditional microservices — each needing its own container, load balancer, monitoring, and deployment pipeline. With Aether, it's the default.

[JBCT patterns](https://pragmatica.dev/articles/six-patterns-that-cover-everything) — Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects — compose naturally within slices. Each slice method is a [data transformation pipeline](https://dev.to/siy/the-underlying-process-of-request-processing-1od4): parse input, gather data, process, respond. The patterns provide consistent structure within slices. [Slices provide consistent boundaries](https://pragmatica.dev/articles/slices) between them.

### The Spectrum

Same slice model, different granularity. A service slice wraps an entire legacy component. A lean slice implements a single method. Both coexist in the same cluster, deployed and scaled independently.

[Slice is the executable unit](https://pragmatica.dev/articles/slices). It can be big or small as necessary and convenient. The architecture accommodates both monolith migration and greenfield development simultaneously. Your legacy system gains fault tolerance while new features get maximum deployment flexibility.

## Scaling: Two Levels, Three Tiers of Intelligence

### Two-Level Horizontal Scaling

Aether scales in two dimensions independently:

- **Slice scaling**: Spin up more instances of a specific slice on existing nodes. Classes are already loaded — scaling takes milliseconds, not seconds.
- **Node scaling**: Add more machines to the cluster. The node connects, restores state, and begins accepting work.

Independent controls, combined effect. Each node hosts at most one instance of a given slice, so scaling a slice beyond the current node count requires adding nodes first. Add 2 more nodes to a 3-node cluster, then scale a hot slice to 5 instances — one per node. No coordination between the two dimensions required.

### Three-Tier Decision System

**Tier 1 — Decision Tree (1-second intervals).** Instant reactive decisions based on CPU utilization, request latency, queue depth, and error rate. CPU above 70%? Add an instance. Below 30% sustained? Remove one (if above minimum). Latency exceeding P95 threshold? Scale up. Error rate above 1% due to timeouts? Scale up. Deterministic, predictable, fast. Handles routine load changes with configurable cooldown periods — 30 seconds for scale-up, 5 minutes for scale-down — to prevent oscillation.

**Tier 2 — TTM Predictor (60-second intervals).** An ONNX-based machine learning model (Tiny Time Mixers) analyzing a 60-minute sliding window of metrics — CPU usage, request rate, P95 latency, active instances. Forecasts load and adjusts the Decision Tree's thresholds preemptively. If TTM predicts a load increase, it lowers the scale-up CPU threshold by 20% so the reactive tier responds earlier. The cluster scales before the spike arrives, not after. The key design principle: the cluster always survives on Tier 1 alone. TTM enhances; it doesn't replace. If TTM fails — model load error, insufficient data, inference failure — the Decision Tree continues with default thresholds. The error is logged and recorded in metrics. No scaling disruption.

**Tier 3 — LLM-based (planned).** Long-term capacity planning and cluster health monitoring. Seasonal pattern prediction, maintenance window planning, anomaly investigation. This tier is not yet implemented — the current system operates with Tiers 1 and 2.

Fault tolerance makes preemptible instances viable for burst scaling. If a spot instance gets reclaimed, the cluster survives — it was designed for nodes to disappear.

You don't need a PhD in distributed systems or a dedicated platform team. The scaling system manages itself.

## Development Experience: From Laptop To Production

### Three Environments, Zero Code Changes

**Ember.** Single-process runtime with multiple cluster nodes running in the same JVM. Fast startup, simple debugging. Deploy your slices alongside your existing application — slices call each other directly in-process. No network overhead. Standard debugger breakpoints work as expected. Perfect for local development and unit testing.

**Forge.** A 5-node cluster simulator running on your laptop. Real consensus. Real routing. Real failure scenarios. Kill nodes, crash the leader, trigger rolling restarts — and watch the cluster recover in real time through a web dashboard with D3.js topology visualization, per-node metrics (CPU, heap, leader status), and event timeline. Configurable load generation with TOML-based multi-target configuration lets you stress-test realistic scenarios — set request rates, define body templates, and run duration-limited load tests. Chaos operations include node kill, leader kill, and rolling restart. Forge validates the entire dependency graph before starting anything.

**Aether.** Production cluster. Same slices, same code, different scale. Your code doesn't know which environment it's running in. Whether inter-slice calls are in-process or cross-network is transparent.

### Tooling

37 CLI commands cover deployment, scaling, updates, artifacts, observability, controller configuration, and alerts — in both single-command and interactive REPL modes. A web dashboard streams real-time metrics via WebSocket — no polling. 30+ REST management endpoints enable full programmatic control of everything the CLI can do. Prometheus-compatible metrics export (`/metrics/prometheus`) integrates with existing monitoring stacks. Metrics are push-based at 1-second intervals, with zero consensus overhead — they bypass the consensus protocol entirely. Per-method invocation tracking with P50/P95/P99 latency and configurable slow-invocation detection strategies (fixed threshold, adaptive, per-method, composite) surfaces performance issues before users notice. Dynamic aspects let you toggle LOG/METRICS/LOG_AND_METRICS modes per method at runtime via REST API, without redeployment.

Test realistic failure scenarios on your laptop. Deploy to production with a config change, not a code change.

## Maturity

Aether is a working system, not a concept paper.

81 end-to-end tests run against real 5-node clusters in Podman containers, validating cluster formation, quorum establishment, slice deployment and scaling, blueprint application with topological ordering, multi-instance distribution, artifact upload and cross-node resolution with integrity verification, leader failure and recovery, node restart with state restoration, and orphaned state cleanup after leader changes.

The recovery and fault tolerance claims come from automated tests against real clusters, not marketing slides.

## Let Java Be Java

Java's lineage leads here. From applets managed by browsers, through servlets managed by application servers, through EJBs managed by enterprise containers, through OSGi managed by runtime frameworks — to Aether, managed by a distributed runtime.

The fat-jar era was a detour. An understandable one — when Docker emerged, it offered a universal packaging format, and the industry standardized on it regardless of language. Java adopted the patterns of languages that were designed to produce standalone binaries. We started treating Java applications like Go programs with a heavier runtime. But it was never the destination. Java was designed for managed environments. The JVM makes it possible. The runtime manages the application. That's the lineage. Aether continues it.

Two entry points exist today. Wrap your legacy monolith behind a `@Slice` interface in one sprint and gain fault tolerance without rewriting anything. Or start fresh with maximum clarity — lean slices, explicit contracts, per-use-case scaling. Both paths converge on the same runtime, the same cluster, the same operational model. Both paths can coexist — legacy service slices and new lean slices running side by side.

Fault tolerance is not an afterthought — it's the foundation. Scaling is not your problem — it's the environment's. Infrastructure is not your code — it's the runtime's. The heavy winter coat comes off. The application breathes.

---

- [Pragmatica Aether](https://pragmaticalabs.io) — project site
- [GitHub Repository](https://github.com/pragmaticalabs/pragmatica) — source code

---

Let Java be Java. Let infrastructure be infrastructure. Write business logic that scales from your laptop to global deployment without changing a line of code.
