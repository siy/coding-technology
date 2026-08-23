# Pre-registered predictions — Run 6, does composition detection generalize beyond Pragmatica?

**Registered 2026-08-23, BEFORE any measurement of the target.** Corpus size and vavr usage were checked
as *selection*; no shape-census was run on the target before this file was committed.

Run 6 of `book-pfd-meta/PLANNED-CHANGES.md` item 18.

---

## Why this run exists, and how it differs from its original framing

Item 18 framed Run 6 as *"the four-facts rule beyond the author"* — applying the composition-obligation
checklist to a stranger's suite. That framing needs a human reading tests against chains, which has no
mechanical grader and would be graded by me. Run 5 already showed what that costs.

**Re-scoped to the question Run 3 could not answer.** Run 3's headline finding was SEQUENCER at
8.64%–20.35% in JBCT code against 0.00%–0.17% across 48,000 external methods, and it carried an
explicit confound:

> SEQUENCER detection keys on monadic chains, which is a Pragmatica idiom. A large part of this gap is
> "these codebases do not use this library."

**This run separates *Pragmatica idiom* from *functional-composition idiom*.** If Java code that
composes with a different library still classifies as SEQUENCER, the detector measures structure. If it
classifies as UNCLASSIFIED, the detector measures Pragmatica, and Run 3's headline number is largely a
library artifact.

That is a question about the **instrument**, and one codebase can answer it.

## Corpus, and its severe limit

**N = 1: `ddd-by-examples/library`** — a library-lending domain, 85 main Java files, vavr used
throughout (39 source files import `io.vavr`; 31 `Either<`, 37 `Try<`, 35 `Option<`).

**Disclosures, all of them uncomfortable:**

1. **N=1. This is not a population study and nothing here generalizes.** It is a single-case test of
   whether an instrument fires.
2. **It fails Run 3's size criterion** (85 files against ≥100). Run 3's threshold is not applied here
   because this is not a distribution comparison — but the reader should know it would not have
   qualified there.
3. **The search that produced it is itself the finding.** GitHub code search for `io.vavr.control.Either`
   in Java returns overwhelmingly **katas, workshops and library integrations** — `advent-of-craft`
   exercises, `cyclops-integration`, `vavr-jackson`, `assertj-vavr`. Of two topic-tagged candidate
   applications, one (`modular-monolith-restaurant`) turned out to use **no vavr at all**. Public Java
   business code using functional error handling is *rare*, and that is worth stating plainly rather
   than working around.
4. **It is a teaching example**, not a production system, so its structure is likely cleaner than
   working code.

## Predictions

**P1 (the load-bearing one).** vavr-composed Java produces a **non-zero SEQUENCER rate**. If SEQUENCER
is 0.00%, the detector is Pragmatica-specific and Run 3's headline gap must be restated as a library
difference rather than a structural one.

**P2.** The SEQUENCER rate lands **below the JBCT band (8.64%–20.35%) but materially above the external
band (0.00%–0.17%)** — say above 1%. JBCT mandates composition; vavr merely permits it.

**P3 (registered prior).** **MIXED > 0.** A DDD-style codebase composing with vavr has no rule against
mixing patterns inside a chain, so I expect the newly-fixed MIXED bucket to fire. If MIXED is 0 here,
that is evidence the one-pattern-per-function discipline is either widely shared or the bucket is still
narrower than it looks.

**P4.** Residual (MIXED+UNCLASSIFIED) lands **between** the JBCT band (5.19%–20.28%) and the external
band (23.28%–44.48%), because vavr code is composed but not to a standard.

## What would change Run 3's conclusions

Only P1 can. A SEQUENCER rate of 0.00% would mean Run 3's central discriminator tracks a library
import, and the Run 3 results file would need its headline rewritten, not merely caveated. Any non-zero
rate leaves Run 3's conclusion standing with its existing caveat intact.

## Grading

The writeup quotes P1–P4 verbatim, grades each, publishes the full histogram, and states plainly that
N=1 supports no generalization.
