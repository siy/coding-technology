# Run 1c — DDG convergence, pre-registered

**Recorded 2026-08-27, before any Run 1b implementation was inspected for this run.** The metric,
the extraction schema, the scoring rule, the falsification condition and the void condition below
are all fixed by this document. Nothing here may be revised after extraction begins; a revision
means a new run with a new registration.

## Why a third instrument

Run 1 leaked (two treatment implementers read the Pragmatica source, one iterated against `jbct
lint`), leaving a clean arm of n=2 and P1 not evaluable. Run 1b fixed isolation — all ten disclosed
`READ_OUTSIDE_PROMPT: no` — and reported determinism falsified at a margin of −0.05.

That headline is superseded. Its instrument, a shape histogram over methods, was dismantled on two
counts recorded in `CONVERGENCE-RERUN-RESULTS.md`:

1. **It measured error-construction style.** `shape-census`'s LEAF bucket means *any method that
   does not compose*, so it counts `message()` overrides and named failure factories. t1 wrote 14
   failure factories, t4 wrote five `message()` overrides; that one stylistic choice accounts for
   most of a 45-vs-25 spread that was read as a difference in structure.
2. **The control could score perfect agreement by being unclassifiable.** Scored on the use-case
   file alone, the control arm returns 100.00 convergence with sd 0.0, because every control
   use-case file is 100% UNCLASSIFIED. The metric measured agreement in a vocabulary only one arm
   speaks.

**Current standing before this run: determinism is neither supported nor falsified.** Run 1c is
the corrected instrument, not a re-test of a settled question.

## What is under test

P1, inter-implementer determinism, as asserted at `book/introduction.md:54` and scoped by the
normalization boundary at `book/introduction.md:56`. The boundary is what makes this run possible:
it declares concurrency structure, step contracts, composition pattern and failure representation
**derived**, and declares leaf algorithms, adapter internals, module promotion, test-input vehicle
and test-data representation **style**. Only derived properties are measured.

## The instrument

The **data dependency graph**, as the book defines it at `book/from-process-to-patterns.md:70-80`:
three operators — **Sequential** (need A before gathering B), **ALL** (need both, independent),
**ANY** (either suffices) — with transformation functions between them.

The DDG is the right instrument for one specific reason: **it is language-neutral, so both arms
speak it.** An idiomatic-Java implementation that calls three services has a concurrency structure
and an ordering relation exactly as a JBCT implementation does. This is the direct repair of defect
2 — there is no bucket in which one arm is definitionally unclassifiable.

### Node identity — locked, spec-derived

The five external calls named by `SPEC.md` steps 2, 3, 4, 6, 7:

| Node | Spec step |
|---|---|
| **R** | look up resident by tax identifier |
| **V** | look up vehicle by registration |
| **Z** | check remaining zone capacity |
| **P** | persist the issued permit |
| **N** | send confirmation notification |

Identity comes from the specification, never from a class or method name, so it cannot drift with
either arm's vocabulary.

### The four measured properties

**D1 — Concurrency structure.** The set partition of `{R, V, Z}` (the three lookups the spec leaves
mutually independent) into groups gathered concurrently. `{{R,V,Z}}` is fully concurrent;
`{{R},{V},{Z}}` is fully serial. Derived: *concurrency structure*.

**D2 — Guard placement.** For each rejecting rule (input validation, zone-full, vehicle-weight),
the set of nodes whose results are already available at the point the guard is evaluated. Derived:
*step contracts*.

**D3 — Failure absorption.** For each of the five nodes, whether its failure aborts the operation or
is absorbed. The spec fixes only N as best-effort; the rest measure agreement on what the spec left
implicit. Derived: *failure representation*.

**D4 — Edge structure.** For each of the ten unordered node pairs, the ordering relation: `before`,
`after`, or `unordered`. Derived: *the pattern for each composition*.

### Explicitly excluded, with reasons

