---
title: "How Architecture Emerges"
description: "Never debate architecture again: eleven questions, six axes, one worked derivation"
tags: [architecture, backend, softwaredesign, programming]
published: true
---

# How Architecture Emerges

*Never debate architecture again*

Two teams build the same product: software that sells a ticket to a seat at an event. One team ships a single program talking to one database. The other ships a multi-region platform of subsystems trading events across a bus. They share almost nothing.

Neither team made a mistake.

If two architectures that share nothing can both be correct for the same domain, then the domain never determined the architecture. Something else did. In most teams, that something else is taste: the last conference talk, the article about how a big platform does it, the loudest voice in the review. Architecture selection is the least standardized decision in backend engineering, and we've normalized that by calling it "trade-off analysis."

There's a better answer: the two teams had different **answers to the same questions**, and the architectures follow from the answers. Mechanically. Both teams ran the same derivation; the inputs differed, so the outputs did. Architecture is not a choice you defend. It's an output you compute, and recompute when the inputs change.

This article runs that derivation, end to end, on the smaller of the two teams. It fits in a few hundred words, and every step cites the input that forced it.

## Catalogs, physics, and the missing procedure

Almost everything written about software architecture is either a **catalog** (styles, patterns, trade-off matrices: pick one, defend your pick) or **physics** (how replication, queues, and consensus actually behave). Both are useful. Neither tells you what to *do* on Monday: catalogs give you options without a selection procedure, physics gives you mechanisms without a decision path.

What's missing is a **procedure**: elicit these inputs, run this derivation, get an architecture out, re-derive when the inputs move. Hardware engineering has worked this way for decades; behavioral spec plus constraints in, circuit out. Software still picks styles from articles.

## The inputs: eleven questions

Before any architecture is on the table, ask what the system must satisfy. Eleven questions cover enterprise backend work. The answers vary wildly between a single venue and a global platform; the questions do not.

**Service-level objectives** (per use case or data class):
1. Latency, per use case — usually P95/P99
2. Throughput — steady-state and peak
3. Availability, per use-case criticality
4. Consistency contract, per data class — strict / read-your-writes / bounded-staleness / eventual
5. Durability — the recovery-point objective

**Constraints:**
6. Compliance — regulatory and contractual regimes
7. Technology and platform mandates

**Operational targets:**
8. Deploy frequency and safety
9. Cost shape — a ceiling or a per-operation budget

**Substrate-shaping forces:**
10. Multi-X — multi-country, -currency, -tenant, -region
11. Scale shape — read-heavy, write-heavy, event-heavy, mixed

One discipline before you answer: **an answer only counts once its cost is acknowledged.** "We need 99.99%" is not an answer until someone has seen what a fourth nine costs and still wants it. An SLO you haven't priced is a wish.

## The output: six axes

An architecture is not a named style. It's a position on six independent axes:

| Axis | Values |
|---|---|
| Deployment topology | single deployable / multiple / unified runtime / serverless |
| Composition substrate | direct calls / event-based / streaming |
| Read/write model | unified / separated |
| State storage | current-state / event-sourced |
| Persistence | single shared / distributed / sharded / per-component / polyglot |
| Recovery | compensate-by-inverse / degrade-and-continue / design-the-failure-out |

"Microservices vs monolith" is one value on one axis. The other five axes exist whether or not you name them. Most preference wars are two people arguing about different axes without noticing.

## The derivation: three rules

1. **Start at the cheapest position on every axis** — single deployable, direct calls, unified reads, current-state, one shared store.
2. **Move an axis only when an answer is not contained by the current position.** An answer the cheap position already satisfies presses on nothing; it's inert.
3. **When you must move, take the cheapest value that contains the demand, at the narrowest scope that contains it.** Event-source one data class, not the system. Split one read path, not the world.

(There's a fourth rule for when two answers press one axis in opposite directions: the system splits at the boundary between them. The small team below never needs it. That's the point.)

## Running it: the independent venue

One venue runs its own box office. One team, one region. The answer sheet:

