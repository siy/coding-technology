# Run 1 — the convergence experiment: results

**Executed 2026-08-23** against `CONVERGENCE-PREDICTIONS.md` (registered `84b7299`) using the metric
locked at `b68cb4f`. Both commits precede the existence of any implementation, which is checkable in git
history.

---

# Headline: the determinism claim is not supported. The distinctiveness claim is.

P5 registered a falsification condition and committed to publishing it as the headline if it triggered.
**It triggered.**

The methodology did **not** make independent implementers converge more than they already would. It
**did** produce a structure that idiomatic Java never produced, in any implementation, on two axes with
total separation. Those are different claims, and this run separates them.

---

## Data

Eight implementers, one specification, no shared context. Four given JBCT, four given "clean idiomatic
production-quality Java" of comparable instruction weight.

| | Methods | Files | LEAF | **SEQUENCER** | CONDITION | **UNCLASSIFIED** |
|---|---|---|---|---|---|---|
| t1 | 32 | 12 | 62.5% | **15.6%** | 15.6% | **0.0%** |
| t2 | 29 | 11 | 51.7% | **20.7%** | 17.2% | **0.0%** |
| t3 | 45 | 16 | 73.3% | **20.0%** | 6.7% | **0.0%** |
| t4 | 33 | 15 | 54.5% | **21.2%** | 15.2% | **0.0%** |
| c1 | 21 | 22 | 71.4% | **0.0%** | 4.8% | **19.0%** |
| c2 | 28 | 25 | 75.0% | **0.0%** | 3.6% | **17.9%** |
| c3 | 17 | 16 | 52.9% | **0.0%** | 5.9% | **35.3%** |
| c4 | 26 | 24 | 57.7% | **0.0%** | 3.8% | **38.5%** |

## Grading

> **P1 (primary).** Treatment within-arm shape convergence exceeds control within-arm shape convergence.

**MISS.** Nominally 73.89 against 69.22, a margin of **+4.66** — but it fails on both checks that matter:

- **It is inside the noise.** Pair-level spread is enormous: treatment pairs range 56.8–93.3, control
  pairs 55.9–92.9, pooled standard deviation **14.0**. A margin of 4.66 against a spread of 14 is not a
  signal at six pairs per arm.
- **It reverses when the contaminated implementation is removed.** t4 violated the protocol (below).
  Excluding it: **treatment 68.27 against control 69.22** — the control converges *more*.

> **P5 (falsification).** P1 is falsified if control convergence equals or exceeds treatment
> convergence. That outcome would mean the determinism claim is measuring the model, not the method, and
> it would be the most important negative result this programme could produce. **It gets published as
> the headline if it happens.**

**TRIGGERED**, on the clean subset. Published as the headline, as registered.

> **P2.** Treatment method-name overlap exceeds control method-name overlap.

**MISS, and strongly reversed.** Treatment **25.63%** against control **40.41%** — the control's naming
converges far more, and the gap (−14.78) is much larger than P1's.

The explanation is already in this project's own measurements. Idiomatic Java draws on a shared
industry vocabulary — `validate`, `save`, `findById`, `getX` — while JBCT implementations invent
domain-specific step interfaces and value objects, which vary freely (`FeeSchedule` against `Fee`;
`PermitPeriod`, `StartDate`, `Age`, `Weight` appearing in one implementation and not others). **The
naming census in JBCT 4.5.0 found exactly this**: enumerated verbs head roughly 1.4% of naming
contributions, and vocabulary is overwhelmingly domain terms no list could contain.

**So the methodology constrains structure tightly and vocabulary loosely — and this run measured the
loose half as looser than an unconstrained control.**

> **P3.** Every treatment implementation shows SEQUENCER > 0; control sits at or near 0.00%.

**HIT, with total separation.** Treatment **15.6%–21.2%**, control **0.0% in all four**. No overlap, no
exceptions, 4 against 4.

> **P4 (registered prior).** The control will converge more than the methodology's rhetoric implies; I
> expect a real but modest margin.

**HIT**, and it understated the case. The control did not merely converge modestly less — on the clean
subset it converged *more*.

## The second total separation, which was not predicted

**UNCLASSIFIED: treatment 0.0% in all four, control 17.9%–38.5% in all four.** Every method in every
JBCT implementation fell into a named structural pattern. Between a fifth and two fifths of every
control implementation did not.

This is Run 3's residual finding reproduced under controlled conditions: same specification, same model,
same day, one variable changed. Run 3 measured it across codebases that differ in everything; this
measures it with everything else held fixed.

## Protocol deviations, disclosed

**t4 was contaminated, and it is the reason P1 nominally passed.** It reported, unprompted, that it
**read the Pragmatica source** despite the instruction not to, and that it **ran a reviewer over its own
work**. That is more information and more iteration than the other three had. The sensitivity analysis
excluding it is therefore the primary result, not a footnote — and it reverses the headline.

Credit where due: t4 disclosed both deviations itself, including the reviewer suggestion it declined.
Undisclosed, this run would have reported a positive P1.

**t3 appeared stalled** during monitoring and produced no output for an extended period, then completed
normally. No deviation; recorded because an earlier status note said the arm might finish at n=3.

**The specification was underdetermined in two places** — whether the senior discount applies before or
after the second-vehicle surcharge, and the date age is computed against. **All eight implementations
independently chose the same reading** (discount the base, add the surcharge undiscounted; age at the
start date), and seven of eight flagged it as a guess. That is convergence on *behaviour*, in both arms,
before any methodology applies — and it is the clearest illustration of why P4 was registered.

## Confounds, as registered

1. **Instruction volume** remains the principal weakness. Treatment received a methodology; control
   received a style instruction of comparable length. This run cannot separate *this methodology* from
   *more constraint of any kind*. **Note that this confound would inflate P1 — and P1 still failed.**
   It does not explain away P3, which is a categorical difference rather than a degree of agreement.
2. **One model, one vendor, one specification, one domain.**
3. **Four per arm, six pairs per arm.** Directional at best, and P1's margin sits well inside the
   spread.
4. **Mutation fingerprints were out of scope** — eight compiling builds with dependencies resolved.

## What this changes

`book/from-process-to-patterns.md:251` asserts deterministic structure. **The first measurement of that
claim does not support it.** Independent implementers given the methodology did not agree with each
other more than independent implementers given none — and on naming they agreed considerably less.

What the run does establish is different and, on this evidence, better founded: **the methodology
produces a structure that unconstrained implementations do not produce at all.** SEQUENCER at 15.6–21.2%
against a flat 0.0%; UNCLASSIFIED at 0.0% against 17.9–38.5%. Distinctiveness, cleanly demonstrated;
determinism, not demonstrated.

The book should be read against this. "Deterministic structure" is the stronger and more marketable
claim, and it is the one that failed.

Claims-ledger row: *claim — the methodology produces deterministic structure; instrument — 8 independent
implementers, 1 spec, shape-histogram and name-overlap convergence, pre-registered with a locked metric;
result — **NOT SUPPORTED** (treatment 68.27 vs control 69.22 on the clean subset; naming reversed at
25.6% vs 40.4%); secondary result — **distinctiveness supported with total separation** on SEQUENCER and
UNCLASSIFIED; caveats — instruction-volume confound, n=4 per arm, one model, one domain.*
