# Architecture Synthesis — Planned Changes (backlog)

> Queued AS changes. Not shipped until folded into `book-arch/*.md`, the ledger
> (`book-arch-meta/LEDGER.md`), the engine (`website/next-step/`), and the book's CHANGELOG.
> First entries created 2026-08-22 from Run 4 of the measurement programme
> (`book-pfd-meta/PLANNED-CHANGES.md` item 18).

## Open items

### 1. Blast-radius containment presses nothing — `measured` (Run 4)

**Found by:** `DESIGN-SPACE-PROBE-RESULTS.md`. Segment's sheet states the demand that actually drove its
service split — *"One failing or throttling destination must not degrade delivery to the other 99."*
The engine returns **"no rule in the ledger prices this row against the current position."**

**Why it matters.** Topology moves on **cadence divergence and nothing else**. Fault isolation is one of
the most common real reasons teams split services, and the derivation is blind to it. A system whose
decomposition is driven by containment derives `single deployable` regardless.

**What exists already:** `CONTAINMENT` is exported from `website/next-step/ledger.js` and lists
topology, substrate, read_write, state, persistence. The concept is present; no press rule reads a
per-path isolation demand against it.

**Shape of the fix (not yet designed):** a Q2 row scoped to a path, stating that one part's failure must
not degrade another, should press topology toward `multiple deployables` with `blast-radius isolation`
as the mechanism — and must be distinguishable from cadence divergence, since the two justify the same
move for different reasons and carry different costs.

**Caution.** Segment split on exactly this demand and it was the wrong call for them; the reversal is
why. So the rule must press the move **and** carry the operating-envelope cost that Q8 states, or the
engine will reproduce Segment's mistake rather than avoid it. Getting this rule wrong is worse than not
having it.

### 2. Recovery time does not reach state storage — `measured` (Run 4)

**Found by:** the LMAX sheet. `event-sourced` is pressed by replay-and-derive-projections or regulatory
reconstruction, per the book's audit-versus-replay distinction. LMAX journals input events and rebuilds
in-memory state **to recover quickly after failover** — a different demand, stated on the sheet in Q2
("failover to a hot replica measured in seconds"), read by no rule against `state`.

Five of six axes derived correctly for LMAX; this was the only miss.

**Shape of the fix:** a rule connecting a recovery-time demand to state storage, kept distinct from the
audit path so that the book's own audit-is-not-event-sourcing lesson survives intact.

### 3. Mechanical sympathy — as a price and a prune, not an axis (2026-08-23)

Raised by the author after Run 4. **Recommendation: do not add an axis, and do not add a `single-node`
topology value** — `single deployable` is already the null vector and LMAX derived it correctly without
help.

The axes describe *structural* choices. Mechanical sympathy is not a structure; it is a **constraint on
what a structure costs**, and the ledger already has that machinery in `BOUNDARY_COST` and the mechanism
bill. Three integration points, cheapest first:

1. **As a price.** LMAX's real content is *a network hop costs more than the entire latency budget*.
   Q1 currently presses mechanisms; it should also be able to **veto** them. A latency budget read
   against the cost of a boundary is a rule, not an axis.
2. **As item 2 above.** In-memory state with a journal is a performance structure; the missing
   recovery-time rule covers LMAX without inventing anything new.
3. **As an exit-gate floor.** Some budgets are unreachable by any distributed arrangement. `verify.js`
   already checks a mechanism bill against a budget; refusing a vector whose bill cannot meet the floor
   belongs there rather than in the entry gate.

**The unifying claim: mechanical sympathy says which architectures are *unaffordable*, not which are
*required*.** That makes it a pruning force — the same shape as an explicit mandate strike, which
`prune` already implements. The extension is to `prune`, not to the ledger's axes.

### 5. Schema synthesis — the data module (2026-08-24) — `ruled` (rulings R7–R11)

The persistence/schema derivation joins the AS successor as **one module, internally split
logical/physical** (ANSI/SPARC three-schema lineage: conceptual vs internal). Ruled with the
author 2026-08-24; the session record carries the full argument.

