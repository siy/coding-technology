# Spiral Pass 4 — System Altitude

*One platform runs a thousand venues, and an operator watching a dashboard at 2 a.m. sees a single booking fail in one venue without paging anyone — the failure was contained where it happened. By the time this pass ends, the three subsystems have composed into one system, the runtime rather than the business code carries observability across every venue, and the oldest argument in backend wiring quietly dissolves once you notice it was two questions all along.*

---

## What this pass does

Pass 3 closed on a platform that is more than one venue's subsystems. The booking, pricing, and event-management subsystems are one venue's worth of the domain; a real ticketing platform runs many venues, many events, many tenants, and the subsystems compose and coordinate across all of them. That multiplicity earns the final altitude.

This pass walks the system: the three subsystems composed into one running platform, instantiated across tenants. The methodology applies one last time — same six properties, same six patterns, same four shapes, same recovery triple — at the granularity where the system meets its environment. Most of the vocabulary is now familiar; the reader has carried it up three altitudes. What is new at system altitude is what only appears when subsystems are deployed and run at scale.

Three things become load-bearing here for the first time. **Technical cross-cutting** (observability, tracing, idempotency, retries) rises from runtime-handled-and-ignorable, where it sat at use-case altitude, to a defining property of the system, because operating a platform across a thousand venues is impossible without uniform instrumentation. **Assembly versus provisioning** — the distinction between wiring the system's internal composition and delivering the external resources it runs on — finally has to be named, because at system altitude both jobs are unavoidable and conflating them starts a long-running argument. And **resource provisioning**, what the system needs from its environment, each resource a typed Leaf, becomes an architectural concern rather than an implementation detail.

This is the last spiral pass. By its close, the methodology has been walked across four altitudes with one example and one vocabulary, and the architecture decisions that surfaced at each altitude — partial, named-but-not-resolved — are ready to be paid in full. The pass closes by handing off to the Architecture Synthesis module, where the deferred decisions become the framework.

---

## The system: what rises to the top

At every altitude so far, the formation question was "how do these group?" — steps into use cases, use cases into workflows, workflows into subsystems. At system altitude the question inverts, because there is only one system (the enterprise above it is out of scope). There is nothing to partition into. The question becomes: **what belongs at the system level, and what stays pushed down into a subsystem?**

The change-driver test still answers it, in its altitude-specific form. A concern is system-level when it changes for system-level reasons — when a change to the *platform itself*, not to any one domain, forces it to change. Multi-tenancy, platform-wide identity, cross-subsystem observability, the deployment surface: these change when the platform changes (a new tenant model, a new region, a compliance regime spanning every subsystem), not when booking's reservation rules or pricing's tier model change. They are system-level. Reservation rules stay in booking; tier definitions stay in pricing. The driver tells you where each concern lives: push it down unless it answers to the platform rather than to a domain.

The driver-kind at this altitude is the platform boundary and the operational envelope, where the subsystem altitude's driver was a domain concern. That is the last step of the telescope: the same recognition test, applied to the coarsest driver the methodology's scope admits.

One axis at this altitude is genuinely new and easy to confuse with grouping: **instantiation**. The platform runs the same booking subsystem across a thousand venues. That multiplication is not partitioning — it is the same subsystem, instantiated at scale. Deciding what is system-level (a design question, answered by change drivers) is distinct from running the system across many tenants (a scaling question, answered by the deployment vector). The pass keeps them apart: this section is about what rises to the top; the architecture section below is about running it at multiplicity.

---

## Assembly versus provisioning

The methodology has carried a distinction quietly since Pass 1, and system altitude is where it has to be named. Building a system is two jobs, not one.

**Assembly** is wiring the system's internal composition: which use cases compose into which workflows, which workflows into which subsystems, which subsystems into the system. It is the composition graph, built from the six patterns. Assembly is internal and deterministic — it is the design, expressed in code.

**Provisioning** is delivering the external resources the system runs on: the stores its data lives in, the message bus its subsystems exchange facts over, the scheduler its sweeps fire from, the identity service it authenticates against, the payment gateway its Leaves call. These are environmental. Each is a typed resource the system needs from outside itself, invoked through a Leaf — the same "resources as substrate" idea the methodology applied to triggers, now applied to everything the system depends on.

The two jobs were always different, and conflating them is the source of a long-running argument. Dependency-injection frameworks do both at once — they wire internal components and supply external implementations through one mechanism — which is why "how much wiring magic is too much" never resolves: it is two questions wearing one name. The methodology separates them. Assembly is composition; it needs no framework, only the patterns the reader already has. Provisioning is typed resource delivery at the boundary: the system declares the resources it needs as typed Leaves, and the environment supplies concrete implementations.

