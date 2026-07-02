# Spiral Pass 3 — Subsystem Altitude

*A customer's booking, a price change, and an event opening for sale all have to land in the same audit ledger by the close of business — yet none of the three subsystems that produce them shares code with the others. By the time this pass ends, booking, pricing, and event-management have drawn their own boundaries, and the ledger turns out to belong to the business, not the runtime.*

---

## What this pass does

Pass 2 closed on clustering. The *buy ticket* use case, the cancellation-and-refund workflow, and the temporary-hold workflow change for the same reasons — alter what a reservation means and all three move together. They cluster. The pricing workflows cluster differently, around the event's pricing model. The event-management workflows cluster differently again, around the event's lifecycle. Each cluster is a subsystem.

This pass walks subsystem altitude through the same domain. The use cases multiplied into workflows at Pass 2; the workflows now cluster into subsystems. A subsystem has a trigger surface, typed inputs and outputs at its boundary, typed failures it can surface to other subsystems, steps that are now whole workflows, and dependencies between those workflows.

One element that was present but spare at lower altitudes becomes load-bearing here: **business cross-cutting**. At use-case altitude, cross-cutting was mostly technical and mostly handled by the runtime. At subsystem altitude, there are *business* reasons for things to happen across subsystem boundaries — a financial audit ledger that every money-touching workflow must feed, a regulatory check that gates high-value bookings, a tax calculation that depends on jurisdiction. These are not instrumentation. They are part of what the business requires the system to do, and the methodology has to make an explicit choice about where they live.

By the time the pass closes, the reader has seen subsystem boundaries earned rather than imposed, the business-versus-technical cross-cutting distinction become a design decision with teeth, and per-subsystem type vocabularies with thin, explicitly versioned boundaries between them. The pass closes by naming what subsystem altitude still defers: the full system is more than one venue's subsystems — it is many venues' subsystem sets coordinating, and that multiplicity, with its technical cross-cutting and resource provisioning, earns the final altitude.

---

## Subsystems emerge from clustering

A subsystem is what shows up when workflows cohere. **The criterion is the one from Pass 2, one altitude up: workflows cohere into a subsystem when a single coarser change driver governs them, when one business change would force all of them to change together.** A change to the booking domain (what a reservation means, how holds and confirmations and cancellations relate) rewrites *buy ticket*, the cancellation-and-refund workflow, and the temporary-hold workflow together; a change to the pricing model leaves them untouched. The first set is one subsystem, the second another. The boundary is where workflows stop sharing domain assumptions.

Three subsystems fall out of the running example:

- **Booking** owns the customer-facing transaction lifecycle: holding, confirming, paying, cancelling, refunding, issuing tickets. Its workflows share the reservation domain and the customer-transaction concern.
- **Pricing** owns what a seat costs: tier assignment, demand-based adjustment, promotion and discount rules, the pricing schedule for an event. Its workflows share the pricing model and never touch the customer's payment.
- **Event-management** owns the event lifecycle: opening an event for sale, adjusting capacity, blocking and releasing seats, rescheduling, cancelling an event. Its workflows share the event's operational state.

None of the three is carved out in advance. Each is recognized after the workflows exist, by asking which of them change together. This is the same emergence the methodology has shown at every altitude: structure is recognized, not imposed. A team that draws subsystem boundaries before the workflows exist is guessing; a team that draws them from observed change-driver cohesion is reading what is already there.

The test earns its keep on the cases that feel ambiguous. Where does refund belong — booking or pricing? It moves money, and pricing owns money-shaped concerns, so the instinct is to file it near pricing. The test overrides the instinct: ask what business change forces refund to change. A change to refund policy (eligibility windows, partial-refund rules, what a cancellation entitles a customer to) rewrites refund alongside cancellation and booking and leaves the pricing model untouched. Refund changes with the reservation domain, not the pricing domain; it belongs to booking. The noun it touches (money) pointed one way; the force that changes it pointed the other, and the force wins. That is the discipline of choosing per-process types over shared entities, applied to subsystem boundaries: group by what changes together, not by what is touched. In the two axes, filing refund under pricing would cost pricing its *purity*: a member answering to the reservation driver, dragging cancellation's churn into the pricing model as accidental coupling. Keeping it in booking with cancellation keeps booking *complete*, so a refund-policy change lands in one place rather than scattering. The force-wins rule is the purity check, made at the boundary.

