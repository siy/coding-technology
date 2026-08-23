# Pre-registered predictions — Run 2b, co-change validation (re-registration)

**Registered 2026-08-23, BEFORE any repository was re-screened under the corrected criteria and before
any metric was recomputed.** Supersedes `COCHANGE-VALIDATION-PREDICTIONS.md`, whose run failed. The
first attempt's results stand as published in `COCHANGE-VALIDATION-RESULTS.md`; nothing here reuses its
numbers.

**Why there is a v2 at all:** the v1 design had six defects, five of which only execution revealed. They
are listed below with the fix each one forces, so a reader can check that this registration is a repair
rather than a retune.

---

## The six defects and their fixes

| # | v1 defect | v2 fix |
|---|---|---|
| D1 | 300-commit window too small (scrapy: 34 recurring files) | window defined in **source-touching commits**, not raw commits |
| D2 | outcome too sparse — "same post-module" needs those two modules merged | outcome is the **change in cross-boundary coupling fraction**, before vs after |
| D3 | churn only matched on, not controlled | pairs **stratified** by whether the restructure touched either file |
| D4 | consolidating and splitting restructures invert P1's direction | the two are **separated and predicted separately** |
| D5 | rename detection misses restructures | screen with the **union of both detectors** |
| D6 | wholesale renames qualify but carry no information | restructure must **re-partition** (see C1) |

## Corrected selection criteria

All of v1's criteria, plus:

**C1 — the restructure must re-partition.** It must map one source module to two or more targets, or two
or more sources to one target. A wholesale directory rename (`numpy/core` → `numpy/_core`, 261 files)
satisfies every other criterion and carries zero information, because every cross-boundary pair stays
cross-boundary with relabelled endpoints.

**C2 — module depth is set per repository**, from where the package root actually sits. Fixed depth 2
collapsed `scikits/learn/svm/foo.py` into one module and manufactured an apparent re-partition that was
a top-level rename.

**C3 — screen with both detectors.** Rename-based misses rewrites, delete-and-re-add, and cross-repo
moves. Basename-based misses restructures that leave compatibility shims. Neither is a superset;
scrapy is visible only to the first, ansible only to the second.

## Metric

For each qualifying repository, over the pre-window and an equal post-window:

- **Coupling** as in v1: shared commits over the geometric mean of individual change counts.
- **Cross-boundary fraction `X`** — of the top decile of coupled pairs, the share whose two files sit in
  different modules.
- **Outcome — `ΔX = X_after − X_before`.** A restructure that gathered coupled things together lowers it.

This replaces the sparse binary outcome and uses every relocation rather than only module merges.

**Stratification (D3).** `ΔX` is computed twice: over all pairs, and over **touched pairs only** — pairs
where the restructure moved at least one file. A pair neither file of which moved carries no
information, and v1's headline number was dominated by exactly those.

## Predictions

**P1 (consolidating restructures).** For restructures that gather — several sources into one target —
`ΔX` is **negative**: cross-boundary coupling falls.

**P2 (splitting restructures).** For restructures that divide one source into several, `ΔX` is
**not predicted to fall**, and may rise. Registered as a **separate** prediction because v1 assumed all
restructures gather, and ipython's Big Split does the opposite.

**P3 (the stratified test — the real one).** The effect is **larger among touched pairs than among all
pairs**. If moving files did not change their coupling profile more than not moving them did, the
measurement is picking up drift rather than the restructure.

**P4 (falsification).** P1 is falsified if `ΔX ≥ 0` for a majority of consolidating repositories, or if
a bootstrap interval over repositories includes zero.

**P5 (no numeric threshold is registered).** v1 registered a 2× threshold with no pilot and it was
meaningless. **v2 registers directions only.** Effect sizes are reported as measured. Where a threshold
is genuinely needed, it will be set from a **pilot on one repository that is then excluded from the
test set** — and the pilot repository is named in this file before the pilot runs.

**P6 (registered prior).** I expect the corpus to remain the binding constraint, not the metric. v1
screened 17 repositories and qualified 3. I expect the corrected criteria to yield **more candidates but
not many more** — my prior is 5 to 8 — and I expect at least one to fail C1 on inspection after passing
the detectors.

## Pilot

**rails (ActionView extracted from ActionPack, 2013)** is the pilot repository. It is the strongest
candidate the re-screen found — documented, domain-driven, a genuine split — and it is therefore
**excluded from the test set**. Calibrating on the best case and testing on the rest is the conservative
direction.

## Scope caveats

v1's four caveats carry over unchanged: a restructure is human judgment and not ground truth; co-change
proxies a driver rather than being one; documented restructures bias toward deliberate teams, which
biases the result upward; and this tests PFD's backward method only.

One is added. **This is the second registration of the same hypothesis.** A second attempt after seeing
the first fail is a researcher-degrees-of-freedom risk, and the defect table above is the only defence:
every change is traceable to a failure mode execution exposed, not to a result I wanted.

## Grading

The writeup quotes P1–P6 verbatim, grades each, publishes the per-repository table including failures
and the pilot's calibration, and writes one claims-ledger row.