- **Error-construction style** — factories versus `message()` overrides versus enum constants. This
  is the variation that defeated Run 1b. It is additionally *inadmissible*: the rule governing it
  shipped in JBCT 4.9.0 on 2026-08-26, after these implementations were written. Scoring conformance
  to a rule that did not exist at authoring time would measure nothing about determinism.
- **Method and class names, method counts, file counts** — vocabulary-dependent or below the line.
- **Leaf algorithms** (the fee arithmetic), **adapter internals**, **module structure**, **test
  data** — below the line by `introduction.md:56`.

## Scoring

Within-arm mean pairwise agreement over the 10 pairs in an arm of 5.

- **D1**: 1 if the two partitions are identical, else 0.
- **D2**: per rejecting rule, 1 if the available-node sets match exactly; mean over rules.
- **D3**: per node, 1 if both abort or both absorb; mean over the five nodes.
- **D4**: per unordered pair, 1 if the relation matches; mean over the ten pairs.

**Overall DDG agreement** = the unweighted mean of D1–D4, reported as a percentage. Each component
is also reported separately, and no component may be dropped from the overall figure after the fact.

## Predictions

- **P1c-1 (primary).** Treatment overall DDG agreement **exceeds** control overall DDG agreement.
- **P1c-2.** Treatment D1 agreement **≥ 0.80** — treatment implementations agree that the three
  independent lookups are gathered concurrently.
- **P1c-3.** Treatment D1 agreement exceeds control D1 agreement.

**Exploratory, not a test:** distance from the spec-derived canonical DDG (steps 2–4 mutually
independent, 6 after them, 7 last and best-effort). Reported for interest; no prediction is
registered on it and it cannot be promoted to a finding in this run.

## Falsification

**If control overall agreement is greater than or equal to treatment overall agreement,
inter-implementer determinism is falsified on the corrected instrument, and that is published as
the headline.** As in Run 1b, the miss is the headline if the miss is what happens.

## Void condition — the Run 1b lesson, made mandatory

A property is **inextractable** when the implementation does not exhibit it at all. Extractors must
report `inextractable` as a value distinct from every legitimate value.

**If any arm records more than one `inextractable` for a property, that property is reported
separately and excluded from that arm's overall figure, and the exclusion is stated in the
results.** An arm may not score agreement by uniformly failing to exhibit the thing being measured.
This is the explicit guard against the defect that produced Run 1b's control score of 100.00.

**Two implementations that are both `inextractable` on a sub-item score 0, never 1.** Uniform
absence is not agreement. This is the same defect at pair level and is closed the same way.

If the primary comparison rests on a property excluded under this rule for either arm, **the run is
void, not a result.**

## Extraction protocol

Ten extractions, one per implementation, each performed by a separate agent that receives only: the
specification, the DDG operator definitions, the extraction schema, and one implementation
directory. **No extractor is told which arm its implementation belongs to, what hypothesis is under
test, that other implementations exist, or that any comparison will be made.** Blinding to the arm
label is impossible — the type vocabulary is self-evident — but blinding to the hypothesis is not,
and it is the blinding that matters: an extractor cannot bias toward a direction it has not been
told about.

Extraction output is structured JSON against the fixed schema. Agreement is computed from that JSON
by `run1c-score.py`, written and committed as part of this registration, before extraction runs.

## Arms and exclusions

Treatment `t1..t5`, control `c1..c5`, the Run 1b cohort unchanged. All ten disclosed
`READ_OUTSIDE_PROMPT: no`, so no contamination exclusion applies. Implementations are fixed
artifacts; nothing is re-run, so the Run 1b `RAN_TOOLS` wording defect has no bearing here.

## Corpus location

`../oss/internal/measurement-corpus/run1b/` — preserved 2026-08-27 from a dead session's scratchpad
under `/private/tmp`, which is subject to OS purge. The implementations are one-shot agent output
and cannot be regenerated; re-running would produce different implementations, not these.
