# Pre-registered predictions — co-change validation of change-driver decomposition

**Registered 2026-08-22, BEFORE any repository was selected, cloned, or measured.** Nothing in this
document was written with data in hand. The writeup must quote every prediction verbatim and grade it,
hit or miss. (Protocol from `book-arch-meta/BLIND-DERIVATION-PREDICTIONS.md`, where a pre-registered
prediction was wrong and the derivation was right — the miss is the point.)

This is **Run 2** of the six runs in `PLANNED-CHANGES.md` item 18.

---

## The claim under test

*Process-First Design* asserts that units governed by one change driver change together, and that
boundaries drawn by driver attribution predict independence. The book argues it; nothing measures it.
`appendix-worksheet.md` names the backward method — *version-control history records how the system
actually changed; files changing together in the same commits share a driver* — and that is the
instrument this run uses against the claim that produced it.

## Why a restructure, and not a snapshot

Measuring co-change against a system's current boundaries is circular: the current structure forces some
co-change, so any agreement is partly an artifact of the layout. The worksheet already states the
correction — **measure the co-change that crosses a boundary, and trust the coupling that survives a
known restructure.**

This run operationalizes that correction as the whole design. A documented restructure is a natural
experiment: an intervention, performed by people who were not testing this methodology, at a known time.

- Co-change **inside** a pre-restructure boundary is endogenous and is **discarded**.
- Co-change **crossing** a pre-restructure boundary is the signal — coupling that existed *despite* the
  structure fighting it.
- The restructure's new boundaries are the outcome variable.

**The sharp form of the hypothesis: the coupling that was fighting the old structure is what the
restructure moved to fix.**

## Corpus selection — criteria fixed before any repository is chosen

**N = 5 repositories.** Selection criteria, all required:

1. A restructure documented outside the diff itself — a changelog entry, ADR, release note, or blog post
   naming a modularization, package reorganization, or service split, with a locatable commit range.
2. At least 300 commits before the restructure.
3. At least 100 source files at the time of restructure.
4. The restructure moved at least 20 files across module boundaries.
5. Public repository, any language.

**Exclusions, also fixed now:**

- Restructures driven by a framework, language, or build-system migration rather than a judgment about
  where boundaries belong. The claim is about drivers, not about toolchains.
- Monorepo splits driven by CI or tooling limits.
- **Any repository this book's author has contributed to.** Every measurement in this project so far has
  run on the author's own corpus; this run exists partly to break that, and the exclusion is the point.

Repositories are selected and the list committed **before** any metric is computed. A repository that
turns out to be unsuitable after selection is reported as excluded, with the reason, rather than
silently swapped.

## Metric

For a repository with restructure at commit `T`:

- **Co-change** — two files co-change in a commit if both appear in it. Commits touching more than 50
  files are dropped as mechanical (formatting, license headers, mass renames).
- **Coupling** — for a file pair, the count of shared commits in the 300 commits before `T`, normalized
  by the geometric mean of their individual change counts.
- **Qualifying pair** — a pair in the top decile of coupling that sat in **different** modules before `T`.
- **Outcome** — did the pair land in the **same** module after `T`?
- **Base rate** — the same-module rate for randomly sampled cross-boundary pairs from the same
  repository, matched on individual change count.

## Predictions

**P1 (primary).** Qualifying pairs land in the same post-restructure module at **at least twice** the
base rate.

*The direction is the real prediction. The 2x threshold is a registered guess with no pilot behind it,
and it is recorded as a guess so that a hit at 1.6x is reported as a partial hit rather than
retrospectively reframed as a success.*

**P2 (falsification condition).** P1 is **falsified** if the ratio is at or below 1.2x, or if a
bootstrap confidence interval over repositories includes 1.0. A falsification is written up as the
result, not as a methodology problem.

**P3 (cadence — sufficiency).** File pairs whose individual change frequencies differ by an order of
magnitude or more land in **different** post-restructure modules at above the base rate.

**P4 (cadence — not necessity).** File pairs with *similar* change frequency show **no** signal in
either direction — an effect within 1.2x of the base rate.

*P3 and P4 together test item 17.5's refinement: cadence divergence is sufficient evidence of independent
drivers, cadence convergence is not evidence of shared ones. P4 predicting a null is deliberate. If P4
shows a strong effect, the refinement is wrong and the dev.to article's original phrasing was closer.*

**P5 (registered revision of a prior).** I expect **at least one repository to fail P1 outright**, and I
expect it to be one whose restructure was organizationally driven — a team boundary or a
reporting-line change rather than a domain judgment. If all five hit, that uniformity is itself
suspicious and the corpus selection should be re-examined for a bias none of the criteria above caught.

## What counts as inconclusive

- Fewer than 30 qualifying pairs in a repository — that repository reports inconclusive rather than
  contributing a noisy point estimate.
- A restructure whose post-`T` module assignment cannot be determined mechanically for more than 20% of
  qualifying files.

Inconclusive is reported as inconclusive. It is not a miss and it is not a hit.

## Scope caveats, registered in advance

These are known limits, written down now so they cannot be discovered later and presented as nuance.

1. **A restructure is a human judgment, not ground truth.** Alignment shows the method predicts what
   experienced engineers actually did. It does not show either party was right.
2. **Co-change is a proxy for a change driver, not the driver itself.** Two files may co-change because
   one calls the other, which is coupling of a kind the methodology does not claim to be about.
3. **Selection bias toward deliberation.** Repositories that document a restructure are plausibly more
   deliberate than average, which should bias P1 *upward*. A hit is therefore weaker evidence than the
   ratio suggests; a miss is correspondingly stronger.
4. **This tests PFD's backward method, not its forward method.** It says nothing about whether asking a
   business "who would ask for this to change" produces the same partition. That is a separate run and
   this one must not be cited for it.

## Grading

The writeup quotes P1-P5 verbatim, states hit / partial / miss / inconclusive for each with the measured
number beside it, and publishes the per-repository table including failures. One row goes to the claims
ledger: the claim, this instrument, the result, and caveat 4.
