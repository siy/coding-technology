# Run 1b — convergence re-run with isolation: results

**Executed 2026-08-23** against `CONVERGENCE-RERUN-PREDICTIONS.md` (registered `62471e8`), using the
metric locked at `b68cb4f` and the contamination ruling committed at `94e9f7f` — all three before any
implementation existed or was measured.

---

# Headline: the determinism claim is falsified.

Run 1 could not test it; the treatment arm leaked and P1 was **not evaluable**. This run fixed the
isolation defect, and the test ran cleanly.

**P5 registered a falsification condition and committed to publishing it as the headline. It triggered,
on clean data, at n=5 per arm.**

Independent implementers given the methodology converged **no more than** independent implementers given
none — a margin of **−0.05** on a 100-point scale. Not "slightly less". Indistinguishable.

---

## Isolation held

All ten implementers answered the mandatory disclosure. **`READ_OUTSIDE_PROMPT: no` — all ten.**
`RAN_TOOLS: no` for nine; c4's `yes` is the file-writing case covered by the ruling at `94e9f7f`, and
excluding c4 moves control convergence *up* to 78.40, which widens P1's failure rather than narrowing
it.

Vendoring the signature appendix worked. Two implementers reported explicitly that where a signature was
missing they used plain Java rather than guessing or searching — the legal move Run 1 never offered.

## Data

| | Methods | LEAF | **SEQUENCER** | CONDITION | **UNCLASSIFIED** |
|---|---|---|---|---|---|
| t1 | 60 | 75.0% | **5.0%** | 11.7% | **1.7%** |
| t2 | 58 | 79.3% | **6.9%** | 5.2% | **0.0%** |
| t3 | 43 | 67.4% | **18.6%** | 7.0% | **0.0%** |
| t4 | 39 | 64.1% | **20.5%** | 7.7% | **0.0%** |
| t5 | 39 | 64.1% | **17.9%** | 7.7% | **0.0%** |
| c1 | 27 | 66.7% | **0.0%** | 3.7% | **25.9%** |
| c2 | 31 | 64.5% | **0.0%** | 3.2% | **32.3%** |
| c3 | 26 | 53.8% | **0.0%** | 3.8% | **42.3%** |
| c4 | 26 | 73.1% | **0.0%** | 3.8% | **19.2%** |
| c5 | 26 | 69.2% | **0.0%** | 3.8% | **23.1%** |

| | Shape convergence | Name overlap |
|---|---|---|
| Treatment | **77.66** (sd 12.0) | **21.05%** (sd 3.0) |
| Control | **77.71** (sd 13.5) | **41.21%** (sd 7.0) |

## Grading

> **P1 (primary).** Treatment within-arm shape convergence exceeds control within-arm shape convergence.

**MISS.** 77.66 against 77.71, margin **−0.05**, pooled sd 12.4. The two arms are the same to within a
twentieth of a point on a scale where pair-level noise is twelve points.

> **P5 (falsification).** P1 is falsified if control convergence equals or exceeds treatment
> convergence. **It gets published as the headline if it happens.**

**TRIGGERED**, on a clean isolated arm. Published as the headline, as registered.

> **P2.** Treatment method-name overlap exceeds control method-name overlap, by a margin smaller than
> P1's.

**MISS, reversed, and now replicated.** Treatment **21.05%** against control **41.21%** — the control
converges at nearly twice the rate.

Run 1 measured 25.6% against 40.4%. Run 1b measures 21.1% against 41.2%. **Two independent runs, the
same reversal, near-identical numbers.** The registration stated in advance that a second reversal
"should be treated as the finding rather than as noise". It is the finding: **the methodology makes
naming diverge relative to unconstrained Java**, because idiomatic Java draws on a shared industry
vocabulary while JBCT implementations invent domain-specific step interfaces and value objects. This is
the naming census (JBCT 4.5.0) appearing from the other direction.

> **P3.** Every treatment implementation shows SEQUENCER > 0; control sits at or near 0.00%.

**HIT, total separation.** Treatment 5.0%–20.5%, control **0.0% in all five**.

> **P4 (registered prior).** The control will converge more than the methodology's rhetoric implies; a
> real but modest margin.

**HIT, emphatically.** There is no margin at all.

## The second total separation, replicated

**UNCLASSIFIED: treatment 0.0%–1.7%, control 19.2%–42.3%.** No overlap. Run 1 measured 0.0% against
17.9%–38.5%. Two runs, same result.

Every method in every JBCT implementation falls into a named structural pattern. Between a fifth and two
fifths of every control implementation does not.

## The evidence against determinism inside the treatment arm

The treatment arm's own SEQUENCER rates run **5.0%, 6.9%, 17.9%, 18.6%, 20.5%** — a **four-fold spread**
between the least and most compositional implementation, from one specification and one methodology.
Two implementations sit closer to the vavr codebase measured in Run 6 (1.35%) than to their own arm's
top.

**The methodology does not fix how much of a solution is composition.** That is a property of the
implementer, not of the method, and it is visible without any comparison to the control.

## What the confound does to this result

The registered principal confound — the treatment prompt carries a signature appendix the control does
not need — **biases P1 upward**. The treatment arm received more constraint, more specificity, and more
text. It still did not converge more.

**A confound that should have inflated the result, and the result was still null.** The true effect may
well be negative.

## What this means for the books

`book/from-process-to-patterns.md:251` asserts deterministic structure. **Two runs have now tested it,
one blocked by an isolation defect and one clean, and the clean one falsifies it.** Independent
implementers given JBCT agree with each other no more than implementers given nothing — and on
vocabulary they agree considerably less.

**What survives, and is now replicated across two runs and four external codebases:** the methodology
produces a structure that unconstrained Java does not produce at all. SEQUENCER against a flat zero;
UNCLASSIFIED against a fifth to two fifths. Run 3 measured this across codebases differing in
everything, Run 6 bounded the library confound, and Runs 1 and 1b reproduce it with everything else held
fixed.

**Distinctiveness is well evidenced. Determinism is falsified. The book currently claims the second.**

## Limits

1. One model, one vendor, one specification, one domain.
2. Five per arm, ten pairs per arm. The margin is null rather than small, which needs less power than
   detecting a small effect would — but a larger effect at higher n cannot be excluded.
3. Mutation fingerprints out of scope.
4. Shape-histogram convergence is one operationalisation of "deterministic structure". A different
   operationalisation might behave differently, and this run tests the one that was registered.

Claims-ledger row: *claim — the methodology produces deterministic structure; instrument — 10 isolated
implementers, 1 spec, pre-registered predictions and a pre-locked metric, disclosure-verified isolation;
result — **FALSIFIED** (treatment 77.66 vs control 77.71; naming reversed 21.1% vs 41.2%, replicating
Run 1); secondary result — **distinctiveness supported with total separation on two axes, replicated**;
caveats — one model, one domain, n=5 per arm, and the principal confound biased the failed prediction
upward.*
