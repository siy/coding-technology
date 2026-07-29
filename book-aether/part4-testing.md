# Part IV — Testing & evolving

The order app is built. Parts II and III turned a plain use case into a sliced application
that reserves inventory, charges the customer, records events, and recovers a half-finished
payment. What remains before it is a system you can trust is proof: that the logic is right,
that it survives a cluster misbehaving, that it holds its latency under load, and that you can
move an existing service onto it without stopping the world. This part is those four kinds of
proof, in the order you reach for them.

## Unit testing as plain Java

A distributed system has a reputation for being hard to test, and the reputation is earned by
systems that couple their logic to their infrastructure: to test one method you boot a broker,
start a database, wire a web of mocks, and chase timing flakes. An Aether slice does not carry
that coupling. From Part II: a slice is plain Java, its dependencies are the interfaces named in
its factory, and assembling those dependencies is environment-independent and checked at compile
time. That last fact is what makes the test honest — the wiring you exercise in a test is the
wiring that ships, not a mock standing in for it.

So you test a use case by handing its factory the dependencies it names, as lambdas, and
asserting on what comes back. Part II showed the happy path; this is its mirror, the failure
path:

```java
@Test
void placeOrder_returnsOutOfStock_whenInventoryRejects() {
    Inventory inventory = items -> new OrderError.OutOfStock(items.getFirst().sku()).promise();
    Payments  payments  = (customer, reservation) -> Promise.success(new Charge("CH-1"));

    OrderService.orderService(inventory, payments)
                .placeOrder(sampleOrder)
                .await()
                .onSuccess(placed -> fail("expected OutOfStock, got " + placed))
                .onFailure(cause -> assertInstanceOf(OrderError.OutOfStock.class, cause));
}
```

Inventory is a one-line lambda that returns the typed failure instead of a reservation, payments
is never reached, and the assertion is on the `Cause` the pipeline carries out. No container
starts, nothing is mocked in the framework sense, and the test runs in the time it takes to call
three methods.

Two habits make these tests carry their weight. Exercise each named failure, not only success: a
slice's `Cause` types are its contract for going wrong (Part 0), and a test per case is what
keeps that contract from rotting as the pipeline grows. And assert on the `Cause`'s type, not its
message — the type is what a caller routes on, a status code or a compensation; the message is
for a human, and pinning it makes the test brittle for no gain.

Why this reaches past convenience: because assembling is verified by the compiler and never
varies between environments, a green unit test is a real statement about production behavior, not
an approximation you re-confirm later. That lets you spend the integration budget on what unit
tests genuinely cannot see — the network, the failover, the timing — which is the next section.

## Forge: a cluster on your laptop

A unit test proves the logic. It says nothing about what happens when the node holding the
inventory slice dies in the middle of a `placeOrder`, when the leader changes while traffic
flows, or when you restart every node one at a time during a deploy. Those behaviors live in the
runtime, and to build confidence in them you need to watch the cluster misbehave. Forge is where
you do that.

Forge runs a full cluster topology — five nodes by default — inside a single JVM, on the Ember
runtime, and adds a dashboard, a load generator, and chaos controls on top. A cross-slice call in
Forge goes through the same invocation fabric it would in production; the only thing that changes
is the network beneath it, localhost instead of real links. The project `jbct init` scaffolds
already knows how to start it:

```bash
./run-forge.sh   # → aether-forge --config forge.toml --blueprint org.example:orders:1.0.0-SNAPSHOT:blueprint
```

with the dashboard on `http://localhost:8888`, the app's HTTP on `:8070`, and the management API
on `:5150`. The getting-started tutorial in the repo (`aether/docs/getting-started.md`) walks the
first run end to end — install, scaffold, `run-forge.sh`, first request — and this chapter builds
on top of it rather than repeating it.

One sentence governs how to read everything Forge shows you. Forge is a simulation of
distribution, not a distributed deployment: every one of those five nodes shares the same
process, the same memory, and the same failure domain, so a "5 nodes" reading on the dashboard is
five topology positions, not five machines. That framing is the exact boundary of what a Forge
result proves, and it is worth holding onto rather than reading past.

Within that boundary, the chaos controls are real levers. From the dashboard or the `/api/chaos`
endpoints you kill a node, kill the leader — Forge reports which node was leader and which took
over — start a rolling restart, or add a node, while the load generator (`/api/load`) drives
steady traffic through the app. This is where you confirm that your design's idempotency claim
(Part II) actually holds: kill the leader mid-`placeOrder`, and because the operation is safe to
repeat, the retry lands on a surviving instance and the customer sees one order and one charge.

