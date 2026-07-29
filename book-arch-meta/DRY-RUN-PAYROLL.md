# Dry Run 2 — `next_step` v0.1 against payroll (non-ticketing domain)

**Purpose:** prove the process isn't ticketing-shaped. Source of truth: `book-pfd/brownfield.md` — the long-lived hybrid vector (§Hybrid V₁), the merge-back walkthrough (§A worked walkthrough), and the payroll vocabulary (§The system, in its own words). Three tests: (A) greenfield derivation from current inputs must land on the published hybrid; (B) audit with unchanged inputs must return "no change"; (C) the merge-back walkthrough's V₀ + failed inputs must yield exactly the chapter's one-axis delta.

**Result up front: all three pass. Payroll surfaced four new findings (F7–F10) — all of them extend the demand vocabulary and the capability ledger, none of them changed the algorithm. That is the ideal outcome: the mechanics are domain-stable; only the vocabulary grows.**

---

## Constructed Phase-4 answers (each traceable to a chapter justification)

Per domain: tax regulator requires **reconstructable decision history per rule version** (#6 — genuine replay demand, "the tax-decision class the regulator made event-sourced"); payslip is a **legal record** with retention (#6); multi-employer tenants, one country (#10); scale shape (#11): **event-heavy time-import** (continuous shift/clock events, "the one data class whose volume earns it"), read-heavy reporting at period close, write-bursty pay-run windows; teams want ownership, uniform release cadence acceptable, **pay-run/filing freeze windows immovable** (#8); bounded ops capacity (#9).

Per use case (#1–#3): **pay run = deadline, not percentile** — complete population P within window W before pay date; miss = missed payday (criticality max). Self-service payslip/balance ~1–2s P95, 99.9%. Time-import ingest throughput-bound; sources buffer and retry.

Per data class (#4–#5): money (net pay, disbursement, ledger postings) strict, RPO 0; tax decisions strict + immutable history; accruals eventual, converge by period close; reporting bounded staleness.

Domain-shape facts (recovery rows, F4): money has **in-domain inverses that are themselves named domain workflows** — *off-cycle correction* with top-up/clawback; tax-decision log is append-only, corrected by superseding; accruals tolerate lag and converge.

## Test A — greenfield derivation vs the published hybrid

| Demand (scoped) | Mode | Resolution |
|---|---|---|
| time-import: scale shape orders of magnitude off the core + own availability profile + independent operation (path) | split | decompose-triggers fire (distinct SLO, distinct scaling, independent operation) → **extract time-import as service**; the feed itself continuous/ordered/high-volume → **streaming for that data class** ✓ |
| team ownership vs ops cost (domain, same scope) | bound | decompose (F2): ownership → modules demanded; release independence → NOT demanded (uniform cadence acceptable) → **modulith core** ✓ |
| pay-run steps strict within (gross → deductions → tax → net → disburse see each other) | select | **direct within**; facts to extracted service lag-tolerant → **event-based across** → mixed ✓ |
| reporting: period-close read storm, own load profile, staleness OK (path) vs core write path | split | different scopes → **separated read model, reporting path only** ✓ |
| tax decisions: replay per rule version (data class) | prune | replay IS demanded → **event-sourced for that class only** ✓ |
| money: legal record + audit, replay NOT demanded (data class) | prune | ledger comparison (F3 fires again, new domain): cheapest provider = **current-state + payslip/audit as data** — the payslip is audit-as-data materialized as a domain artifact ✓ |
| persistence: time-import append-heavy time-series + own service lifecycle | prune/bound | **per-component store for the diverged component; single shared for the rest** ✓ |
| money → BER (off-cycle correction = the inverse, in-domain); tax log → design-out (append-only, supersede); accruals → FER (lag, converge) | recovery | **BER + design-out + FER** ✓ |

**Derived:** *modulith + extracted time-import service / direct within + event-based across + streaming for the time feed / unified + separated reporting path / current-state + event-sourced tax decisions / single shared + per-component for the diverged / BER + design-out + FER* — **matches the chapter's hybrid on every axis and every "except."**

Corollary the chapter itself states (§Hybrid: unjustifiable exceptions are "technical debt in the methodology's own terms"): since the derivation reproduces every exception from current inputs, it found **zero debt** in this hybrid — and any exception it had failed to derive would have been flagged mechanically. See F10.

## Test B — audit direction, unchanged inputs

V₀ = the hybrid, same answers → press step records **zero uncontained demands** → output: **"no architectural change; address triggers inside the existing vector."** The audit discipline ("most triggers do not need an architecture change") reproduced mechanically, not as restraint.

## Test C — the merge-back walkthrough

V₀ = *three deployables / direct across + shared schema / unified / current-state / single shared / BER*. Live inputs (chapter's audit): deploy independence failing (#8, lockstep releases), availability under deploys (#3, missed-payday risk), ops cost ×3 (#9); scale shape neutral (#11).

- Press: #8/#3/#9 demands NOT contained by V₀. What demands "three deployables"? Ledger check: many-deployables provides independent release / independent scaling / blast-radius isolation — **none of which any live input demands, and none of which the system actually exhibits** (shared schema → lockstep → shared failure domain). The position is *unforced*: no demand cites it — mechanical detection of the chapter's "axis changes that satisfy no input are speculation."
- Resolve: cheapest value containing the live demands = **single deployable, modules preserved**. No other axis pressed → unchanged.

**Derived delta: deployment axis only, merge-back to modulith — exactly the chapter's V₁, including its four-axes-unchanged shape.** Localization also validates incremental recomputation: failed inputs pressed one axis; one axis moved.

---

## New findings (all vocabulary/ledger, none algorithmic)

- **F7 — deadline-shaped SLOs.** Pay run's target is "population P complete within window W by date D" — neither a percentile nor nines. The 11 questions absorb it (#1/#3), but the demand vocabulary needs the deadline/window shape as first-class, and the capability ledger needs the mechanisms that contain it: windowed throughput capacity and **resumable/checkpointed batch** (availability for a batch = ability to finish despite failures, pressing recovery, not uptime). Ticketing could never have surfaced this.
- **F8 — business-calendar constraints on transformation.** Freeze windows (year-end close, filing season — "payroll's immovable walls") add a calendar dimension to intermediate-state feasibility. Belongs to the transformation half: a delta's window is a first-class feasibility input.
- **F9 — compensation as domain workflow.** BER's inverse here (*off-cycle correction*, clawback) is a named business process with its own SLOs, confirming the module's "the inverse is itself a use case" — and giving the recovery axis's domain-shape rows a concrete non-ticketing anchor.
- **F10 — the process doubles as a debt detector.** An axis position the derivation cannot reproduce from current inputs = debt, mechanically (Test C caught exactly this: "three deployables" cited by no demand). The chapter asserts this definition of debt in prose; the process operationalizes it.
- **Poles complete:** payroll is volume-without-contention (embarrassingly parallel per employee); ticketing's on-sale is contention-without-volume (one seat, one winner). The volume/contention distinction now has worked examples at both poles.

## Verdict

Domain-independence: **passed.** Nothing in the mechanics referenced ticketing; the new domain added demand shapes and ledger entries, not process steps. Combined with Dry Run 1: `next_step` v0.1 has now reproduced five published derivations (three greenfield profiles, one no-change audit, one brownfield delta) across two domains.

**Next hardening:** first-draft the capability/cost ledger (6 axes × values × provides / mechanism / costs) — both dry runs leaned on it informally at every "cheapest containing value" step; it is now the process's least-specified component.
