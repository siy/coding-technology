# Part V — Deploy & operate like a senior

Part IV proved the app four ways: as logic, as a cluster under chaos, as a load curve, and
as the destination of a migration. Running it in production is the last skill this book teaches,
and the senior version of it is not the deploy command. It is knowing what the runtime guarantees,
what it does not, and shaping both your operations and your design around the difference. This
part assembles and ships a blueprint, scales one slice without scaling the app, rolls a new
version out without a window, reads what the running cluster reports, and treats the majority-of-
nodes rule as a force on your design rather than a footnote in your runbook.

## Blueprints and shipping a slice

You have slices; production needs them assembled into a deployable unit, placed on a cluster, and
made live — without hand-wiring and without a maintenance window for the first cut. A blueprint is
that assembly: the declarative deployable that names the slices and the config sections each one
resolves, the same assembling from Part 0 raised to deployment scale. The runtime reads the
blueprint's manifest before it loads a class.

Operating it is three moves: stand the cluster up once, then push and deploy on each release.

```bash
# once — stand up the cluster (seven phases; config per bootstrap-config.md)
aether cluster bootstrap orders-cluster.toml --wait

# each release
aether -c <node-ip>:8080 artifacts push   org.example:orders:1.0.0-SNAPSHOT
aether -c <node-ip>:8080 blueprints deploy org.example:orders:1.0.0-SNAPSHOT --wait
```

Coordinates are `group:artifact:version`; `blueprints deploy` appends `:blueprint` for you, and
`--wait` blocks until the deploy settles. The `deploy-prod.sh` that `jbct init` scaffolds emits
exactly these two commands, taking the cluster address from `-c` or `AETHER_ENDPOINT`. The
getting-started tutorial walks the whole path end to end, including a real cloud bootstrap; this
chapter assumes it and works from the operating side.

Why a blueprint rather than a deploy script: because assembling is declarative and
environment-independent (Part 0), one blueprint deploys to Forge, staging, and production and
differs only in the config sections resolved per environment. The deploy is a data operation, not
a rewiring one — which is what makes "configuration change, not code change" hold at the cluster
boundary, not just inside a slice.

Two current realities of the deploy path are worth knowing before you hit them.