```java
// Provisioning — typed resources the system needs from its environment
ReservationStore reservations = ReservationStore.backedBy(relationalStore);
PaymentGateway   payments      = PaymentGateway.backedBy(externalProvider);
MessageBus       bus           = MessageBus.backedBy(broker);

// Assembly — compose subsystems from those resources, then the system from subsystems
var booking = BookingSubsystem.bookingSubsystem(reservations, payments, bus);
var pricing = PricingSubsystem.pricingSubsystem(priceLog, bus);
var events  = EventManagement.eventManagement(eventStore, bus);
var system  = TicketingSystem.ticketingSystem(booking, pricing, events);
```

(The notation convention from the earlier passes holds: composition shown in Java, the resource types named for what they mean rather than for any product that backs them.)

Once the two are separate, the wiring debate dissolves — not answered, dissolved, because the question conflated two jobs that were never one. Assembly is the composition graph; provisioning is the typed boundary. Neither is mysterious once it stops being mistaken for the other.

Provisioning treats every external dependency the way the methodology treated triggers: as a uniform typed resource. A trigger source — HTTP, scheduler, queue — was a resource that invokes a use case; a store, a bus, a gateway is a resource a Leaf invokes. Same shape, both directions. The payoff is concrete. Because the system declares its resources as typed Leaves and the environment supplies the implementations, the composition is assembled once and provisioned differently: real resources in production, in-memory or stubbed ones in a test, a recorded fixture in a replay, none of it touching a line of business code. Assembly stays fixed; provisioning varies. The separation that dissolved the wiring debate is the same one that makes the system testable.

---

## Technical cross-cutting becomes load-bearing

Pass 3 made *business* cross-cutting load-bearing — the audit ledger, compliance, concerns the business requires across subsystems. System altitude makes *technical* cross-cutting load-bearing: observability, distributed tracing, correlation identifiers, idempotency, retries, circuit-breaking. The distinction the methodology drew at use-case altitude pays off here. Business cross-cutting is part of the design, placed deliberately (audit-as-data or audit-as-Aspect). Technical cross-cutting is instrumentation, supplied uniformly by the runtime, and it stays out of business code entirely.

At lower altitudes this was easy to leave implicit — the runtime logged, traced, and retried, and the use case body never named any of it. At system altitude it becomes a defining property, because a platform spanning a thousand venues cannot be operated without uniform instrumentation. The operator at 2 a.m. can see one venue's booking fail, in context, with a trace that crosses subsystem boundaries, because the runtime supplies that trace identically everywhere — not because some use case remembered to log.

This is observability by construction. The system is observable not because each operation was instrumented by hand but because the runtime wraps every operation with the same technical Aspects, and the methodology's quarantine keeps those Aspects out of the business code. The use case body still sees only its typed outcome; the platform sees everything around it. The two never mix, which is exactly why the business code stays legible at a thousand-venue scale and the operability stays uniform. What benefits the reader of the code — quarantine, legibility — is what gives the operator a coherent dashboard. They are the same discipline seen from two ends.

The instance dimension sharpens the point. The same operation runs in a thousand venues; if observability were hand-coded per use case, that would be a thousand chances to instrument one operation slightly differently, and the dashboard would quietly lie. Runtime-supplied instrumentation is what makes one coherent view possible across the whole platform: every venue's booking traced identically, because the trace belongs to the runtime, not the venue. The same uniformity serves a non-human operator — an agent diagnosing the platform reads identical traces everywhere and reasons about them exactly as it reasons about business code that follows one vocabulary. Observability by construction is the legibility principle reaching the operations surface.

---

## The six patterns at system altitude

All six patterns appear at system altitude, and several appear strongly — the fractal property, complete.

**Sequencer** composes subsystems: a platform operation that runs across booking, pricing, and event-management in order is a Sequencer whose steps are whole subsystems. **Fork-Join** runs subsystems or instances in parallel — fan out across venues, join the results. **Condition** routes on system-level facts: which tenant tier, which region's compliance regime, which deployment cohort. **Iteration** is common at this altitude in a way it was not lower down — the platform processes *all* venues' end-of-day data, *all* tenants' billing runs, the same operation applied across the instance dimension. **Aspects** are pervasive: the technical cross-cutting of the previous section is Aspects supplied uniformly by the runtime across the whole platform.

**Leaf** completes the telescope. From the system's vantage, a subsystem is a Leaf — atomic, invoked, returning a typed outcome, its internals not the system's concern. The booking subsystem, which was a composition of workflows at subsystem altitude, is a single unit from system altitude, exactly as a workflow was a unit to its subsystem, a use case a unit to its workflow, and a boundary call a Leaf to its use case. Four altitudes, and at each one the composition below is the atom above. The reader has now seen the same six patterns at every level; the claim that they recur is no longer a claim but a walked demonstration.

