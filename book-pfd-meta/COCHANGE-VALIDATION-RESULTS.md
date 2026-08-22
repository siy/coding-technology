# Run 2 — co-change validation: results

**Executed 2026-08-22** against the predictions registered in
`COCHANGE-VALIDATION-PREDICTIONS.md`. Predictions are quoted verbatim below and graded hit / partial /
miss / inconclusive, per protocol.

**Headline: the run under-executed, and P1 is not supported by the one repository that resolved.**
Two protocol deviations and one implementation defect are disclosed in full below. The honest summary is
that this is a failed run with an instructive failure mode, not a result about the methodology.

---

## Protocol deviations

**D1 — N=3, not 5.** Seventeen repositories were screened; three met the pre-registered criteria.
Screened and rejected: pytest, celery, sqlalchemy, flask, tornado, aiohttp, numpy, django, sklearn,
matplotlib, twisted, rails, symfony, ansible, home-assistant. Qualifying: **scrapy** (`scrapy/contrib`
dissolved into function-named packages, 2015-04), **pandas** (`CLN: move top-level dirs`, 2017-04),
**ipython** (The Big Split, `IPython.html` → `jupyter_notebook`, 2015-03/04).

The rejection reason is itself the most robust finding of the run. **Large rename events in mature open
source are overwhelmingly test relocations, documentation moves, CI changes, and `src/` layout
migrations — not judgments about where domain boundaries belong.** The criterion that excludes
framework and build-system migrations excludes most of what actually happens. django's biggest event is
moving contrib tests out of contrib; twisted's is the move to `src/`; sklearn's and matplotlib's are CI
and docs. ansible's collections migration and home-assistant's integration restructure do not survive
rename detection at all, because the files left for other repositories or were rewritten rather than
moved.

**D2 — the bootstrap confidence interval in P2 is not evaluable.** It is defined over repositories, and
one repository resolved.

## Implementation defect, found during execution

The rename map was extracted with `git log --format=C`, which is **not a valid pretty format**. Git
exited non-zero and wrote to stderr, which the helper discarded, so the map was silently empty for every
repository. With an empty map, post-restructure module equals pre-restructure module by construction,
and every pair reports "not co-located". The first run therefore produced a clean-looking `0/0` that was
entirely an artifact.

It was caught by asking why *both* the qualifying rate and the base rate were exactly zero, which is the
kind of too-tidy number worth interrogating. The helper now raises on non-zero exit instead of returning
empty output, and all numbers below are post-fix.

**This is the second time in this project that a plausible measured result turned out to be an artifact
of how the measurement was built** — the first was classifying mutants by class name. The pattern is the
same: the analysis code ran, produced numbers, and the numbers were wrong. Neither was caught by a test.

## Results

| Repo | Status | Cross pairs | Qualifying | Same-module | Base rate | P1 ratio |
|---|---|---|---|---|---|---|
| scrapy | INCONCLUSIVE | 17 (< 30) | — | — | — | — |
| ipython | INCONCLUSIVE | 21 (< 30) | — | — | — | — |
| pandas | resolved | 1058 | 102 | **0** | 8/102 = 7.84% | **0.0** |

pandas: 211 of 300 pre-window commits touched source and survived the 50-file cap.

Cadence, pandas: divergent-cadence pairs (≥10× frequency difference), n=21, same-module rate **9.52%**;
convergent-cadence pairs (<2× difference), n=440, same-module rate **2.05%**. Base rate 7.84%.

## Grading

> **P1 (primary).** Qualifying pairs land in the same post-restructure module at **at least twice** the
> base rate.

**MISS.** Measured ratio **0.0** against a predicted ≥2.0. Top-decile coupled cross-boundary pairs
co-located at 0% while matched random cross-boundary pairs co-located at 7.84% — the coupled pairs did
*worse* than chance. Fisher exact on 0/102 versus 8/102 gives p ≈ 0.007, so the difference is not noise
within this repository.

> **P2 (falsification condition).** P1 is **falsified** if the ratio is at or below 1.2x, or if a
> bootstrap confidence interval over repositories includes 1.0.

**Falsification threshold met** on the ratio (0.0 ≤ 1.2). The bootstrap half is **not evaluable** at
N=1 (deviation D2). Per the registration, this is written up as the result and not as a methodology
problem.

> **P3 (cadence — sufficiency).** File pairs whose individual change frequencies differ by an order of
> magnitude or more land in **different** post-restructure modules at above the base rate.

**MISS.** Divergent-cadence pairs co-located at 9.52%, *above* the 7.84% base rate. The prediction
required below.

> **P4 (cadence — not necessity).** File pairs with *similar* change frequency show **no** signal in
> either direction — an effect within 1.2x of the base rate.

**MISS.** Convergent-cadence pairs co-located at 2.05%, a ratio of 0.26 against base — far outside the
registered null band, and in the negative direction. Registered in advance: *"If P4 shows a strong
effect, the refinement is wrong and the dev.to article's original phrasing was closer."* On this single
repository, P4 showed a strong effect.

> **P5 (registered revision of a prior).** I expect **at least one repository to fail P1 outright**, and
> I expect it to be one whose restructure was organizationally driven.

