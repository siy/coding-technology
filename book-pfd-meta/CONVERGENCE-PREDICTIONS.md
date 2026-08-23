# Pre-registered predictions — Run 1, the convergence experiment

**Registered 2026-08-23, BEFORE any implementer was launched.** No implementation existed when this was
committed.

Run 1 of `book-pfd-meta/PLANNED-CHANGES.md` item 18. This is the highest-value unmeasured claim in the
ecosystem.

---

## The claim under test

`book/from-process-to-patterns.md:251` asserts that the methodology produces **deterministic structure** —
that the same design, implemented by different hands, yields the same shape. Nothing has ever measured
it. It is also the claim the "AI-friendly" positioning rests on, which makes AI sessions the right
population rather than a convenient substitute.

## Design

**One specification, eight independent implementers, no shared context.**

- **Treatment arm (n=4):** the spec plus an instruction to follow JBCT.
- **Control arm (n=4):** the identical spec plus an instruction to write clean idiomatic layered Java.

Each implementer is a fresh general-purpose agent with **no inherited conversation context** and writes
to its own directory. None sees another's output.

**Why a control at all.** Without one, convergence shows only that language models are similar. This is
the fair kind of control — the absence of the treatment — not the Spring comparison this project already
refused to publish.

## Measurement

Mechanical, computed from source with no reading by me:

1. **Shape histogram** per implementation via `jbct shape-census` (proportions, not counts).
2. **Within-arm convergence** = mean pairwise similarity across the 6 pairs in each arm of 4. Histogram
   distance is summed absolute difference over the eight shape proportions; similarity is `100 − distance`.
3. **Method-name overlap** = mean pairwise Jaccard index over the set of declared method names.

**Mutation fingerprints are out of scope for this run.** They need eight compiling builds with
dependencies resolved; the census and name census need only parseable source. Recorded as a limitation,
not a finding.

## Predictions

**P1 (primary).** **Treatment within-arm shape convergence exceeds control within-arm shape
convergence.** Direction only; no threshold is registered, per the Run 2 lesson.

**P2.** **Treatment method-name overlap exceeds control method-name overlap.** The naming census
(JBCT 4.5.0) found domain terms dominate naming, so the margin here should be *smaller* than P1's — the
methodology constrains structure more tightly than vocabulary.

**P3.** Every treatment implementation shows **SEQUENCER > 0**; control implementations sit at or near
**0.00%**, matching Run 3's external band.

**P4 (registered prior, expected to temper the result).** **The control will converge more than the
methodology's rhetoric implies.** Four instances of one model given one spec will produce similar code
regardless of method. I expect a real but **modest** margin, and I am registering that now so a modest
margin cannot later be presented as a triumph.

**P5 (falsification).** P1 is falsified if control convergence equals or exceeds treatment convergence.
That outcome would mean the determinism claim is measuring the model, not the method, and it would be
the most important negative result this programme could produce. It gets published as the headline if it
happens.

## Confounds, registered in advance

1. **Instruction volume.** The treatment arm receives a methodology; the control receives a style
   instruction. Both prompts are written to comparable length and specificity, but I cannot fully
   separate *this methodology* from *more constraint of any kind*. A methodology-shaped placebo would be
   needed for that and is out of scope. **This is the run's principal weakness.**
2. **One model, one vendor.** Convergence may differ across models.
3. **One specification, one domain.** Structure may converge for this problem shape and not others.
4. **Small-N.** Four per arm gives six pairs per arm. Directional evidence at best.
5. **The spec was written by the methodology's advocate**, so it may be phrased in ways that suit it.
   The domain (parking permits) was chosen to sit outside this project's corpora.

## Grading

The writeup quotes P1–P5 verbatim, grades each, publishes both arms' full histograms and both
convergence numbers, and states the instruction-volume confound beside the headline rather than in a
footnote.