- Buying a ticket: ~2s at P95. Availability check: under 1s.
- Bookings: tens per second on a busy night. Checks: a bit higher.
- Service availability: 99.5% — hours of downtime a year is survivable for one venue.
- Booking data: strictly consistent, zero data loss on confirmed sales. Availability and price reads: eventual is fine.
- One country, one currency. Daily deploys. Tight cost ceiling. Read-moderate load.

Now walk the axes and watch what presses.

**Deployment.** One team, bounded ops budget, one region. Nothing demands independent releases, independent scaling, or isolated failure domains. Nothing presses. **Single deployable.**

**Substrate.** Event-based composition earns its cost across deployment boundaries, and there are none to cross. A queue would add propagation lag and delivery semantics to paths that a function call serves. Nothing presses. **Direct calls.**

**Read/write model.** Reads and writes have the same shape and no separate read SLO exists. A projection would be machinery against a problem nobody stated. **Unified.**

**Storage.** No answer demands replay or historical reconstruction. **Current-state.**

**Persistence.** 2 seconds at P95, tens per second, strict booking consistency: a single store contains all of it, and gives strict consistency away for free via ordinary transactions. **Single shared store.**

**Recovery.** The only axis the domain forces. Booking moves money through sequenced steps: reserve the seat, authorize payment, confirm. Every step has a defined inverse: release, void. **Compensate by inverse.**

The vector: *single deployable / direct / unified / current-state / single shared store / compensation.* A boring program and one database.

**The team didn't choose simplicity. The derivation found zero uncontained demands.** Every answer sat comfortably inside the cheapest position, so every axis stayed put. That's not minimalism as virtue. It's arithmetic. The same arithmetic cuts the other way: copying a big platform's architecture into this answer sheet means paying, forever, for capabilities no answer demands. That's how small platforms drown.

If you want to see the same derivation produce the multi-region event platform, change the answers: a contractual 200ms P99 on the quote path, on-sale bursts in the hundreds of thousands per minute, regulators demanding replayable price history, data-sovereignty rules. Different inputs, same procedure: each new demand breaks containment somewhere specific, and only that axis moves, at only that scope.

## When the answers change

The venue grows. It joins a regional network; a contract now specifies sub-500ms availability checks; reads go heavy. What happens to the architecture?

One thing: the read path, and only the read path, has an answer the current position no longer contains. The derivation moves one axis at one scope: read replicas behind the same unified model (cheaper than projections, and the staleness budget allows it). Everything else stays. No migration program, no target state, no two-year roadmap. **The next correct step, computed from the new answers.**

That's the reframe: an architecture is not a state your system is in. It's a **derivative** — the next correct step from where the system stands, given the forces on it now. Greenfield is just the derivative taken from a blank page. The system you inherited, carrying decisions nobody alive remembers making, is the same computation from a harder starting point.

The reframe also works backward, as an audit. For every axis position your current system holds, name the answer that forces it. Any position no answer forces is technical debt: not by opinion, by construction. You're paying for a capability nobody asked for. Run it on three microservices that share a database and deploy in lockstep, and the test flags the deployment split in about thirty seconds: no live answer demands it, and the fix is a merge, not another split.

## Where this comes from

The derivation above is the Architecture Synthesis method from [Process-First Design](https://leanpub.com/process-first-design), a methodology for deriving backend systems from business processes, of which architecture is the last derivation step. The condensed edition is free and reads in about thirty minutes. The procedure has been validated by re-deriving every published worked example (three ticketing profiles at three scales, plus a payroll platform someone else built) from their answer sheets alone. The derivations where the answers turn hostile and hybrids start appearing on purpose (a regional platform, then a multi-tenant enterprise) are worked end to end in Process-First Design, along with the brownfield case: the same procedure run on a system somebody else built.

---

*Also in this family: [Java Backend Design Technology](https://pragmatica.dev/) derives code structure from eight questions the same way this derives architecture from eleven. Same bet throughout: the decisions that never deserved judgment should be mechanical, so your judgment is spent where it's genuinely owed.*
