# Three Profiles, One Domain

Part I ended with a promise of proof, and proof starts on home ground: one domain, event ticketing, at three scales — an independent venue, a regional platform, an enterprise multi-tenant platform. Readers of *Process-First Design* have met these three profiles in the Architecture Synthesis module, where their derivations were narrated; this chapter supersedes that walkthrough by re-running it with the mechanics visible — every step names the answer it consumes and the rule it applies. Same systems, same outcomes, and the judgment that the narration quietly exercised now sits in tables anyone can check.

The domain earns its place by spanning the extremes with one product idea. Selling a seat is selling a seat at every scale; what changes between the profiles is only the answer sheet — which is precisely the experimental condition Chapter 1's claim requires. If the architecture follows from the answers, three answer sheets over one domain must produce three different vectors, each forced, with no step appealing to taste. One honesty belongs at the door rather than the exit: these are the book's own systems, graded by their author — home ground proves the mechanics legible, not the method right, and the stricter test follows in the next chapter.

## Profile one, promoted to notation

Chapter 1 already walked the venue in prose; its home telling stands, and here it is promoted into the derivation's working form — the pressure matrix rows the prose was narrating:

| Demand (scoped) | Mode | Against the null vector | Outcome |
|---|---|---|---|
| buy ≈2s P95 (operation) | select | contained: direct calls + single store at tens/sec | inert |
| check <1s (operation) | select | contained | inert |
| 99.5% (domain) | isolate | contained: single node + restart budget (44 h/yr) | inert |
| booking strict, zero loss (data class) | prune | single shared store provides transactions + durable commit | strikes nothing |
| reads eventual (data class) | — | weaker than what the vector already provides | inert |
| cost ceiling, one team (domain) | bound | reinforces the null position | inert |
| read-moderate (domain) | split | no divergence between paths | inert |

Zero pressures; the null vector survives; recovery resolves from domain shape (defined inverses on the money path → compensate). One derivation artifact deserves attention beyond the outcome: the *inert* column is doing the work. Every row that presses nothing is a documented refusal — the reason this system carries no queue, no replicas, no projections, written down where the next architect can find it. Chapter 9 turns exactly this property into an audit.

## Profile two: the regional platform

The venue joined a network — Chapter 1 previewed the first consequence — and the full sheet at regional scale reads: several teams and venues, one region, multiple currencies and countries; availability checks at 500 ms P95 on a read-heavy path; purchases still ≈2 s; a sales feed consumed asynchronously by venues; bookings strict with zero loss; quotes tolerate bounded staleness, but a venue must see *its own* availability updates immediately; 99.9% service target; weekly blue-green deploys; payment-card compliance; event-heavy integration traffic.

The walk, each step citing answer and rule:

**Deployment — the decomposition case.** "Several teams need independence" presses toward multiple deployables; the operations budget presses against; both attach to the whole system: same scope, so the conflict rule sends the bundle back through decomposition rather than splitting anything. Decomposed: ownership boundaries are demanded — and module boundaries contain them at zero deployment cost; release-cadence independence is *not* demanded — one weekly blue-green train is the stated cadence for everyone. The conflict evaporates. **Modular monolith**, and the month of meetings this resolution replaces is the one Chapter 4 opened with.

**Read serving — the rung case.** 500 ms at P95 on a read-heavy path escapes what primary-only serving contains: pressure on read serving. The chain from Chapter 3 climbs rung by rung: caching helps but the reads are per-venue and varied; the next rung, **read replicas**, contains the volume, and the staleness the quotes tolerate is exactly what replicas cost. The top rung stays unclimbed: a separated read model would add projection machinery and buy nothing these answers demand, because the read *shape* has not diverged — this is volume, and the second-copy diagnostic says yes. The read/write model stays **unified**.

**Read-your-writes — the mechanism case.** The venue-sees-own-updates answer is a prune-mode fact replicas alone violate. The lens forces a mechanism: session-pinned reads to the primary for a venue's own recent writes. Contained without an axis move — a mechanism note, not a value change, and the difference is the vector staying honest about what it is.

**Substrate — mixed by scope.** The sales feed and cross-module facts tolerate lag and want fan-out: the ledger's event-based entry, across module boundaries. The booking sequence wants strict immediacy within its module: direct. **Event-based across, direct within** — a composition, not a compromise, and each scope is uniform.

**Storage — the trap, disarmed by comparison.** Payment-card compliance plus dispute pressure sounds like "we need full history," and this is the audit-versus-replay decomposition's home game. Decomposed: auditability is demanded; replay is not — no answer on this sheet needs past states under past rules. Cheapest value containing audit alone: **current-state plus an audit log written in the same transaction**. Event sourcing would contain the demand too — at the price of projections on every read, forever, for a capability no row of this sheet cites. The narrated version of this walkthrough called this a trap; the mechanical version shows there was never a trap, only an under-decomposed answer meeting a ledger comparison.