**Partial hit.** A repository did fail P1 outright. The second clause is wrong: pandas' restructure was
a namespace reorganization, not an organizational split. The repository I expected to fail on
organizational grounds — ipython, whose Big Split separated the Jupyter project from IPython — never
resolved.

## The confound that makes even the pandas number a weak test

Top-decile coupling is dominated by **high-churn files**. The pandas restructure relocated *low-churn
peripheral packages* (`pandas/computation`, `pandas/sparse`) underneath `pandas/core`; it did not move
`pandas/core/frame.py` and its neighbours, which are exactly the files the coupling metric ranks
highest. So the qualifying pairs are largely pairs of files the restructure never touched, and their 0%
co-location rate is close to a foregone conclusion.

**The metric therefore measures "did this restructure move the highest-churn files together", which is
not the hypothesis.** The hypothesis is about whether coupling that crosses a boundary predicts where
the boundary should have been.

## What the design got wrong, for a re-registration

1. **300 commits is too small.** In scrapy, 300 commits yielded 99 source-touching commits, 98 distinct
   files and 34 files touched more than once — not enough pairs to clear the threshold. The window
   should be defined in source-touching commits, or in files-with-≥2-changes, not in raw commits.
2. **The outcome variable is too sparse.** "Both files land in the same post-restructure module"
   requires the restructure to have merged those two specific modules. A better outcome: the *change in
   the fraction of top-decile coupling that crosses a boundary*, before versus after — which counts
   every relocation's effect rather than only merges.
3. **Churn must be controlled, not just matched on.** Stratify qualifying pairs by whether the
   restructure touched either file; a pair neither file of which moved carries no information.
4. **Consolidating and splitting restructures need separating.** The hypothesis as written assumes the
   restructure *gathers* coupled things. For a split (ipython), the fix is separating things that were
   not coupled, and P1's direction inverts.

## Standing

**P1 is untested, not refuted.** One repository resolved, its result is confounded by churn, and the
design has four identified defects. Nothing here should be cited as evidence for or against
change-driver decomposition.

The claims-ledger row for this run reads: *claim — units sharing a change driver change together;
instrument — co-change over a documented restructure; result — **run failed, design defective, claim
untested**; caveat — see the four design defects above.*

---

# Addendum — detector v2 and re-screen (2026-08-22)

Run 2's selection used git rename detection, which missed restructures outright. Detector v2
(`cochange-detect2.py`) tracks **directory membership by basename across tree snapshots** instead, and
filters test/doc/CI/tooling paths *before* detection, so the criteria are applied by the instrument
rather than by hand afterwards.

## The two detectors have complementary blind spots

Neither is a superset of the other, which was not anticipated.

- **Rename-based** misses files rewritten as they moved, removed-and-re-added, or moved to another
  repository. It missed ansible's collections migration and home-assistant's restructure entirely.
- **Basename-based** misses restructures that leave **backward-compatibility shims**, because the old
  path keeps a file of the same name and the basename is no longer unique. It missed scrapy's `contrib`
  dissolution — the very restructure the first detector found — for exactly that reason.

**A re-registered Run 2 must screen with the union of both.**

## New candidates surfaced

| Repo | Window | Event | Assessment |
|---|---|---|---|
| **rails** | 2013-06..10 | `actionpack/lib` → `actionview/lib`, 83 files | **Strongest candidate found.** ActionView extracted from ActionPack: documented, domain-driven, a true split |
| **ipython** | 2009-03..07 | flat `IPython` → `core` / `utils` / `deathrow` / `quarantine` | genuine re-partition of a flat package |
| sklearn | 2011-08..12 | `scikits/learn` → `sklearn/*` | needs depth-3 re-assessment; may be a namespace rename |
| ansible | 2015 | `plugins/inventory` → `contrib/inventory` | borderline; the `v2/ansible` half is a version migration |

Rejected on inspection: numpy (`core` → `_core`), matplotlib (vendored `agg24` relocation), twisted and
pytest (both `src/` layout), symfony and home-assistant (nothing over threshold).

## Two criteria the study still lacks

**C1 — the restructure must re-partition.** `numpy/core` → `numpy/_core` moved 261 files and qualifies
under every criterion as written, while carrying **zero information for the metric**: a wholesale
directory rename maps one module to one module, so every cross-boundary pair stays cross-boundary with
relabelled endpoints. The criteria must require that the restructure maps one source module to two or
more targets, or two or more sources to one target.

**C2 — module depth is per-repository.** Fixed `depth=2` is wrong wherever the package root is not at
depth 1. For sklearn's pre-rename `scikits/learn/svm/foo.py`, depth 2 collapses every file into one
module and manufactures an apparent re-partition that is really a top-level rename. Depth must be set
from where the repository's package root sits.

## Is Run 2 salvageable

Plausibly. The candidate pool goes from 3 to about 5 with rails as the strongest addition, and rails is
the first candidate whose restructure is both well documented and a genuine split.

**The binding constraint is unchanged and unsolved: co-change density.** scrapy produced 17 cross-
boundary pairs and ipython 21, against a threshold of 30, and that is a property of the pre-window
definition rather than of the detector. C1 and C2 above, plus the four defects recorded earlier, are all
prerequisites to a re-registration — six fixes in total, of which execution has now demonstrated five.
