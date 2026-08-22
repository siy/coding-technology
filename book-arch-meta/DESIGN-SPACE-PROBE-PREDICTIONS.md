# Pre-registered predictions — Run 4, the design-space probe

**Registered 2026-08-22, BEFORE any answer sheet was written and before any target system was
researched in detail.** Targets were named first, on the reasoning below, and nothing here was written
with a derivation in hand.

Run 4 of `book-pfd-meta/PLANNED-CHANGES.md` item 18.

---

## The claim under test

`book-arch-meta/architecture-synthesis-review.md:158`: the book *"defines an optimization procedure over
a chosen architectural design space rather than proving that the design space itself is complete."*

The corpus to date — Shopify, Discord, Stack Overflow, Companies House, and three ticketing profiles —
was assembled to demonstrate the procedure. **This run is assembled to break it.** The target is not a
hit rate. It is to find one architecture the ledger cannot express.

## Why this run grades mechanically, and Run 2 did not

The judgment sits in writing the answer sheet from published facts. The **derivation is then performed
by `derive()` in `website/next-step/`, not by me**, and the engine's refusals (`UNFORCED`,
`UNVERIFIED`, `UNNORMALIZED`, an axis with no pressing rule) are the instrument. I cannot talk the
engine into a vector, which is the property Run 2's hand-rolled metric lacked.

## Targets, and why each was chosen to stress a specific weakness

Chosen to be **hard enterprise backends**, not out-of-scope domains. An earlier external review
suggested collaborative editors and blockchains; that was rejected, because a scoped claim is not
falsified by systems the book explicitly disclaims.

1. **LMAX** — an exchange that deliberately chose a single-threaded in-memory monolith on one machine,
   with a published rationale. It sits at the opposite extreme from every corpus entry. It stresses
   whether the ledger can express *deliberate non-distribution under extreme load*.
2. **Segment** — the documented microservices-to-monolith reversal. Stresses "derived, not chosen"
   directly: the same business ran both architectures, so at most one can be the derived one, and the
   engine has to say which set of answers changed.
3. **Monzo** — a bank at 1,600+ services, the far extreme of decomposition. Stresses whether anything
   in the ledger can force that many boundaries, or whether it tops out well below.

## Predictions

**P1.** At least one of the three produces an **inexpressible** result — an axis where the sheet's facts
press nothing, or where the outcome architecture corresponds to no value in the ledger. Inexpressibility
is the finding; a clean sweep is the surprise.

**P2 (LMAX).** The engine will fail to derive LMAX's actual topology. Specifically: the ledger has no
value that says *put it on one machine and make it fast*, and LMAX's latency answer will press toward
mechanisms the ledger prices as distribution. **I predict a MISS on topology and I predict the reason is
a missing axis: mechanical sympathy / single-node performance is not an axis the book has.**

**P3 (Segment).** Run the sheet twice, once with the demands as stated at the time services were
adopted and once as stated at the reversal. **I predict the engine derives materially different vectors
from the two sheets** — which would support "derived, not chosen". If it derives the *same* vector from
both, the reversal was not demand-driven and the book's central proposition has a counterexample worth
publishing.

**P4 (Monzo).** The engine will **not** force 1,600 services. I predict it stops at a small number of
subsystem boundaries and that the residual is organizational — which is consistent with the book's
declared scope, since it takes the enterprise altitude as an input rather than deriving it. A HIT here
is unremarkable; a MISS (the engine forcing extreme decomposition from demands alone) would be a
serious finding against the ledger's cost model.

**P5.** Across all three, **at least one axis receives no pressure at all** from any sheet, joining
`unified runtime` and `serverless` in the UNFORCED set.

## What counts as inexpressible

Recorded as one of three, distinguished because they are different defects:

- **Missing value** — the axis exists, the outcome is not among its values.
- **Missing axis** — the outcome varies along a dimension the ledger does not name.
- **Missing input** — the ledger could press correctly, but the question sheet has no field carrying the
  fact the rule would read.

## Scope caveats, registered in advance

1. **Published architecture writeups are marketing-adjacent.** They describe what a team chose and the
   reasons they were willing to state, not necessarily the reasons that operated.
2. **Hindsight.** All three outcomes are known to me. The sheet must be written from *demands* only, and
   the predicted vector recorded before running `derive()`.
3. **A miss is ambiguous between a bad sheet and a bad ledger.** Where a miss occurs, the sheet is
   published so a reader can attack the sheet rather than take the verdict on trust.

## Grading

The writeup quotes P1–P5 verbatim, grades each, publishes every sheet and every engine output including
refusals, and writes one claims-ledger row: claim, instrument, result, caveat.
