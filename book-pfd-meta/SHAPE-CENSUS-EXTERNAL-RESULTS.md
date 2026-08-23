# Run 3 — external shape census: results

**Executed 2026-08-23** against `SHAPE-CENSUS-EXTERNAL-PREDICTIONS.md`, registered at commit `6b6f967`
before any external repository was cloned. Instrument: `jbct shape-census`, jbct-cli 1.0.0-rc3.

**Headline: the corpus objection is answered, an instrument defect was found, and the prediction the run
was built on was based on a misreading of the tool.**

---

## Data

Baseline — the author's JBCT codebases, measured before the external corpus was chosen:

| Codebase | Methods | LEAF | SEQUENCER | MIXED | Residual |
|---|---|---|---|---|---|
| jbct-loan | 880 | 73.40% | 8.64% | 0 | 10.91% |
| ticketing | 462 | 68.83% | 20.35% | 0 | 5.19% |
| jbct-realworld | 118 | 65.25% | 15.25% | 0 | 17.80% |

External — four qualifying repositories, no author contributions, no Pragmatica:

| Codebase | Methods | LEAF | SEQUENCER | MIXED | Residual |
|---|---|---|---|---|---|
| Apache Fineract | 18,769 | 52.39% | **0.17%** | 0 | 44.47% |
| Broadleaf Commerce | 15,384 | 62.64% | **0.00%** | 0 | 36.16% |
| OpenMRS | 7,312 | 61.27% | **0.03%** | 0 | 37.83% |
| Shopizer | 6,173 | 76.45% | **0.02%** | 0 | 23.28% |

**48,000 methods across 45,000 files of code nobody in this project wrote.** Zero parse errors.

**Excluded:** spring-petclinic, 30 main files, fails selection criterion 3 (≥100). Measured anyway and
reported separately, since P5 was specifically about it: 82 methods, LEAF 62.20%, SEQUENCER 0.00%,
residual 32.93%.

## Instrument defect: MIXED appears unreachable

`MIXED` is zero in all seven codebases. Before reading that as a finding, I tested whether the
classifier can emit it at all:

1. A deliberately maximal imperative method — nested branching, two loop forms, a switch, sequential
   statement composition, a ternary — classifies as **UNCLASSIFIED**.
2. A monadic chain that genuinely mixes Sequencer and Fork-Join (`.flatMap` chain containing a
   `Promise.all(...).map(...)`) classifies as **SEQUENCER**.

Those are the two things "mixed patterns" can mean, and neither produces MIXED.

**Consequence for the book, and it is not small.** *Basic Patterns* states *"each function implements
exactly one pattern; mixing patterns is the signal to split."* The census bucket that would detect a
violation of that rule does not fire. `shape-census` cannot currently find the defect the rule exists to
catch, and the baseline's "MIXED = 0 across 1,460 JBCT methods" was measuring the instrument, not the
code. Filed for jbct-cli.

## Grading

> **P1 (primary).** External codebases show a **non-zero MIXED rate**, and at least three of the four
> exceed **1%**.

**FALSIFIED — and uninformative.** All zero. But the design was built on a misreading of what MIXED
means in this tool, so the failure says nothing about external code. The registration argued MIXED was
the load-bearing prediction *because* it is a positive identification rather than a classification
failure. That reasoning was sound; it was applied to a bucket that never fires.

> **P2 (weak, and registered as weak).** External residual exceeds the JBCT range (5.19%–17.80%).

**HIT.** All four external sit at 23.28%–44.47%, entirely above the JBCT range. Registered as weak, and
the weakness is now confirmed rather than precautionary: the MIXED discovery shows the classifier's
blind spots are real, and `UNCLASSIFIED` on foreign code remains ambiguous between *no pattern* and
*tool cannot see it*.

> **P3.** External **LEAF share is lower** than the JBCT range, with the difference showing up as more
> SEQUENCER, CONDITION and MIXED.

**PARTIAL, and the stated mechanism is wrong.** Three of four fall below the JBCT range (Fineract
52.39%, OpenMRS 61.27%, Broadleaf 62.64%); **Shopizer at 76.45% sits above it**. And where LEAF is
lower, the difference goes almost entirely to **UNCLASSIFIED**, not to the composed patterns predicted.

> **P4 (Fineract, the domain match).** Fineract's distribution differs from jbct-loan's by more than
> jbct-loan differs from ticketing.

**HIT, and this is the run's most important result.** On (LEAF, SEQUENCER, residual), summed absolute
difference: **jbct-loan vs ticketing = 22.0**; **jbct-loan vs Fineract = 63.0**.