Read the honest limit into your test as well. Forge injects node loss as a graceful stop — the
node flushes its write-ahead log on the way down — so what it proves is recovery from a clean
departure, and from a blackholed node whose traffic is dropped, rather than recovery from a
process torn apart mid-write. A true crash-kill, where a node loses power between the write and
the fsync, is a property of a real cluster, not of a single JVM that cannot un-flush a log. Forge
homes its data under `$AETHER_HOME/forge-data` precisely so the stream log is crash-durable
across a graceful restart during development; the torn-write case waits for separate machines.

Why keep a tool with that boundary at the center of your workflow: because a failure you
reproduce in Forge is the same failure you get in Aether — same fabric, same code, same recovery
path — Forge is the first and cheapest gate for a distributed behavior, cheap enough to run on
every change. The shared failure domain is exactly why it is the first gate and not the last: the
cloud sweep is where the torn-write and real-partition cases get their vote. Order your hardening
that way, Forge first and cloud last, and you spend real infrastructure only on what only real
infrastructure can show.

## Load testing with k6

The orders app holds its latency budget at rest; the question load testing answers is what it
does under sustained traffic and under a burst, and which slice gives first. Because Forge serves
the app over ordinary HTTP on `:8070`, any HTTP load tool drives it, and the repo standardizes on
k6: each example under `examples/*/k6/` ships steady-state, ramp-up, and spike scripts with a
runner for each.

A k6 script is scenarios plus thresholds. The scenarios describe the traffic shape; the
thresholds are the pass/fail line:

```javascript
export const options = {
  scenarios: {
    warmup: { executor: 'ramping-arrival-rate', startRate: 10, timeUnit: '1s',
              stages: [{ target: 200, duration: '30s' }], preAllocatedVUs: 50 },
    steady: { executor: 'constant-arrival-rate', rate: 200, timeUnit: '1s',
              duration: '5m', preAllocatedVUs: 100, startTime: '30s' },
  },
  thresholds: {
    http_req_duration: ['p(95)<150', 'p(99)<400'],
    errors: ['rate<0.01'],
  },
};
```

Ramp to find the knee, hold at the target to read steady-state latency, and keep a hard
error-rate ceiling so a run that "passes" on latency but drops one request in fifty still fails.
A separate spike profile jumps the rate in one step to see how the app sheds load and recovers.
The scripts are env-driven — node count, target rate, duration — so the same file runs against a
five-node Forge and, later, a real cluster.

Read the numbers for their shape, not their ceiling. A single JVM's throughput is not the
cluster's, so an absolute requests-per-second from Forge is a relative figure; what transfers is
the curve — where p99 turns up, which slice saturates first, whether the error rate climbs before
or after latency does. Why load-test here at all, then: because the failure mode is a design
property and surfaces the same in simulation, you learn "payment is the bottleneck under burst"
or "the read model lags at three times steady" cheaply and early, and take the absolute ceiling
from the cloud sweep once the shape is right.

## Migrating a legacy service, one call at a time

Few teams start on Aether; most arrive with a working order service on Spring, Micronaut, or
Quarkus, and cannot halt the business to rewrite it. The move onto Aether is incremental, and the
technique is the strangler fig: wrap the existing service in a slice, route new traffic through
the slice, then replace its internals one call at a time until nothing of the original remains.

The wrap is where `Promise.lift` earns its place. A legacy method throws exceptions and blocks; a
slice speaks in `Promise` and carries failures as values. `Promise.lift` bridges the two — it
runs a throwing, blocking supplier, turning a thrown exception into a `Cause` and the return into
a `Promise`:

```java
static OrderService orderService(LegacyOrderService legacy) {
    return request -> Promise.lift(() -> legacy.place(toLegacy(request)))
                             .map(OrderPlaced::from);
}
```

The legacy service now runs inside a slice, reachable across the cluster like any other, with its
throws captured as typed failures at the boundary. Nothing downstream knows it is talking to old
code.

Then you peel. The legacy `place` calls inventory and payment internally; the sliced app has an
`Inventory` slice and a `Payments` slice already. Replace the internal inventory call with a call
to the `Inventory` slice, test, deploy; replace payment next; continue until `place` is the
pipeline from Part II and the legacy shell is empty. Each step is a single call moved behind a
boundary that already exists — the slice boundary you would have drawn anyway.

Why migrate this way rather than rewrite: because `Promise.lift` makes a legacy call an ordinary
value in the same pipeline as a native step, every move is mechanical and reviewable on its own,
and you never hold two architectures in your head at once. The "before" is a monolithic
`OrderService`; the "after" is the sliced app this book built; the migration is the sequence of
small, safe steps between them. The repo's migration guide
(`aether/docs/slice-developers/migration-guide.md`) carries the framework-by-framework mapping
and the peeling checklist.

With the app built, verified as logic, exercised as a cluster, measured under load, and reachable
from the code you are replacing, what is left is running it. Part V is deployment and operation —
assembling blueprints, scaling the slices independently, shipping a new version without a window,
and reading what the running cluster is telling you.