<!-- BANNER:deploy-security-520 status:rc3 remove-when:#520-fixed -->
> _Status as of rc3 (#520): `artifacts push` requires an OPERATOR or ADMIN identity. A cluster
> bootstrapped with `security_mode = "NONE"` — the mode a quickstart reaches for — treats every
> caller as an anonymous VIEWER and ignores API keys, so the push is rejected even with the admin
> key the bootstrap mints. The path that works on a real cluster: bootstrap with the secure
> `security_mode = "API_KEY"` default and pre-seed an operator key — an `AETHER_API_KEYS` entry
> baked into the node's cloud-init, or an `[app-http.api-keys.<key>]` table under
> `node_config.app-http` in the bootstrap config (the mechanism the bootstrap-config reference
> documents). Then the push authenticates and the deploy proceeds._
<!-- /BANNER:deploy-security-520 -->

<!-- BANNER:deploy-teardown-521 status:rc3 remove-when:#521-fixed -->
> _Status as of rc3 (#521): `aether cluster destroy --cluster=<name> --yes` can report a cleanup
> failure and still exit 0 and remove the cluster's registry entry, leaving paid VMs running — a CI
> check that reads only the exit code will believe the cluster is gone while it keeps billing.
> Until this is fixed, verify a teardown in the provider console, and use
> `tools/cloud-reaper.sh --cluster <name> --destroy` as the safety net that actually reaps stranded
> resources._
<!-- /BANNER:deploy-teardown-521 -->

## Scaling one slice, not the app

A sale drives orders; the payment slice saturates while the catalog idles. Scaling the whole app
to relieve one slice wastes nodes and keeps the two coupled — the thing slicing was meant to undo.
Aether scales on two independent axes instead.

A slice runs a number of instances across nodes, set per slice, so payment can run at fifty while
catalog idles at one, because each slice is its own deployable (Part II). Underneath, the cluster
scales its node count. Both are direct commands:

```bash
aether scale org.example:orders:1.0.0-SNAPSHOT -n 8 --placement WORKER_PREFERRED --wait
aether cluster scale hetzner worker --count 3
```

The blueprint carries the bounds and thresholds (`instances`, `minInstances`, `maxInstances`,
`scaleUpThreshold`, `scaleDownThreshold`); `--placement` chooses `CORE_ONLY`, `WORKER_PREFERRED`,
or `WORKER_ONLY`. Core nodes stay odd and at least three — that is the majority rule at the end of
this part, wearing its operational face.

The decision can be automatic. A per-slice autoscaler decides each slice from that slice's own
composite load — active invocations and p95 latency, not a cluster-wide CPU average — and moves it
one instance at a time between its min and max. That reactive tier is on by default and runs on the
leader. Above it, a predictive tier forecasts load from a time series and scales ahead of the
curve; it ships but is off by default and needs an operator-trained model, so treat it as opt-in
rather than assumed. A third, LLM-driven planning tier is on the roadmap and not in the runtime —
name it as the direction of travel, don't reach for it.

Why scale per slice: because slices are independent deployables, the unit of scaling is the unit
of load, so you add capacity exactly where the pressure is and nowhere else. And because the
reactive decision reads each slice's own signal, a busy payment slice never drags the idle catalog
up alongside it.

## Shipping a new version without a window

A new orders version is ready at two on a Tuesday. You want it live without a maintenance window,
and without betting the whole fleet on it being correct. The basic deploy replaces the running
version in place — `aether deploy <coords>`, the same immediate deploy as `blueprints deploy`. For
a version you want to prove on real traffic first, the zero-downtime strategies shift traffic
gradually and gate promotion on live health:

```bash
aether deploy org.example:orders:1.1.0 --canary --traffic 5 --error-rate 0.01 --latency 500
aether deploy promote  <deploymentId> --traffic 25
aether deploy complete <deploymentId>
aether deploy rollback <deploymentId>     # or pull it
```

The canary starts the new version at five percent of traffic and holds; `--error-rate` and
`--latency` are the promotion gates it measures against. You widen it with `promote`, finish with
`complete`, or undo with `rollback` — a first-class subcommand, backed by an automatic rollback
manager when enabled, because a safe deploy is one you can reverse as easily as you made it.
`--blue-green` and `--rolling` are the other two strategies; rolling can require manual approval per
step.

<!-- BANNER:deploy-mixed-version-434 status:rc3 remove-when:#434-ships -->
> _Status as of rc3 (#434): these strategies roll a new **slice** version across a cluster whose
> nodes all run the **same Aether release**. They are not a cluster-binary upgrade. There is no
> version negotiation on the cluster wire yet, so nodes on different Aether protocol versions cannot
> decode each other; the rule for upgrading Aether itself is rebuild-together — every node on one
> release. Canary your application freely; upgrade the runtime as a fleet._
<!-- /BANNER:deploy-mixed-version-434 -->

Why gate on live health: a new version's real behavior shows only under real traffic, so a canary
that promotes on measured error rate and latency turns "we think it is fine" into "the numbers say
it is fine at five percent, then twenty-five, then all." Rollback keeps the cost of being wrong
down to the traffic you had already exposed — which is the whole point of not shipping to a hundred
percent at once.

## Reading what the cluster reports

In production you cannot attach a debugger; you operate on what the cluster tells you. It tells you
two things well: where one request went, and how each slice is behaving.

Every inbound request is given a request id, and the runtime carries it for you. It propagates
across async hops — the `Promise` carries the ambient context through the pipeline — and across
slice calls and nodes, because the id rides the invocation message on the wire. It is bound into
the logging context too, so a log line on any node the request touched carries the same id, and you
can pull the whole distributed trace by it:

```bash
curl http://<node-ip>:8080/api/traces?id=<requestId>
```

You get this without threading a parameter through your own code; the correlation is a property of
the invocation fabric, not a discipline each handler has to keep.

The metrics surface is the management API. It exposes per-node and per-slice metrics, including
per-method latency percentiles — p50, p95, p99 — and a slow-invocation list, at `/api/metrics`
(with `/api/metrics/prometheus` for scraping), `/api/invocations/metrics`, and
`/api/invocations/metrics/slow`. Per-method observability depth is tunable at runtime for a single
`(slice, method)` pair through `/api/observability/config` and `/api/observability/depth`, so you
turn detail up on the one method you are chasing and leave the rest cheap.

Why the automatic correlation is the load-bearing piece: because the id is bound by the framework
and propagated through the `Promise` context and the invocation fabric, a request stays traceable
across every slice and node it touched with no application code carrying it. The observability is
the runtime's, so it is uniform across your services instead of as good as each team remembered to
make it.

## The majority rule, as a design force

The last question is how much failure the cluster absorbs, and — the senior form of the question —
how that should shape what you build, not only how you operate.

Aether commits through consensus, and consensus needs a strict majority of the voting nodes. The
voting nodes are the core nodes; workers and spot nodes add capacity but not votes. So the cluster
stays writable while a majority of core nodes are alive and mutually reachable — quorum is half the
core count plus one — and it tolerates the loss of a minority: three core nodes tolerate one
failure, five tolerate two.

The edge is the part that matters. A partition or failure that drops a side below quorum makes that
side go passive: it stops committing rather than serving stale writes, so there is no split-brain
and no divergent history — the majority side keeps going, the minority side waits to rejoin. An
even split leaves neither side with a majority and both go passive, which is why the core count is
kept odd.

This is why "highly available" is the wrong phrase for it. The honest statement is per-operation
and names its mechanism: writable while a strict majority of core nodes is alive; a minority loss
tolerated; a sub-majority partition stops committing on the losing side. That is more useful to an
operator than a one-bit label, because it tells you exactly what to check and exactly what will
happen when you lose a node.

And it is a design force, not only an ops fact. Because availability is conditional on
majority-core liveness, you size the core for the failures you must survive — three to tolerate
one, five to tolerate two — and let cheaper workers carry load without carrying votes. Because a
minority partition pauses rather than lies, your slices never have to defend against split-brain
writes; the runtime refuses them. Idempotency from Part II and this rule are the two facts your
design leans on: repeat-safe operations plus a consensus that never diverges mean that a retry
after a failover is always safe — which is the guarantee the whole book has been building toward.

With the app deployed, scaled, updated, observed, and understood at its failure boundary, the
mechanics are complete. Part VI steps back from them to the way of thinking that produced them:
deriving an idiom when the runtime offers none, designing for idempotency and failure from the
first line, and the techniques this book had to invent along the way.
