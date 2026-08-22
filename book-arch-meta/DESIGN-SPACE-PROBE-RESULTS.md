# Run 4 — design-space probe: results (partial)

**Executed 2026-08-22** against `DESIGN-SPACE-PROBE-PREDICTIONS.md`. **One of three targets complete
(LMAX).** Segment and Monzo are not yet run; P1, P3, P4 and P5 cannot be graded until they are.

---

## Harness

`website/next-step/run4-probe.mjs` — parses a sheet, runs the entry gate on the TOML text, then
`derive()` and `deriveRecovery()`. The sheet is `website/next-step/corpus/lmax.toml`, written from
published demands (Fowler's LMAX article, the Disruptor paper) with the outcome deliberately not
encoded.

**Two harness defects found and fixed before any result was read**, both of the Run 2 kind:

1. The probe called `checkSheet(sheet)` with the parsed object; the function takes the TOML **text** and
   parses internally. Passing the object produced `invalid key 'object Object'` and a failed gate. The
   control sheet (`ticketing-venue.toml`) reproduced the identical finding, which is what identified it
   as a harness bug rather than a sheet defect.
2. The first sheet spelled "Six million orders per second". The gate's `NO_NUMBER` note caught it —
   the book's own rule is *every answer needs a number and a scope*. Corrected to `6,000,000`. The
   market-data row has no published figure, so it is marked `status = "unknown"` rather than given an
   invented number.

Neither fix changed the derived vector, but both were made before it was interpreted.

## Result — LMAX

Entry gate: **passes**, no blocking findings. Notes: `q6` absent (carried as UNKNOWN), and the
`unknown`-status market-data row.

Derived vector, with **zero pressures recorded** — all five structural axes hold the null vector:

| Axis | Derived | LMAX actual | |
|---|---|---|---|
| topology | single deployable | single deployable, one machine | **hit** |
| substrate | direct | in-process ring buffer | **hit** |
| read_write | unified | unified | **hit** |
| state | current-state | **event-sourced** (journal + replay) | **miss** |
| persistence | single shared | single journal | **hit** |
| recovery | compensate / design-out / degrade-and-continue per operation | cancel, sequenced matching, decaying market data | **hit** |

**Five of six axes correct.**

## Grading

> **P2 (LMAX).** The engine will fail to derive LMAX's actual topology. Specifically: the ledger has no
> value that says *put it on one machine and make it fast*, and LMAX's latency answer will press toward
> mechanisms the ledger prices as distribution. **I predict a MISS on topology and I predict the reason
> is a missing axis: mechanical sympathy / single-node performance is not an axis the book has.**

**MISS — the prediction was wrong, and the engine was right.**

Six million orders per second pressed **nothing**. The reason is a refusal the engine already had:
volume at data-class scope presses `sharded` only alongside a natural partition key, and an order book
has none — one book, one total order, and the Shopify sheet's rule that *a partition key never rescues a
contention row* applies exactly. The engine declined to move an axis on volume alone, against a system
it had never seen and whose demands are more extreme than anything in the corpus.

The registration also expected the ledger to lack a value for single-machine deployment. It does not:
`single deployable` **is** the null vector. The prediction confused "the book has no axis for mechanical
sympathy" — which is true — with "the book cannot express the outcome", which is false. Those are
different claims and the registration conflated them.

## The one real finding: a missing input on `state`

LMAX journals every input event and rebuilds in-memory state by replay. The engine derives
`current-state`.

By the pre-registered taxonomy this is a **missing input**, not a missing value or a missing axis. The
ledger presses `event-sourced` from a *replay-and-derive-projections* or regulatory-reconstruction
obligation, per the book's own audit-versus-replay distinction. LMAX's event sourcing answers a
different demand: **rebuild in-memory state quickly after failover.** The sheet states that demand — Q2
carries "failover to a hot replica measured in seconds" — and no rule reads it against the `state` axis.

So the question sheet has no field connecting a **recovery-time** demand to **state storage**, and a
system that event-sources for recovery rather than for audit derives the wrong value. That gap is worth
a rule.

## Standing

P1, P3, P4 and P5 are **ungraded** pending Segment and Monzo. One target does not test design-space
completeness; it tests one point in it.

What LMAX does establish, and it is not nothing: **the engine refuses to move on extreme volume alone,
on a system outside its corpus, written by someone who expected it to fail.** That is the refusal
clause working, and it is the first evidence for it from outside the author's own examples.

Claims-ledger row: *claim — the AS design space is complete; instrument — `derive()` over out-of-corpus
systems; result — **partial, 1 of 3 targets**, 5/6 axes reproduced, one missing input identified;
caveat — a single target, and the outcome was known to the sheet's author.*

---

# Run 4 complete — Segment and Monzo (2026-08-22)

Sheets: `corpus/segment-split.toml`, `corpus/segment-reversal.toml`, `corpus/monzo.toml`. All written
from published demands with outcomes not encoded.

## Segment — both eras derive the same vector

| | split-era sheet | reversal-era sheet |
|---|---|---|
| topology | single deployable | single deployable |
| substrate / read_write / state / persistence | null vector | null vector |
| pressures recorded | **none** | **none** |

The two sheets differ only in Q8, where the reversal sheet states the operating ceiling that actually
drove the reversal. **The engine derives an identical vector from both.**

> **P3 (Segment).** I predict the engine derives materially different vectors from the two sheets.

**MISS.** They are identical. But the direction matters more than the grade: the engine derives **single
deployable in both eras** — which is the architecture Segment returned to after roughly two years of
running 140 services. From demands alone, and with the outcome withheld, the method declines the split
that a competent team made and later undid.

That is one case and it is retrospective, so it proves nothing on its own. It is still the first
instance in this project of the method disagreeing with a real team's decision **in the direction the
team itself later moved**.

## Monzo — one step of decomposition, and it stops

| Axis | Derived | Pressed by |
|---|---|---|
| topology | **multiple deployables** | cadence divergence, `unit:payments` (independent vs continuous baseline) and `unit:lending` (weekly) |
| substrate / read_write / state / persistence | null vector | nothing |

> **P4 (Monzo).** The engine will **not** force 1,600 services. I predict it stops at a small number of
> subsystem boundaries and that the residual is organizational.

**HIT.** Topology moves exactly one step, on cadence divergence alone, and nothing else moves. The
remaining 1,598 boundaries are not derivable from demands — which is consistent with the book taking the
enterprise altitude as an input rather than deriving it.

> **P1.** At least one of the three produces an **inexpressible** result.

**HIT.** Two, and both are *missing inputs* rather than missing values (see below).

> **P5.** At least one axis receives no pressure at all from any sheet.

**HIT**, and broadly: `substrate`, `read_write`, `state` and `persistence` received **zero** pressure
across all four sheets. Weak evidence, since four sheets is a small probe.

## The two gaps this run found

**G1 — blast-radius containment presses nothing.** Segment's `answers.q2[1]` states the demand that
actually drove its split: *"One failing or throttling destination must not degrade delivery to the other
99."* The engine reports **"no rule in the ledger prices this row against the current position."**

`CONTAINMENT` exists in `ledger.js` as a concept, and no press rule reads a per-path isolation demand
against it. Topology moves on **cadence divergence and nothing else**. So a system whose decomposition
is driven by fault isolation is invisible to the derivation — and fault isolation is one of the most
common real reasons teams split services.

**G2 — recovery time does not reach state storage.** From the LMAX run above: `event-sourced` is pressed
by replay-or-audit obligations, and LMAX event-sources to rebuild in-memory state after failover. The
demand is on the sheet, in Q2, and no rule reads it against `state`.

Both are the same shape: **a real demand, statable on the sheet, that no rule prices.** That is the
`missing input` category of the pre-registered taxonomy, and it is the category the probe was least
expecting to dominate.

## Sheet defects, disclosed

The gate flagged `NO_CRITICALITY` on all four sheets, and `UNTRIAGED` / `UNSCOPED` on Monzo's q7 unit
rows. My sheets are imperfect; a reader who thinks a verdict is wrong should attack the sheet first.

## Final grading

| | Prediction | Result |
|---|---|---|
| P1 | at least one inexpressible result | **HIT** (two, both missing inputs) |
| P2 | LMAX topology MISS via a missing axis | **MISS** — prediction wrong, engine right |
| P3 | Segment's two eras derive different vectors | **MISS** — identical |
| P4 | Monzo not forced to extreme decomposition | **HIT** |
| P5 | at least one axis unpressed | **HIT** |

Three hits, two misses. **Both misses were mine, not the engine's**, which is the outcome a probe
designed to break something should report honestly: I predicted two failures and the engine survived
both, then found two gaps I had not predicted at all.

Claims-ledger row: *claim — the AS design space is complete; instrument — `derive()` over four
out-of-corpus sheets; result — **two missing inputs found** (blast-radius containment; recovery-time to
state), design space otherwise expressed all four outcomes; caveat — four sheets, outcomes known to
their author, sheets carry gate warnings.*