The coarser the change driver, the higher the altitude. A fine driver (reservation rules) groups use cases into a workflow; a coarse driver (the booking domain as a whole) groups workflows into a subsystem; a coarser driver still (the platform's reason for existing) will group subsystems into the system at the next pass. **The telescope is what the change-driver criterion produces when applied at successive granularities.**

---

## The booking subsystem

The booking subsystem owns the customer-facing transaction lifecycle. Its work is what Pass 2 walked: the *buy ticket* use case, the cancellation-and-refund and temporary-hold workflows, and the variants that cluster with them (group-booking, gift-purchase). They cohere because the reservation domain governs them all: change what a reservation is and every one of them changes.

### The subsystem's properties

A subsystem has the same properties as a workflow and a use case, at its own granularity. Its **trigger surface** is the set of ways the outside world and other subsystems engage it — customer-facing requests, events from event-management (an event opened, a seat blocked), scheduled sweeps. Its **inputs and outputs** are what cross its boundary, and they are deliberately small. Its **failures** are the ones it surfaces to callers and to other subsystems, not the internal failures its workflows handle on their own. Its **steps** are whole workflows. Its **dependencies** are between those workflows and across to other subsystems (booking depends on pricing for a quote, on event-management for sale status).

The subsystem is named for its concern, as the workflows were named for their outcomes and the use cases for their operations. "Booking" is the concern; the workflows are how the concern is discharged.

### What the subsystem owns

The composed-not-invented rule holds one altitude up. **A subsystem does not invent a fresh internal vocabulary; it composes its workflows' types internally and owns only its boundary.** Inside booking, the use cases and workflows hand their own types to one another — a `BuyTicket.Response` is what *buy ticket* produces, and the subsystem does not wrap it in a subsystem-specific equivalent. What the subsystem owns is the thin contract at its edge: what another subsystem must send to ask booking for something, what booking sends back, and which failures booking exposes.

That edge is deliberately small, and it is **explicitly versioned**. Subsystems evolve independently — that is the point of the boundary — so what crosses it cannot be an internal type shared by reference. When booking asks pricing for a quote, a small `PriceQuote` crosses, carrying a tier, an amount, and a version stamp; booking never sees pricing's internal pricing-schedule types, and pricing never sees booking's reservation types. **The boundary type is a published contract, versioned so that one subsystem can change its internals without breaking the other, and so that a change to the contract itself is a visible, deliberate event rather than a silent ripple.**

```
PriceQuote:
    seat: SeatId
    amount: Money
    tier: PriceTier
    schemaVersion: ContractVersion
```

(A note on notation, as in the earlier passes: boundary and type shapes appear in pseudo-code for readability; composition snippets use Java to stay faithful to the JBCT idioms they depend on.)

The value-object layer still travels intact, as it has at every altitude: `CustomerId`, `EventId`, `SeatId`, `Money` mean the same thing in booking, pricing, and event-management, so they cross boundaries unversioned. The discipline is the same one the methodology has applied since Pass 1 — share what genuinely means the same thing everywhere, keep everything else local — now applied to the subsystem boundary. What is new is the versioning: at the subsystem boundary, even the small shared contracts are versioned, because the subsystems on either side ship on their own schedules.

### A subsystem operation, composed

Most of booking's work is invoked directly by its own triggers — a customer reaches checkout and *buy ticket* runs. But some booking operations compose several use cases and workflows, and those are where the Sequencer reappears at subsystem granularity. Changing a seat is one. A customer with a confirmed ticket wants a different seat: the subsystem has to acquire the new seat and give up the old one, moving the money by the difference, without ever leaving the customer holding neither.

The operation composes work the subsystem already owns — the purchase that *buy ticket* performs (acquire the replacement, charge the difference) and the cancellation-and-refund workflow (release the original, refund the difference) — in an order the domain dictates:

```java
return ChangeSeat.ValidRequest.validRequest(request)
                              .async()
                              .flatMap(acquireReplacement::apply)
                              .flatMap(releaseOriginal::apply)
                              .map(ChangeSeat.Response::response);
```

`acquireReplacement` runs *buy ticket* for the new seat and produces a `ReplacementHeld` context; `releaseOriginal` runs the cancellation-and-refund workflow for the old seat, threaded the context as growing context. The steps are whole use cases and workflows; the handoffs are between them; the chain short-circuits on the first typed failure: the Sequencer, now composing whole workflows.

The order is a recovery decision the subsystem makes deliberately. Acquire-then-release, not release-then-acquire: the replacement is secured before the original is surrendered, so a failure midway leaves the customer with their original seat rather than none. If acquiring the replacement fails, nothing has changed and the operation returns the failure. If releasing the original fails after the replacement is secured, the customer briefly holds two seats and a reconciliation sweep settles it (the same scheduled-sweep shape that releases expired holds at workflow altitude), a far cheaper residual than a customer with no seat at all. **The subsystem composes workflows the way a workflow composes use cases, and it chooses the order so that the residual which can occur is the one the business can absorb.**

### The boundary with pricing and event-management

Booking depends on the other two subsystems, and the dependencies are typed and thin. Before booking can quote a customer a price, it asks pricing: a `PriceQuote` crosses. Before booking can confirm a reservation, it checks event-management: is the event still selling, is the seat still available for sale? A small status crosses. Booking does not reach into pricing's logic or event-management's state; it asks, through the published contract, and receives a typed answer.

This is the quarantine principle the methodology has carried since Pass 1, now at subsystem scale. A use case body is quarantined from technical concerns behind domain-named Leaves; a subsystem is quarantined from other subsystems' internals behind versioned boundary contracts. The reader inspecting the booking subsystem sees its own workflows and a small set of typed dependencies on named contracts, not the internals of pricing or event-management.

---

## Pricing and event-management: two more boundaries

The booking subsystem is the anchor; the other two show the same recognition test drawing different boundaries with different shapes.

### Pricing

The pricing subsystem owns what a seat costs. Its workflows assign tiers, adjust prices to demand, apply promotions and discounts, and publish the schedule an event sells against. They cohere because the pricing model governs them: change how demand maps to price, or how tiers are defined, and every pricing workflow changes — while booking and event-management stay untouched. That is the boundary.

Pricing's characteristic shape is its recovery class. Where booking reaches for BER (reservations and money have clean inverses), pricing reaches for design-out. A price is not mutated in place; the subsystem keeps an append-only log of pricing decisions, and a correction is a new entry rather than a reversal. There is nothing to compensate because there is no prior value to roll back to — the current price is a fold over the log (the decisions replayed in order, the latest applicable one winning), and a mistake is fixed by appending the right decision after the wrong one. **This is the design-out move booking made for seat reservation (choose a model where the conflict cannot arise), applied to a different domain: pricing removes the need for compensation by never overwriting.**

What crosses pricing's boundary is small: the `PriceQuote` booking asked for, versioned, and the schedule event-management reads when it opens an event. Pricing's internal log, its demand model, its tier definitions — none of it crosses. A reader inspecting pricing sees its workflows folding a decision log into current prices; a reader inspecting booking sees a `PriceQuote` arriving through a versioned contract. Neither sees the other's domain.

### Event-management

The event-management subsystem owns the event lifecycle: opening an event for sale, adjusting capacity, blocking and releasing seats, rescheduling, cancelling. Its workflows cohere around the event's operational state — change what it means for an event to be on sale, or how capacity is managed, and they move together, while booking and pricing do not.

Event-management's recovery is mixed in its own way: BER for operational changes that have clean inverses (a capacity increase can be decreased, a block can be released) and FER for the analytics its changes feed (a dashboard showing approximate remaining capacity tolerates lag). Its relationship to booking is the design-out exchange the recovery section develops below: booking does not write event-management's capacity; the two exchange typed facts (`SeatSold`, `SeatReleased`, `EventOpened`) and converge.

**Three subsystems, three boundary shapes, one recognition test.** Booking is the transaction concern with BER at its core; pricing is the cost concern with design-out at its core; event-management is the lifecycle concern with a mix. The test that separated them — what business change forces these workflows to change together — is the test that separated use cases into workflows.

Three subsystems, and the little that crosses between them:

```
   +-------------------+   PriceQuote (versioned)   +-------------------+
   |     Booking       | ------------------------>  |     Pricing       |
   |  reservations     |      (booking reads)       |  cost model       |
   |  BER              |                            |  design-out       |
   +---------+---------+                            +-------------------+
             |   ^
   SeatSold, |   |  EventOpened,
   Released  v   |  sale status
   +-------------+--------------+
   |   Event-management         |
   |   event lifecycle          |
   |   BER + FER                |
   +----------------------------+
```

Each subsystem owns its internal types; only the small versioned facts cross — a quote, a sale status, a pair of seat facts. The lines between the boxes are the published contracts, and they are the only coupling the subsystems carry.

## Business cross-cutting becomes load-bearing

At use-case altitude, Aspects were mostly technical and mostly supplied by the runtime: logging, tracing, retries. **At subsystem altitude, a different kind of cross-cutting becomes load-bearing — concerns that span subsystems because the *business* requires it, not because the platform instruments it.**

### The distinction

The methodology draws a binary at design altitude. **Technical cross-cutting** is implementation and instrumentation: observability, retries, correlation identifiers, circuit-breaking. The runtime or platform supplies it uniformly, and business code never names it. **Business cross-cutting** is a business requirement — regulatory, contractual, compliance — that the system implements as part of its business behavior. The system must do it because the business says so, and it is therefore part of the design, not the substrate.

The audit ledger is the clean example. Every money-touching workflow — a completed booking, a refund, a price change, a capacity adjustment that affects revenue — must produce an immutable record for financial reconciliation, tax reporting, and regulatory audit. This is not instrumentation. The records have domain meaning; their content is specified by accounting and regulatory requirements; their absence is a compliance failure, not a missing log line. It spans booking, pricing, and event-management because money moves through all three. It is business cross-cutting, and the methodology has to decide where it lives.

### Audit-as-data versus audit-as-Aspect

The methodology recognizes two encodings, and names them as a pair rather than ranking them.

**Audit-as-data** makes the audit record a first-class output of the use case or workflow that produces it. *Buy ticket* does not have audit bolted onto it; producing the booking-completed fact, with the financial detail the ledger requires, is part of what it *does*. The audit record is domain data it returns, and the ledger is assembled from the facts the work already produces. This fits when the audit content is domain-meaningful and varies by what happened — when the record is a business fact, not a uniform trace.

**Audit-as-Aspect** makes the audit emission a cross-cutting wrapper that intercepts workflows uniformly and emits records on their completion. The workflow is unaware; the Aspect observes and records. This fits when the audit content is uniform across many operations — when every workflow's record has the same shape and the same trigger, and the audit concern is genuinely orthogonal to what each workflow means.

The choice is a real design decision with consequences. Audit-as-data keeps the record close to the business meaning and makes the workflow's contribution to the ledger explicit and legible, at the cost of each workflow carrying the audit concern in its output type. Audit-as-Aspect keeps workflows clean of the audit concern, at the cost of the audit content being assembled outside the workflow, one step removed from the business meaning. For the financial ledger, where each record's content is a specific business fact (this booking, this amount, this tax treatment), audit-as-data is the better fit; for a uniform access-audit (who invoked what, when), audit-as-Aspect is. **A subsystem will usually use both, for different concerns, and the methodology's discipline is to make the choice deliberately per concern rather than defaulting to one.**

In code, the difference is where the record lives. Audit-as-data adds it to the workflow's output type:

```
BuyTicket.Response:
    ticket: TicketId
    receipt: ReceiptId
    ledgerEntry: BookingLedgerEntry
```

The ledger is assembled from entries the workflows already return. Returning the entry is not the same as writing it: the append to the ledger is a step inside *buy ticket*, performed by the use case as it completes the booking, not after the fact, and the `ledgerEntry` in the response is that already-written record handed back as data, not a write deferred to the caller. Nothing intercepts the call: a controller that invokes *buy ticket* directly receives a response whose entry is already persisted. *Assembled* means the ledger accumulates what each use case appends, not that a downstream collector gathers return values. Audit-as-Aspect, by contrast, leaves the output untouched and wraps the workflow instead:

```java
auditLedger.wrap(buyTicket)
```

A uniform record is emitted on completion, the workflow unaware. The first form's cost is the audit concern in the output type; it buys explicitness — the workflow's contribution to the ledger is visible in its signature. The second form's cost is a step's distance from the business fact; it buys clean workflow types. Neither is the default; the concern's shape decides.

### Subsystem-level Condition

Business cross-cutting also surfaces as Condition at subsystem altitude — branches on business facts that route across subsystem concerns. A high-value booking routes through a compliance check (does this booking require identity verification?) before booking will complete it; the branch is a typed business decision, and the compliance concern is itself a business-cross-cutting requirement. An event routes through a premium-pricing qualification (does this event qualify for premium tiers?) that draws on both pricing and event-management. Each is a Condition on a domain fact, dispatched on a typed variant, exactly as at lower altitudes — the difference is that the fact being branched on is a subsystem-level business concern, and the branch may route work into a different subsystem.

---

## The patterns at subsystem altitude

Five of the patterns are the lower-altitude primitives one granularity up; the table is the whole of it:

| Pattern | At subsystem altitude |
|---|---|
| **Sequencer** | Composes whole workflows in order (qualify event → set pricing → open for sale), the same `flatMap` chain short-circuiting on the first typed failure; past four or five, the subsystem extracts named sub-sequences. |
| **Fork-Join** | Independent workflows that converge — on a completed purchase, the ledger-feeding and customer-notification workflows run concurrently and join. More frequent here, because subsystems have more genuinely independent work. |
| **Condition** | Routes on subsystem-level business facts (KYC-required bookings, premium-qualifying events, jurisdiction-dependent tax), dispatching on a typed variant into whole downstream workflows. |
| **Iteration** | Applies a workflow across a collection (`Promise.allOf`): the end-of-day pass over every open event, the demand-adjustment pass over every seat block. |
| **Leaf** | A whole workflow is atomic from the subsystem's vantage — invoked, returning a typed outcome, its internals out of view. At the next altitude the subsystem itself becomes a Leaf. |

The sixth changes character. **Aspects become first-class**: the business cross-cutting of the previous section — the audit ledger, the compliance checks, the regulatory hooks — is declared and placed by the subsystem's design, not supplied invisibly by the runtime the way technical Aspects (tracing, retries) still are. **That rise of *business* Aspects from spare to load-bearing is the signature of what subsystem altitude is for: coordinating cohesive workflows under business-level concerns that span them.**

---

## Recovery-class selection at subsystem altitude

**The recovery-class triple applies again, and at this altitude coordination cost dominates the selection.** Compensating across subsystems is expensive — an inverse that has to reach into another subsystem's domain crosses a versioned boundary, coordinates with another team's release schedule, and risks its own failures. The methodology's response is to prefer recovery strategies that keep compensation inside a subsystem and to design cross-subsystem interactions so that expensive compensation is rarely needed.

Mixed strategies are the norm, and each subsystem chooses by its own domain shape:

- **Booking** uses BER for its in-domain money and reservation flows (the compensation chains Pass 2 developed) and FER for telemetry and analytics that tolerate degraded state. Its cross-subsystem dependencies are reads (a quote, a sale status), which need no compensation because they commit nothing.
- **Pricing** leans on design-out: an event-sourced pricing log, immutable and append-only, where a correction is a new entry rather than a reversal. There is no compensation to coordinate because there is no mutable state to roll back — the design removes the need.
- **Event-management** uses BER for operational changes (a capacity adjustment can be reversed) and FER for the analytics its changes feed.

**The cross-subsystem rule that falls out: prefer reads over writes across boundaries, and where a cross-subsystem write is unavoidable, prefer design-out (idempotent operations, event logs) over BER, because cross-subsystem BER pays the full coordination cost.**

A concrete shape of that cost: suppose booking, on a confirmed sale, had to decrement event-management's capacity by writing into it directly. If the booking later compensates (a downstream failure rolls it back), the inverse has to reach across the versioned boundary into event-management's domain, increment the capacity back, coordinate with event-management's own release schedule, and survive its own possible failure. That is cross-subsystem BER, the expensive case. Design-out removes it: booking does not write event-management's capacity at all. It emits a typed `SeatSold` fact; event-management consumes it idempotently and adjusts capacity in its own domain. If booking compensates, it emits `SeatReleased`, and event-management converges — no inverse reaches across the boundary, because booking never wrote across it. The boundary that keeps subsystems independent is the same boundary that makes design-out the natural cross-subsystem recovery.

The full selection mechanism — all four axes weighed, mixed strategies declared per subsystem and per boundary — lives in the Architecture Synthesis module after the spiral. At subsystem altitude the discipline is to walk the three classes for each subsystem and each boundary, and to treat coordination cost as the axis that bites hardest.

---

## Architecture surfaces at subsystem altitude

The architecture decisions that surface here are about boundaries, the stores behind them, and each subsystem's operational envelope.

**Subsystem-level SLOs.** **A subsystem has an SLO envelope, but it is derived, not declared anew — it is the composition of its workflows' SLOs.** The booking subsystem's availability is bounded by the least-available workflow on a caller's critical path; its latency budget is the envelope of the workflow budgets that path traverses. The methodology does not ask a subsystem to invent fresh numbers; it asks which workflow SLOs compose into the subsystem's commitment. Composed-not-invented, applied to operational targets: the subsystem owns the envelope, the workflows own the figures.

**Subsystem boundary decisions.** Where exactly does booking end and pricing begin? The change-driver test draws the line — workflows that change together stay together — but the line has architectural consequences: it determines what must be versioned, what crosses as a contract, and what each subsystem can change without coordinating. **The boundary is the unit of independent evolution.**

**Per-subsystem persistence.** Does each subsystem own its store, or do they share one store with logical separation? At subsystem altitude the question gains force it did not have at workflow altitude. Separate stores buy independent evolution and clean failure isolation at the cost of cross-subsystem consistency becoming an explicit, eventual concern. A shared store with logical separation keeps consistency simple at the cost of coupling the subsystems' schemas. The methodology surfaces the question here; the full treatment of the persistence-layer axis belongs to Architecture Synthesis.

**Cross-subsystem consistency.** Once booking and event-management own separate stores, the seat booking sold and the capacity event-management tracks are two records in two places, consistent only eventually. The methodology's answer is the design-out already chosen for recovery: the subsystems exchange typed facts and converge, rather than sharing a transactional write. Consistency becomes a property of the fact exchange — its ordering, its idempotency, its lag bound — not of a shared transaction. Naming what each data class requires (strong within a subsystem, eventual across) is a subsystem-altitude decision; the substrate that delivers it is deferred.

**Cross-subsystem coordination mechanism.** When booking needs a quote from pricing, is that a direct call, an event-based exchange, a cached read? Each subsystem declares its inbound and outbound contracts as typed, versioned shapes; the substrate that carries them between subsystems is a Phase-5 decision deferred to Architecture Synthesis. At subsystem altitude the contracts are named; the wire is not yet chosen.

What this altitude still defers: system-level resource provisioning (what the deployed system needs from its environment), technical cross-cutting at the platform level (observability, tracing, idempotency supplied uniformly), and the composition substrate between subsystems. These are the questions the system altitude raises and the Architecture Synthesis module answers.

---

## Closing — the system is next

This pass has shown subsystems. **Subsystems cluster cohesive workflows, draw boundaries where workflows stop sharing domain assumptions, own thin versioned contracts at their edges, and carry business cross-cutting as a first-class design concern rather than a runtime afterthought.**

The three subsystems in this pass — booking, pricing, event-management — are one venue's worth of the domain. The full system is not that. A real ticketing platform runs many venues, many events, many tenants, and the subsystems multiply and coordinate across all of them. The booking subsystem is not one thing; it is the booking concern instantiated across every venue, coordinating with a pricing concern and an event-management concern that are themselves instantiated at the same scale. **The platform is many subsystem sets coordinating.**

That multiplicity earns the final altitude. At system altitude the subsystems are deployed, and deployment is where the methodology meets infrastructure. Technical cross-cutting becomes load-bearing — observability, tracing, idempotency, retries, supplied uniformly by the runtime across every subsystem rather than coded into any of them. Resource provisioning surfaces as an architectural concern: what the system needs from its environment, each resource a typed dependency invoked through a Leaf. And the distinction the methodology has been carrying quietly since Pass 1, between assembling a system's internal composition and provisioning the external resources it runs on, finally has to be made explicit.

The next pass walks system altitude.
