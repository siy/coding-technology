# Blind Derivation — Companies House: The Run (pre-registered, derived without outcome access)

V₀ = null vector (no existing-architecture facts were supplied or used — this runs as a greenfield pass per `next_step` v0.1: single deployable / direct / unified / current-state / single shared / recovery has no null).

## Normalization notes

Decomposition required: **Q9** splits into four independent pressures (three-registrar/one-search structure; four register types incl. ROE under a different Act; ACSP as new actor class; 7m-individual IDV backfill) — each checked separately, per the entry gate's "team independence is not primitive" discipline. **Q6/Q7** treated together per PROCESS-DESIGN's 2026-07-07 audit (Q7 merges into Q6 as external constraints; legal mandates press only by striking a value, never by cadence). **Q1+Q5** cross-read for shape: several Q1 figures (confirmation-statement 14-day, accounts penalty bands, ECCTA warning-notice 28-day, FOI 20-day, contact-centre 4-min) are *business-process* deadlines, not system-latency targets, and stay inert for Select mode; Q5's December/last-hour pattern is the one genuine Burst signal.

UNKNOWN-inert (rule 3, stated explicitly per occurrence below): Q1 registrar query/reject turnaround; Q2 per-operation criticality tiering; Q3 RPO; Q4 accept-to-search staleness bound; Q6 data-residency relocation; Q7 release cadence; Q8 NAO value-for-money view.

## Pressure pass

| Answer (scope) | Mode | Shape | Axis | Toward | Because-mechanism |
|---|---|---|---|---|---|
| 1,000:1 access:filing ratio + bulk data products (search path) | select/split | volume, divergent shape | 3 | separated | Ledger Axis-3 "own scale shape + own model," bulk export ≠ transactional read |
| DOB must not be public (search path) | prune | — | 3 | separated (reinforces) | field-level redaction = shape divergence the write model doesn't carry |
| Dec accounts peak, 503 in last hour / 28,874 missed (accounts-filing path) | select | burst | 2 | event-based | Ledger Burst: "queue absorbs the peak," no stated sync-latency SLA to defeat it |
| ECCTA query = pending/flagged (case-mgmt path) | isolate | — | 6 | FER | decay-state pattern (fresh→stale→resolved) |
| RP04: original form stays, new filing layers (core register) | prune | — | 4 | current-state + audit-log | near-verbatim ledger match |
| DPA 2018 Sch.2 erasure exemption (core register) | prune | — | 4 | reinforces above | no forced-erasure pipeline needed |
| ROE: different Act, 32,054 vs 5.43m entities, beneficial-ownership shape (ROE data class) | prune | — | 5 | per-component | diverged regulation + volume + shape simultaneously |
| three registrars, one amalgamated search (jurisdiction scope) | split | — | 1, 5 | **inert** | sheet states unity at the search surface explicitly |
| headcount 1,397→1,866 (org) | bound | — | 1 | **inert** | F21 (validated cross-derivation): team size presses cadence divergence only, not topology; Q7 gives none |
| release structure UNKNOWN | bound | — | 1 | **inert** | rule 3 |
| RPO UNKNOWN (durability) | prune | — | 5 | **inert** (blocks distributed-shared) | rule 3 |
| residency UNKNOWN + GDPR Art.49(1)(g) public-register exemption (sovereignty) | prune | — | 5 | **inert** (relief) | exemption removes the pressure it would otherwise create |
| incorporation/dissolution "no simple inverse," restoration "deemed to have continued" | — | — | 6 | design-out | status-transition history, not technical rollback |
| court-ordered rectification, 2–3 months (rare) | — | — | 6 | BER | per-case defined inverse, residuals remain |
| 7m-individual IDV, retroactive, gated per company's own confirmation-statement anniversary | deadline/window | — | 6 | FER (resumable batch) | F7 mechanism; gating is naturally staggered (Q5: confirmation statements not calendar-concentrated) |
| ACSP 1,000+ registrations | — | — | — | **inert** | no volume/latency/consistency figure attached |
| incorporation "usually within 24 hours" | select | — | 2 | **inert** | target ÷ physics floor is nowhere near 1; no forcing |
| confirmation-statement 14-day, accounts penalty bands, FOI 20-day, contact-centre 4min | select | — | — | **inert** | business-process deadlines, not system latency |
| 99.5% target (actual 99.98%) | isolate | — | 2/1 | **inert** | target itself sits below the ~99.9 biting threshold; per-operation tiering UNKNOWN so no split can be forced (WebFiling outage is an *incident*, not a priced demand — flagged, not used) |