- **Placement (R7).** One book — this one; genre decided it (PFD states what the design
  determines, AS derives artifacts). The logical part (grain, transaction boundary,
  state-representation lower bound, identity, enforcement obligations) consumes PFD outputs only
  and works without the architecture derivation — most systems' vector is "single deployable" and
  they still need a schema. The physical part (placement, state-representation strengthening,
  materialization, lifecycle, enforcement mechanisms) consumes the architecture vector. State
  representation is two-pass: logical lower bound (history readers, recovery choice), physical
  strengthening (event-based composition). The physical part carries **store-form
  considerations** (in-memory, KV/document, relational, event log) — the section where item 2
  (recovery-time-to-state) resolves: the logical part's atomicity and durability obligations
  filter eligible forms. One elicitation sheet (extends this book's), one engine (`next_step`
  extends), one replication kit. Deferred to drafting: AS 2.0 vs 1.x; subtitle widening. The PFD
  side gets a forward pointer only (`book-pfd-meta/PLANNED-CHANGES.md` item 20).
- **Elicitation (R8).** Four questions, each with a necessity proof that no process output can
  answer it: RPO; read latency and staleness per path (both dedupe against the existing sheet —
  never ask twice); volume/cardinality growth per closure; off-process access registration —
  readers *and writers*, fixed taxonomy (analytics, support, regulatory export, ML, ops
  debugging). A fifth question (retention authority) was deleted before drafting:
  `book-pfd/data-question.md:91-95` already places the authority in the change-driver register —
  replaced by a register completeness check that bounces incomplete entries back to the design.
  Principle for the chapter: *schema synthesis never elicits business facts; it may reject
  incomplete design artifacts.* Tenant isolation joins item 1's isolation question; estate
  constraints enter as prunes (item 3's shape). Residue protocol: the set is pre-registered,
  unregistered questions needed during real derivations are logged misses, and the question count
  is the module's headline metric (four against this book's nine).
- **Axes (R9).** Eight, with a **published derivation order** — logical: transaction boundary (no
  free choice: it *is* the invariant closure) → grain (never splits a closure; retention
  divergence presses finer) → identity (minting operations) → state-rep lower bound → enforcement
  obligations; physical: placement → state-rep strengthening → materialization → lifecycle →
  enforcement mechanisms. **Enforcement locus is the eighth axis**: multi-writer invariants go to
  the store (the only serialization point all writers share), single-writer invariants stay at
  the parse boundary, mirrored as store checks only when an off-process writer is registered; FK
  demotion across stores is the worked example. Axis-2's codomain is an **atomicity obligation**
  (field set, operations, observer set) — never "a transaction"; placement earns the mechanism.
  The module carries its own boundary statement: not normalized — index tuning, physical
  parameters, vendor-within-class, ORM mapping, migration tooling.
- **Evolution (R10).** In scope for v1, derivation only: design motion → migration class
  (minting/accretion → additive; absorption → re-grain plus constraint; emancipation → extract,
  expand–contract; severance-introduced → linkage-destruction retrofit) plus non-motion triggers
  (new registered reader; answer change; a volume number crossing a registered flip point) →
  which axes re-derive. The severance-retrofit asymmetry (crypto-shredding needs per-subject keys
  from the first write) is the priced callout. Migration *mechanics* are below the line,
  registered for the **Aether book**. Ships with the validation protocol registered and one
  executed case — emancipation, which `data-question.md:73` already commits to in print.
- **Validation (R11).** `SCHEMA-VALIDATION-PREDICTIONS.md` in this directory, committed **before
  the first derivation**: corpus inventory (the Run 3 four plus `jbct-loan`); input firewall —
  design inputs reconstructed from non-schema artifacts only, `READ_SCHEMA: no` disclosure per
  deriver (Run 1b's isolation move); per-axis diff metric, never table-name matching;
  framework-noise exclusions by category, named in advance; a noun-extraction baseline as the
  designated collapse condition (if eight axes don't beat noun-per-entity, the method adds
  nothing); the Fineract-vs-`jbct-loan` same-domain control; tiebreaker thresholds as registered
  constants; one blind evolution case from a corpus release history; and the logical/physical
  evidence asymmetry stated up front — this corpus validates the logical axes richly and the
  physical poorly (four single-RDBMS monoliths), so physical axes validate against the
  documented-systems corpus at AS-grade evidence.

## Carried from the book review

### 4. The design space is not proven complete — `open`

`architecture-synthesis-review.md:158`. Run 4 probed it with four out-of-corpus sheets and found no
missing *value* and no missing *axis* — every outcome was expressible. What it found was two **missing
inputs** (items 1 and 2). That is evidence about the axes, not about completeness, and the limit should
be stated explicitly in the book rather than left implicit. See `book-pfd-meta/PLANNED-CHANGES.md` item
17.2: the same gap appears at the PFD entry, and naming it once as a property of the whole pipeline is
stronger than patching each end.

## Shipped

_None yet._
