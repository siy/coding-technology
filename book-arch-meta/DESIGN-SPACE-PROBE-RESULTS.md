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