## Resolution

**Axis 3 (read/write model).** Two independent citations converge on the same value (Q5 volume-and-shape divergence, Q6 redaction-shape divergence) — this is the "own shape diverges" trigger, not merely "more copies," so the resolution goes past the replicas rung to **separated**, scoped to the public-search/bulk-data path only; everything else (filing-accept, case management) stays **unified**, contained by the read chain (cache, replicas) if load ever needs it — no evidence forces climbing further there.

**Axis 2 (substrate).** Burst shape on accounts-filing selects **event-based** for ingestion (fewest-new-mechanisms: a queue is the named containing mechanism, nothing cheaper contains a calendar-concentrated last-hour spike with no stated synchronous-response requirement). ECCTA query's pending-state pattern reinforces the same value for case-management. Reads keep **direct** — the null, undisplaced.

**Axis 4 (state storage).** Q4's append/layer pattern is the textbook trap the ledger names (F3): "we need audit" tempts event-sourcing, but no REPLAY/reconstruct-as-of-a-past-rule-version demand exists anywhere in the sheet — only WHO/WHAT/WHEN. Cheapest containing value wins outright: **current-state + audit-log-as-data**, one value for both the core register and ROE (their divergence is persistence-shape/volume/regulation, resolved on Axis 5, not a replay need).

**Axis 5 (persistence).** Scope-exclusion-first (rule 5) applies before any hardening: ROE's demand is satisfied by narrowing scope (per-component, ROE only), not by hardening the whole store. Core register stays **single shared** — no ceiling-crossing volume evidence (5.43m companies, 14.7m filings/yr is hardware-rung territory per the F12 precedent), and RPO/sovereignty UNKNOWNs block the one value (distributed-shared) that would otherwise be tempting from the three-jurisdiction fact. The "one amalgamated search" demand (Q9) is satisfied by the Axis-3 separated read model materializing across both persistence components — the same mechanism does double duty as read-scaling and as the composition seam, which is the resolution's one unifying insight.

**Axis 1 (topology).** Every candidate pressure toward services (headcount, three registrars, four register types) resolves to inert or to a different axis (F21 for headcount; unified-search for jurisdictions; Axis-5 per-component for ROE). No release-cadence divergence is stated (Q7 explicitly, "not release cadence"). Resolution stays at **single deployable + modulith**, module seams along the domain lines Q9 actually names (company register, LLP/LP, ROE, IDV, ACSP admin, ECCTA case management, bulk export, search-serving) — modules buy ownership at zero deployment cost per the ledger; nothing here buys release independence.

**Axis 6 (recovery).** Mixed, as every validated run has been: design-out for append/status-transition operations (incorporation, dissolution, restoration, ordinary corrections, routine filings); FER for degraded/pending/batch shapes (ECCTA query, bulk export, IDV backfill); BER for the rare, per-case, externally-adjudicated compensations (court-ordered rectification, ECCTA post-hoc removal). ECCTA reject-before-acceptance is out of recovery-axis scope entirely — it's admission control (ticketing-precedent: fast-fail is a contention response, not a recovery class).

## Derived vector

**Single deployable + modulith / event-based (filing-intake, case-mgmt) + direct (reads) / unified (core, with cache+replica containment) + separated (public-search & bulk-data path) / current-state + audit-log-as-data (all data classes) / single shared (core) + per-component (ROE) / mixed recovery: design-out (append & status-transition ops) + FER (query, bulk export, IDV backfill) + BER (court rectification, post-hoc removal)**