The distribution this altitude earned: Iteration and Aspects strongly present (the instance dimension and pervasive technical cross-cutting), Sequencer and Fork-Join composing subsystems, Condition routing on platform facts, Leaf at subsystem granularity. The shift from subsystem altitude is the rise of Iteration (now over instances) and the saturation of Aspects (now the platform's uniform instrumentation).

---

## System-level recovery

Recovery at system altitude is about what happens at the boundaries between subsystems when something fails, and the dominant concern is **failure-mode amplification**: a failure in one subsystem must not cascade into others. The design-out the methodology chose at subsystem altitude is what contains it. Subsystems exchange typed facts and converge rather than sharing transactional writes, so a booking failure cannot corrupt pricing's state — the worst case is a fact that arrives late or a convergence that lags, not a cross-subsystem rollback that fails halfway. The boundary that kept subsystems independent for evolution is the same boundary that contains blast radius at runtime.

The other system-altitude fact about recovery is that **mixed strategies are normal, not exceptional**. Booking uses BER for its money flows, pricing uses design-out via its append-only log, event-management uses a mix. At system altitude these do not have to be reconciled into one recovery class — the system runs a hybrid recovery vector, different subsystems coherently adopting different classes, and that is the expected shape rather than a compromise. A platform that forced one recovery class on every subsystem would be fighting the domains' different shapes; the methodology lets each subsystem recover the way its domain demands and composes the hybrid without friction. The full machinery for reasoning about these vectors (the four selection axes, the cost and risk indicators) is the Architecture Synthesis module's work; at system altitude the point is that the hybrid is normal and the boundaries contain amplification.

---

## Architecture surfaces at system altitude

The architecture decisions that surface here are the ones the whole spiral has been deferring, now all visible at once.

**Deployment topology** is no longer abstract: the subsystems are deployed, and the choice among monolith, services, functions, and unified runtime is live, because at a thousand venues it determines how the platform scales and how blast radius is bounded. **Persistence-layer configuration** is visible across the platform: per-subsystem stores, shared stores with logical separation, distributed stores — the choice now made against real scale and consistency requirements. **Composition substrate** is visible: how subsystems coordinate (synchronous calls, asynchronous events, streaming, mixed) is a platform-wide decision, the "wire" that carries the typed facts subsystems exchange. And the **instance dimension** (how the system runs across tenants and venues) is its own scaling decision layered on top.

These are exactly the Phase-5 axes, and system altitude surfaces all of them together while resolving none in full. That is deliberate: the spiral's job was to show *where* each architecture decision arises and *what* it answers to; the Architecture Synthesis module's job is to provide the framework for *making* the decisions. The deferral has reached its limit — there is nothing left above the system to push the questions up to. They are answered next.

---

## Closing — the spiral is walked; synthesis is next

This pass has shown the system: subsystems composed into one platform, assembly separated from provisioning, technical cross-cutting supplied uniformly by the runtime, recovery as a coherent hybrid across subsystems, and the six patterns completing the fractal at the fourth altitude. A subsystem became a Leaf; the telescope closed.

The spiral is now walked end to end. The methodology has been applied at four altitudes — use case, workflow, subsystem, system — with one running example and one vocabulary. The same six properties described a process at every scale. The same six patterns composed it. The same four shapes carried its values. The same recovery triple handled its failures. The reader who started with a single use case buying a single ticket has climbed to a multi-tenant platform without learning a second vocabulary, because there was never a second vocabulary to learn. That is the telescope, and the reader has now lived it rather than been told it.

At each altitude, architecture decisions surfaced. They were named and deferred: per-use-case SLOs, recovery-class selection, persistence topology, composition substrate, deployment topology, the elicitation that drives all of them. The spiral surfaced them honestly and resolved them partially, because each altitude could only show what its multiplicity made visible. There is no altitude left above the system to defer to. The deferred decisions have accumulated into an inventory, and that inventory is the next module's agenda.

The Architecture Synthesis module is where the methodology stops surfacing decisions and starts making them — the full Phase-4 elicitation, the six-axis Phase-5 vector, the Phase-5/Phase-6 boundary, the recovery-class selection, the continuous-transformation framework. The spiral narrowed to this point on purpose; the synthesis is where it opens back out.

That module is next.

---

*Threads advanced: 6 (knowledge preservation), 7 (less code, more business), 8 (observable by construction), 11 (the interesting work), 14 (telescope).*
