# Pre-registered predictions — Run 3, external shape census

**Registered 2026-08-23, BEFORE any external repository was selected, cloned, or measured.** The
baseline below was measured first, on the author's own codebases, and is disclosed as such.

Run 3 of `book-pfd-meta/PLANNED-CHANGES.md` item 18. Instrument: `jbct shape-census` (jbct-cli
1.0.0-rc3).

---

## The claim under test

*"Every corpus is the author's"* has appeared in all three measurements this project has run. This run
establishes an **external base rate** for JBCT's structural vocabulary — what the shape distribution
looks like in Java written by people who have never heard of the methodology — without needing a
volunteer or a collaboration.

## Baseline: the three known JBCT codebases

Measured 2026-08-23, before the external corpus was chosen.

| Codebase | Methods | LEAF | SEQUENCER | MIXED | Residual |
|---|---|---|---|---|---|
| jbct-loan | 880 | 73.4% | 8.6% | **0** | 10.91% |
| ticketing | 462 | 68.8% | 20.3% | **0** | 5.19% |
| jbct-realworld | 118 | 65.3% | 15.3% | **0** | 17.80% |

**MIXED is zero across all 1,460 methods.** That is the book's *one pattern per function* rule showing
up as a measurement rather than as an instruction, and it is the sharpest thing to predict on.

## The asymmetry that makes MIXED the real test

`UNCLASSIFIED` on foreign code is **ambiguous**: it may mean the code has no recognizable pattern, or it
may mean the classifier — written to recognize JBCT shapes — cannot see the shape that is there. A high
external residual is therefore weak evidence about the code and possibly strong evidence about the tool.

`MIXED` does not have that problem. MIXED is a **positive identification**: the classifier recognized
more than one pattern in one method. It cannot be produced by the tool failing to understand something.

**So P1 carries the run and P2 is registered as weak on purpose.**

## Corpus selection criteria, fixed before any repository is chosen

**N = 4.** All required:

1. Public Java repository.
2. A **domain application** carrying business logic — not a library, framework, build tool or SDK.
3. At least 100 Java files under a `main` source root.
4. Does not use Pragmatica and shows no sign of JBCT.
5. **The author has not contributed.**

Named now, before measurement: **Apache Fineract** (lending — deliberately the same domain as
jbct-loan, which is the closest thing to a fair domain-matched comparison available), **OpenMRS**
(medical records), **Shopizer** (e-commerce), **spring-petclinic** (the canonical small business
sample).

Fineract is the one that matters. A domain match against jbct-loan means a difference cannot be waved
away as "different problem".

## Predictions

**P1 (primary).** External codebases show a **non-zero MIXED rate**, and at least three of the four
exceed **1%** of classified methods. JBCT's three sit at exactly zero.

**P2 (weak, and registered as weak).** External residual exceeds the JBCT range (5.19%–17.80%). This is
graded but **explicitly not load-bearing**, for the tool-ambiguity reason above.

**P3.** External **LEAF share is lower** than the JBCT range (65.3%–73.4%), with the difference showing
up as more SEQUENCER, CONDITION and MIXED — decisions sitting in composed methods rather than at leaves.

**P4 (Fineract, the domain match).** Fineract's distribution differs from jbct-loan's by more than
jbct-loan differs from ticketing. If the two lending systems resemble each other more than the two JBCT
systems resemble each other, **the vocabulary is tracking domain rather than methodology** and P1's
significance collapses regardless of its grade.

**P5 (registered prior, expected to be wrong somewhere).** I expect **spring-petclinic to be the closest
to JBCT's profile** — it is small, sample-quality, deliberately clean code. If a canonical Spring sample
lands inside the JBCT band, then "leaf-dominant with no mixed patterns" describes *careful Java* rather
than *JBCT*, which is a finding against the methodology's distinctiveness and should be reported as
such.

## What would falsify the distinctiveness claim

Any of: external MIXED at or near zero (P1 fails); Fineract closer to jbct-loan than jbct-loan is to
ticketing (P4); or spring-petclinic inside the JBCT band on all three of LEAF, MIXED and residual (P5).

## Scope caveats, registered in advance

1. **The classifier was built for JBCT code.** Every number about foreign code inherits that bias. This
   is why MIXED, not residual, is the primary.
2. **Shape distribution is not quality.** Nothing here says the external codebases are worse. A
   different distribution is a different structure, and the book's argument for why its distribution is
   preferable is made elsewhere and is not tested by this run.
3. **The baseline is the author's own code**, three codebases, one of them (jbct-realworld) small enough
   that its 17.8% residual may be noise.
4. **Method counts differ by orders of magnitude.** Fineract is far larger than jbct-realworld;
   proportions are compared, not counts.

## Grading

The writeup quotes P1–P5 verbatim, grades each, publishes the full per-repository histogram including
any repository that failed selection, and writes one claims-ledger row.