**Recovery.** Money keeps its inverses (compensate); reservations and counters reshape — idempotent holds, converging counters — so their conflicts stop existing (**design-out** at that scope).

**Derived vector:** *modular monolith / event-based across + direct within / unified + replicas / current-state + audit log / single shared store + replicas / compensate + design-out.* Every position cites rows; the two "traps" of the narrated version fall out of ledger comparisons with no judgment anywhere.

## Profile three: the enterprise platform

The sheet turns hostile: quotes at 200 ms P99, *contractual*, multi-region; on-sale bursts of 10⁵+ attempts per minute against a handful of seats; price history auditable **and replayable** — a regulator reconstructs quotes under past rule versions; bookings strict, zero loss, across regions; availability reads with a named staleness bound; 99.99% on the customer-facing read path; data sovereignty by country; card compliance; weekly canary releases; cost under real scrutiny.

**The split — the scope test's home game.** The read path carries 200 ms P99 + 99.99% + storm-scale reads; the transactional cores carry saga consistency at moderate scale. Opposing pressures — and this time at *different* scopes: path versus subsystems. The scope test splits at the boundary: **the read path becomes its own component** with its own scaling and cadence, and blast-radius isolation falls out of the same split, which is what Chapter 5's rule 4 said honest 99.99% would require. The boundary cost is paid knowingly: a contract between quote-serving and the cores, a staleness bound already priced by the answers.

**Pricing — the axis that finally moves.** Replay *is* demanded, for one data class. **Event-sourced pricing**, with the quote storm served from **projections** — the read model separates *here*, where shape and volume and contract converge on one path, and nowhere else. Booking, by the same comparison as profile two, stays current-state with its audit log: two data classes, two storage answers, one system.

**Booking across regions — the unique container.** Strict + zero loss + multi-region is the demand set with exactly one containing value in the whole ledger: the **distributed shared store**, quorum commit, write floor paid where physics charges it. Every other persistence value is struck in the prune round — the derivation's only forced buy at the top of the market, and the sheet shows precisely which three answers forced it.

**The cores — packaging held open.** Strongly coupled subsystems, scale and deploy as units, ops cost bounded: the ledger's **unified runtime** entry, one-or-many packaging decided at deploy time, contains the bundle most cheaply (the runtime class Chapter 3 disclosed; the derivation needs the *value*, and any instance of it serves — the one selection of that value in this book, in a system its author controls; Chapter 7's four blind runs never demand it). Event management's document-shaped and relational-shaped data lands **polyglot**. Sovereignty pins data regionally *within* the distributed store — a constraint on placement, no further axis move.

**The burst — contention, refused correctly.** 10⁵ attempts per minute against a handful of seats: the second-copy diagnostic says no copy helps — one seat, one winner. **Admission control at the edge, fast-fail, holds that decay** — the entire "storm" is contained with zero axis movement, by the envelope arithmetic Chapter 5 ran: a large cheap edge, a tiny core sized to seat throughput. The most dramatic number on the sheet moves nothing, and that is the discipline holding under maximum provocation.

**Derived vector (per scope):** *read path as services + cores on a unified runtime / event-based across, direct within / separated (pricing) + unified (booking) / event-sourced (pricing) + current-state (booking) / distributed shared (booking) + per-component + polyglot / compensate (money) + design-out (holds, pricing appends) + degrade-and-continue (availability views).* Vectors per subsystem — the composition Chapter 3 priced, arrived at by recursion rather than by decree.

## What three sheets prove

One domain, three sheets, three vectors — none chosen. The venue proves the null vector is reachable in practice, and that restraint is an output. The regional platform proves conflicts decompose and rungs beat reflexes. The enterprise platform proves the expensive values are purchasable *when rows force them* (event sourcing at one data class, a distributed store for one data class, a split at one boundary) and that even a hundred-thousand-a-minute headline cannot move an axis without the right shape.

The objection stated at the door still stands at the exit: home ground, author-graded. Chapter 8 will show the method failing honestly, but before that, the stricter test — four systems this book had no hand in, derived from their operators' published commitments, with predictions registered before checking outcomes. Home ground is done.

*Rules exercised: the null vector's survival · decomposition at the entry gate · the scope test (same-scope and different-scope branches) · the containment chain (replica rung, projection rung) · audit-vs-replay · the unique-container prune · contention refusal · per-scope recursion.*