Two lending systems, same domain, differ nearly three times as much as two JBCT systems in *different*
domains. This was the designated collapse condition — if the vocabulary tracked domain rather than
methodology, the whole census would mean nothing. It does not.

> **P5 (registered prior).** I expect **spring-petclinic to be the closest to JBCT's profile**.

**MISS, in the methodology's favour.** Petclinic sits squarely in the external band (residual 32.93%,
SEQUENCER 0.00%), not the JBCT one. A canonical, deliberately clean Spring sample does not resemble
JBCT — so "leaf-dominant with composed patterns" is not simply a description of *careful Java*.

## The signal, which is not the one I predicted

**SEQUENCER.** JBCT 8.64%–20.35% against external **0.00%–0.17%** — a difference of two to three orders
of magnitude, with no overlap and 48,000 external methods behind it. Like MIXED, SEQUENCER is a positive
identification rather than a classification failure, which is exactly the property that made MIXED the
intended primary.

**The confound, stated plainly.** SEQUENCER detection keys on monadic chains, which is a Pragmatica
idiom. A large part of this gap is "these codebases do not use this library". The finding is *not* that
external teams could not express sequencing; it is that they do not express it as a **named composition
the tool can see**, which is a claim about visible structure and not about capability. Anyone citing
this number owes that sentence alongside it.

**Update 2026-08-23 — the confound is now bounded (Run 6).** `jbct shape-census` was run against
`ddd-by-examples/library`, a vavr-composed Java codebase, and SEQUENCER fired at **1.35%** — roughly 8x
the top of the external band and 6x below the bottom of the JBCT band. The detector recognises
`Either`/`Try` chains it was never written for, so it is not detecting `org.pragmatica` imports. The
remaining JBCT-versus-vavr gap is the difference between a methodology that *mandates* composition and a
library that *permits* it. See `COMPOSITION-DETECTION-GENERALITY-RESULTS.md`; N=1, so the confound is
bounded rather than eliminated.

## Standing

**The corpus objection is materially weakened.** "Every corpus is the author's" has appeared in three
prior measurements. There is now an external base rate over 48,000 methods of business Java, obtained
without a volunteer or a collaboration, and it is reproducible by anyone with the CLI.

What it establishes: JBCT's shape distribution is **distinguishable** from business Java at large, and
the distinction survives a same-domain comparison (P4). What it does not establish: that the
distribution is *better*. That argument lives in the books and is untouched by this run.

Claims-ledger row: *claim — JBCT produces a distinctive structural distribution; instrument —
`jbct shape-census` over four external business-Java codebases (48k methods) against three JBCT
codebases (1.5k); result — **distinguishable, on SEQUENCER and residual, and it survives a same-domain
control**; caveats — SEQUENCER is confounded with library choice, UNCLASSIFIED is ambiguous on foreign
code, MIXED is unreachable in the current tool, and the JBCT baseline is the author's own.*

---

# Correction — re-measured after the MIXED fix (2026-08-23)

jbct-cli shipped the fix for `../oss/internal/jbct-cli-mixed-shape-bug.md`. All five acceptance
criteria pass, and the corpus was re-measured. **Two corrections to the record above.**

## Correction 1 — the JBCT baseline root set was inconsistent

The original baseline used `find -name main -path '*/src/*'`, which selects `src/main` (resources
included) and, for the multi-module `jbct-realworld`, was additionally truncated by a `head -5` that
silently dropped three modules. The external corpus used `*/src/main/java`. **The two halves of the
comparison were not measured over the same roots**, which I did not notice at the time.

Everything below re-measures all seven codebases with the external corpus's script and root pattern.
`jbct-realworld` moves from 118 methods to 217; the other two are unchanged.

## Corrected table

| Codebase | Methods | LEAF | SEQUENCER | **MIXED** | Residual |
|---|---|---|---|---|---|
| jbct-loan | 880 | 73.41% | 8.30% | **3 (0.34%)** | 11.25% |
| ticketing | 462 | 68.83% | 20.35% | 0 | 5.19% |
| jbct-realworld | 217 | 62.21% | 13.36% | 0 | 20.28% |
| Apache Fineract | 18,769 | 52.39% | 0.17% | **1 (0.005%)** | 44.48% |
| Broadleaf | 15,384 | 62.64% | 0.00% | 0 | 36.16% |
| OpenMRS | 7,312 | 61.27% | 0.03% | 0 | 37.83% |
| Shopizer | 6,173 | 76.45% | 0.02% | 0 | 23.28% |

## Correction 2 — MIXED is now live, and it found three violations in the author's own code

`jbct-loan` reports **MIXED = 3**, with SEQUENCER falling 76 → 73: exactly three methods reclassified.
All three are in `jbct-slice` (498 methods, 0.60%), and `jbct lint` locates them:

- `ProcessRepayment.java:503` — JBCT-LAM-03, ternary in lambda
- `ProcessRepayment.java:550` — JBCT-LAM-03, ternary in lambda
- `LoanAmount.java:19` — JBCT-PAT-02, Fork-Join nested inside a Sequencer chain

**This is the fourth instrument aimed at `jbct-loan` and the fourth to find real defects in it** — after
the grammar-based naming census, the PIT mutation run, and the composition-obligation reading. The
prediction in the bug report's closing note ("a non-zero result on the author's own code is a live
possibility and would be the point of fixing this") holds.

## Correction 3 — my attribution of the three MIXED methods was wrong (2026-08-23)

Correction 2 above named the three MIXED methods as `ProcessRepayment.java:503`, `:550` and
`LoanAmount.java:19`. **That was inferred from `jbct lint` output, not verified per file, and it was
wrong.** Verified by measuring each file individually, the three were:

| File | Why |
|---|---|
| `LoanAmount.java` | PAT-02 — Fork-Join nested in a Sequencer |
| `ProcessRepayment.java` | a **NEST-01** site — an inner chain inside an adapter-leaf lambda |
| `EvaluateCredit.java` | the same NEST-01 shape |

The two ternaries at `:503` and `:550` were genuine **LAM-03** violations but were **not** counted as
MIXED. `EvaluateCredit.java` was never on the list and was MIXED all along.

**This also falsifies the clean rule stated below.** MIXED does *not* track PAT-02 and LAM-03 while
ignoring NEST-01. It fires on **different-pattern mixing wherever it occurs**, which includes a subset
of NEST-01 sites — the ones where the nested chain is a different pattern rather than more of the same.
`jbct-realworld`'s six NEST-01 warnings produce zero MIXED because they are same-pattern nesting; two of
`jbct-loan`'s do produce MIXED because they are not. Two data points had suggested a rule that a third
disproved.

**The lesson is the one this programme keeps relearning:** an attribution inferred from a neighbouring
instrument is a hypothesis, not a measurement. Verifying it cost one per-file scan.

## All five are now fixed and MIXED is zero

`jbct-loan` reports **MIXED = 0** across both modules (884 methods), with **734 tests passing**. Five
sites were changed — the three originally reported plus the two the correction uncovered:

1. `LoanAmount.loanAmount` — Fork-Join extracted to `validateWithinLimits`
2. `ProcessRepayment.verifyNotExceeding` — ternary replaced by `isLessThanOrEqualTo(...).filter(cause, Boolean::booleanValue)`
3. `ProcessRepayment.determineRegularPaymentStatus` — ternary extracted to `statusForPaymentSize`
4. `ProcessRepayment.loanAccountStep` — inner chain extracted to `toAccountOrNotFound`
5. `EvaluateCredit.creditBureauStep` — inner chain extracted to `toReportOrMalformed`

16 `JBCT-NEST-01` warnings remain in `jbct-slice`. All are same-pattern nesting, none is MIXED, and they
are a single-level-of-abstraction matter rather than a pattern-mixing one.

## What the fix does and does not count

MIXED tracks **different-pattern mixing**, not same-pattern nesting, and the corpus demonstrates the
distinction cleanly:

- `jbct-realworld` carries **6 JBCT-NEST-01** warnings and **zero** PAT-02 or LAM-03 → **MIXED = 0**.
- `jbct-loan` carries PAT-02 and LAM-03 → **MIXED = 3**.

That is the right call and it is stricter than the acceptance criterion I wrote. AC4 named NEST-01
alongside PAT-02 and LAM-03; a Sequencer nested inside a Sequencer is a single-level-of-abstraction
violation but **is still one pattern**, so it should not be MIXED. **The implementation is more precise
than my criterion**, and the criterion is what was imprecise.

## Effect on the run's conclusions: none

Every conclusion in the run above survives.

- **P1** was falsified and is *still* falsified, now for a real reason rather than an instrument
  artifact: external MIXED is 0.00%–0.005% against a predicted >1%. External code has essentially no
  monadic chains (SEQUENCER 0.00%–0.17%), so there is nothing to mix. The bug report predicted exactly
  this — *"Run 3's external comparison is unaffected"* — and it is.
- **P4**, the load-bearing result, is unaffected: the JBCT/external separation still rests on SEQUENCER
  and residual, and the same-domain control (Fineract vs jbct-loan) still holds.
- **MIXED remains unusable as a discriminator between JBCT and non-JBCT code**, for the structural
  reason that non-JBCT code has no chains. Its value is as a **conformance metric within JBCT code**,
  which is what it now delivers.
