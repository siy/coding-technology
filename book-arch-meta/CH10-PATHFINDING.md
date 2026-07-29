# Ch. 10 material — Migration as pathfinding

*Assembled 2026-07-11 (decision-free half; the Metapatterns edge list is gated on the Poltorak approach, decision F). Sources: module §Architecture as a derivative (the six indicators, verbatim), `DRY-RUN-PAYROLL.md` (F8, merge-back), blind derivations (F16), PROCESS-DESIGN candidate 7, LEDGER v0.2 (boundary cost).*

## The model

The derivation picks the **target**: `next_step(V₀, answers) → V₁`. Pathfinding picks the **route**: a sequence of deltas from V₀ to V₁ where every intermediate vector is a system you actually run. Migration is not a diff to apply; it is a path through vector space under feasibility constraints.

- **Nodes** — operable vectors (positions per axis × scope structure).
- **Edges (deltas)** — one coherent transformation: an axis move at a scope, a scope split/merge, or a scaffolding step (see below).
- **Edge weights** — the six cost-and-risk indicators, *qualitative, never scored into a false number* (module, verbatim): reversibility of the step; feasibility of the intermediate state while the system runs through the change; coupling cost of coordinated changes elsewhere; duration in dual state; dependency on prior transformations; failure-mode amplification (which is what earns a step its mitigation plan).
- **Path constraints** — every intermediate must be **operable** (staffed, debuggable, on-call-able: the intermediate IS production), **affordable** (dual-running pays the boundary cost temporarily but genuinely), and **calendar-feasible** (F8).

Qualitative weights mean path comparison is argumentative, not arithmetic: a path is rejected by *naming the indicator that kills it* — prune-mode reasoning applied to routes. No weighted sums.

## Deltas don't commute — the worked examples

**1. Extract-then-separate vs separate-then-extract** (topology × persistence, same endpoints).
Extract a component from the monolith *before* separating its data → the intermediate is a shared database astride a network boundary: cross-component writes just decayed from transaction to protocol (#4) while the schema stays coupled — the distributed monolith, both values' costs, neither's provides. Reverse order — separate persistence *inside* the monolith first (per-component ownership of tables, still one deployable), then extract along the now-clean seam → every intermediate operable. Same endpoints, one order transits a state the feasibility constraint rejects. **Order is not a preference; it is derived from the intermediate states.**

**2. Substrate-before-projections vs projections-first** (the priced-scaffolding case).
A separated read model needs a change feed. If the substrate move (event-based) is on the path anyway, projections ride the published facts — sequence the substrate first and the second delta is small. Projections first → they need CDC scaffolding the later substrate move obsoletes. That order is not forbidden — it is **priced**: a scaffolding step is a legitimate edge whose cost includes its own demolition (ch. 8's infeasibility→scaffolding move reappearing as a path element). Pathfinding makes the throwaway explicit instead of discovering it in retrospect.

**3. The calendar wall (F8, payroll).**
The merge-back delta is one axis and small — and cannot transit during filing season. Freeze windows are immovable walls: a delta whose **dual-state duration would span a freeze window** is infeasible even when the delta itself is trivial, because the frozen period must not contain a half-migrated system. Deltas fit *between* walls; the calendar constrains placement, not just duration. "When" is a path property, not an operational nicety.

## Severity by the vector lens (F16)

Before pathfinding, classify what the "migration" even is:

- **Phase-6 swap** — same axis value, different product (Cassandra→ScyllaDB in the Discord record). No delta in vector space; below-the-vector operation. Many "migrations" are Phase-6 swaps wearing migration budgets.
- **Single-axis delta** — one position moves at one scope (payroll's merge-back; Mongo→Cassandra as a storage-model move). The cheap kind; the indicators price it directly.
- **Compound delta** — multiple axes move. Decompose into sequenced single-axis deltas whenever a feasible order exists (example 1 is the demonstration); where *no* order has feasible intermediates, that is a finding — the path needs a scaffolding node, or the target needs renegotiation (ch. 8's menu, reappearing for routes).

Severity = axes moved × scope width × the indicators on each edge — a classification, not a score.

## Ordering principles on a path

- **Dependencies partially order deltas** (prerequisite edges — where the transitions catalog plugs in).
- **Irreversibility orders commitment** (F6 fires here, not in greenfield): keep options open — schedule reversible deltas early, an early irreversible step gates every alternative after it; the irreversible step carries the mitigation plan (failure-mode amplification, module verbatim).
- **The calendar places deltas; dominance picks among admissible orders**: prefer the order whose *worst intermediate* is least bad — argued by indicator, not computed.

## The trail and the loop

Each executed delta leaves its ADR (position, forced-by, costs accepted, revisit-when) — the derivation self-medicates across time (candidate 8): the next inheritor gets the path, not just the endpoint. And the loop closes upstream: the audit (ch. 9) detects *that* a step is due; pathfinding decides *how to walk it*; answers changing mid-path re-run the derivation — a path is as recomputable as the target it aims at.

## The edge list (extracted 2026-07-11 — `CH10-EDGE-LIST.md`)

Metapatterns' transitions catalog extracted and revoiced: **17 edges** from the "Evolutions of Architectures" appendix (metapatterns.io, v1.2 05-2026, CC BY 4.0 — the same canonical source the PFD module already cites), each tagged with source section, feasibility, costs, reversibility, decomposability. Poltorak conversation remains open as courtesy + review invitation (message drafted; not a gate).

**What the extraction taught (chapter-shaping findings):**

- **The catalogs price destinations; this chapter prices crossings.** His Prerequisite fields gate the *target pattern's fitness for the domain* ("data can be split into semi-independent parts") — they almost never address whether the system stays operable *while crossing*. Intermediate-state feasibility has no counterpart in the catalog (one entry gestures at dual-state awareness). This is ch. 10's delta over the transitions literature, stated exactly — and it means the worked non-commutativity examples above are the chapter's own contribution, not extractable from any catalog.
- **F6 gets field corroboration.** Three infrastructure ratchets (Middleware / Shared Repository / Proxy) carry his independent, near-identical observation that once adopted they are "unlikely to be removed" — irreversibility-orders-commitment as practitioner experience, citable.
- **Ready-made staged-decomposition example:** his Layers/Shared-DB → Event-Driven Pipeline evolution is an explicit multi-delta sequence (add middleware → split shared DB by subdomain → space-based scaling → extract orchestrator) — a catalog-sourced worked example for delta sequencing, to run *through* our feasibility lens.
- **Coverage map:** topology, substrate, persistence densely covered by the catalog; read/write model and state storage thin (CQRS/ES only as "further step" pointers); **recovery class entirely absent** — the chapter supplies recovery-aware edges in its own voice (the payroll BER case already does this).

## Gated on nothing (was: gated on Poltorak)

The edge list exists; the conversation with Poltorak is courtesy and review, per the drafted message. All examples additionally draw on our own corpus: ticketing P1→P2→P3 as staged deltas, the payroll merge-back, and the evolution steps documented inside the four blind-derivation writeups.