Confidence: Axis 4 HIGH · Axis 3 HIGH (separated-vs-replicated call MEDIUM within it) · Axis 5 MEDIUM-HIGH (ROE split) / MEDIUM (core stays single-shared, resting partly on UNKNOWN-absence) · Axis 2 MEDIUM-HIGH · Axis 1 MEDIUM (rests on three UNKNOWNs staying inert) · Axis 6 MEDIUM (BER/FER assignments for ECCTA operations are structural matches, not directly evidenced mechanisms).

## Pre-registered predictions

1. **[HIGH]** Public search/register-read is served by a read-optimized layer (projection, cache, or replica set) distinct from the filing-transaction path, not by hitting the primary transactional store per search.
2. **[HIGH]** Filing corrections/amendments are documented as new records layered onto history, not in-place mutation of prior filings.
3. **[MEDIUM-HIGH]** The Register of Overseas Entities is documented as its own data component, distinct from the core companies register.
4. **[MEDIUM-HIGH]** No documented event-sourced/full-replay architecture for the core register; current-state-plus-history-log is the documented model.
5. **[MEDIUM]** Accounts-filing ingestion (especially around the December peak) shows asynchronous/queued decoupling between submission and acceptance, not one synchronous request-response transaction.
6. **[MEDIUM]** ECCTA query/reject/remove workflows involve a case-management layer with a pending/flagged state, not a purely synchronous accept-or-reject-at-submission decision.
7. **[MEDIUM]** No documented multi-region active-active or consensus-replicated persistence layer for the core register; the three-jurisdiction structure is a namespace/organizational fact, not an infrastructure-multi-region one.
8. **[LOW-MEDIUM]** The system is not documented as a full microservices-per-team decomposition proportional to the 1,866-person headcount; documentation instead shows a smaller number of major subsystems (this is the derivation's most exposed negative claim — it rests on F21's generalization plus three UNKNOWNs staying inert, not on a Companies-House-specific citation, and a public-sector org of this size and growth rate is exactly the profile most tempted to over-decompose).

## Consistency-lens verification

- **Filing acceptance** — guarantee: durable, appended, non-overwriting; good-faith/limited-examination at accept. Mechanism: event-based queue (burst absorption) → single-shared append (current-state+audit-log). Failure: idempotent reprocessing safe; queue durability and exact RPO are UNKNOWN, so no numeric loss guarantee can be asserted — only the mechanism's intent.
- **Public search** — guarantee: eventually-consistent, DOB-redacted view. Mechanism: separated/projected read model. Failure: a staleness window necessarily exists (projection lag) but its bound is UNKNOWN (Q4) — guarantee without a stated bound is exactly what the verify phase exists to flag, not paper over.
- **ECCTA query** — guarantee: challengeable post-acceptance without court order. Mechanism: FER pending state. Failure: FER requires the degraded window be *bounded and visible* (ledger cost); Q1 explicitly states no published turnaround exists for these decisions — open guarantee gap, flagged not filled.
- **Court-ordered rectification** — guarantee: rare true removal. Mechanism: BER, per-case, ~2-3 months. Failure: residuals remain (third-party reliance on now-removed info) — matches the ledger's own BER cost note directly.
- **Identity verification backfill** — guarantee: 7m+ individuals verified before their gating filing. Mechanism: FER resumable/checkpointed batch, staggered by each company's own anniversary. Failure: partial completion safe; enforcement is at each individual's next filing, not a hard cutover — grounded directly in the domain-shape fact's wording.

## Quarantine log

No specific recalled fact about Companies House's actual system architecture, technology choices, or team structure was used anywhere above; every axis position traces to a quoted answer-sheet line or a named ledger/method rule (cited inline). One general, unused awareness is logged defensively: UK government digital services broadly follow GDS conventions, and Companies House has undergone a known public digital-transformation program — this was **not** used to select any axis value (prediction 8 in particular was deliberately built to argue *against* the decomposition-by-headcount instinct that awareness would otherwise supply, using F21 and the stated UNKNOWNs instead). The derivation stands unchanged with this awareness fully discounted.
