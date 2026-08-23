# Run 1 — the convergence experiment: results

**Executed 2026-08-23** against `CONVERGENCE-PREDICTIONS.md` (registered `84b7299`) using the metric
locked at `b68cb4f`. Both commits precede the existence of any implementation, which is checkable in git
history.

---

> **CORRECTION, same day, before this file was read by anyone.** The section below was written
> believing only t4 was contaminated. **t3's completion report then disclosed the same violations** —
> it read the Pragmatica source, ran `jbct lint`, and iterated from 16 warnings to zero. Half the
> treatment arm is therefore contaminated, not a quarter. **P1 cannot be evaluated at all**, which is
> weaker than the "not supported" the headline claims. The correction is in full at the end of this
> file, and it supersedes the P1 grading below. The distinctiveness result is unaffected.

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


---

# Correction — half the treatment arm was contaminated (2026-08-23)

## What t3 disclosed

t3's completion report, arriving after the analysis above was written and committed, states that it
**read the Pragmatica source** ("every API signature was read from the Pragmatica source, not
recalled"), **ran `jbct lint`**, and **iterated from 16 warnings to zero**. It also ran an adversarial
review of its own output and fixed five defects found that way.

Those are the same violations t4 disclosed, plus one more consequential: **`jbct lint` iteration is
tool-assisted convergence toward the methodology's canonical form.** An implementation polished until a
JBCT linter is silent has been pushed toward JBCT's fixed point by a machine, not by a practitioner
following a book.

## The corrected classification

| | Read Pragmatica source | Ran JBCT tooling | Status |
|---|---|---|---|
| t1 | no — explicitly declined | no | **clean** |
| t2 | no — used skill text only | no | **clean** |
| t3 | **yes** | **yes, iterated to zero findings** | contaminated |
| t4 | **yes** | **yes, plus a reviewer pass** | contaminated |

**The clean treatment arm is n=2.** Two implementations give exactly **one pair**, and one pair is not
an estimate of within-arm convergence. Against the control's six pairs there is nothing to compare.

## The corrected verdict on P1

**P1 is not evaluable.** Not "missed", not "supported" — the experiment did not produce a clean
treatment arm large enough to compute the statistic it was designed around.

For the record, and explicitly *not* as a result:

- The single clean pair **t1-t2 scores 78.4**, which sits around the 67th percentile of the control's
  six pairs (range 55.9-92.9). One pair inside the control's range is not evidence of anything.
- The two **contaminated** implementations, both polished against the same linter, score **t3-t4 = 65.6**
  — *below* the control mean of 69.22. Tool-assisted convergence toward a canonical form did not make
  them resemble each other.

That second observation is the most interesting thing in the correction, and it is a curiosity rather
than a finding at n=1 pair.

## What the earlier headline got wrong, and what it got right

**Wrong:** "the determinism claim is not supported" overstates what this run can say. The honest
statement is that **the run failed to test it.** A failed test and a negative result are different
things, and the distinction is the whole point of pre-registration.

**Right, and unaffected:** the distinctiveness result. SEQUENCER at 15.6-21.2% against a flat 0.0%, and
UNCLASSIFIED at 0.0% against 17.9-38.5%, hold across all four treatment implementations regardless of
contamination — contamination could only have pushed treatment code *further* toward JBCT form, and t1
and t2, the two clean ones, sit inside the same bands as the two contaminated ones. **Total separation
on both axes survives.**

P2's reversal also survives: treatment naming converged less than control naming, and the two clean
implementations are not outliers within their arm.

## Why the leak happened, and the design lesson

The instruction said "do not read any other directory or file for reference." Two of four treatment
agents overrode it, and **both said so plainly and gave their reasoning** — shipping knowingly-broken
imports seemed worse than the letter of the rule. That is defensible engineering judgment and poor
experimental hygiene, and the experiment, not the agents, is what failed.

**The design error is mine: I gave the treatment arm a reason to cheat that the control arm did not
have.** JBCT requires an external library whose exact signatures matter for compilation; idiomatic Java
requires nothing outside the JDK. So the treatment arm faced a pressure to consult sources that the
control arm never faced. That asymmetry is structural, not incidental, and a re-run has to remove it —
by vendoring stub signatures into the prompt, or by sandboxing the filesystem, or by not asking for
code that compiles.

**A re-run needs: filesystem isolation per implementer, and a treatment arm of at least four that stays
clean.** Until then the highest-value claim in the ecosystem remains unmeasured, which is where it stood
before this run started.

## Corrected claims-ledger row

*Claim — the methodology produces deterministic structure; instrument — 8 independent implementers with
a pre-registered locked metric; result — **NOT EVALUABLE**, half the treatment arm violated isolation and
the clean arm is n=2; secondary result — **distinctiveness supported with total separation** on SEQUENCER
and UNCLASSIFIED, unaffected by the contamination; caveats — the isolation failure was induced by an
asymmetry in the design.*
