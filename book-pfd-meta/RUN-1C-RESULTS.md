# Run 1c — results

**Registered in `RUN-1C-PREDICTIONS.md` (commit `3d081db`) before any implementation was inspected.
Extraction and scoring followed the registration without amendment.** The scorer's only change after
registration was a crash fix (`c973a0c`) that altered no metric; it was found by a synthetic smoke
test run before real data was touched.

# Headline: P1c-1 misses. Determinism is falsified on this instrument.

Treatment overall DDG agreement **100.00%**. Control overall DDG agreement **100.00%**. Margin
**+0.00**. The registration states that control agreement greater than or equal to treatment
falsifies inter-implementer determinism and that the miss is published as the headline. It is
published here.

| Property | Treatment | Control | Cross-arm |
|---|---|---|---|
| D1 concurrency structure | 100.00% | 100.00% | **0.00%** |
| D2 guard placement | 100.00% | 100.00% | 66.67% |
| D3 failure absorption | 100.00% | 100.00% | 100.00% |
| D4 ordering relation | 100.00% | 100.00% | 70.00% |
| **Overall** | **100.00%** | **100.00%** | — |

Zero `inextractable` values were recorded anywhere, in either arm, on any property. The void rule
did not fire, and no component was excluded. **This run is a result, not a void.**

Registered predictions: **P1c-1 MISS** (margin +0.00). **P1c-2 HIT** (treatment D1 100.00% ≥ 0.80).
**P1c-3 MISS** (tie at 100.00%).

## What actually happened

Both arms converged perfectly, and they converged on *different graphs*.

- **Every one of the five control implementations gathers the three independent lookups serially**
  — `[[R],[V],[Z]]`, with `R|V`, `R|Z`, `V|Z` all `before`. Verified independently of the
  extractors: no control implementation contains a single concurrency primitive. Not
  `CompletableFuture`, not a parallel stream, not an executor, not a thread, not a `join()`, in any
  file of any of the five. `c1` is representative — resident at line 65, vehicle at 68, capacity at
  75, persist at 98, notify at 109, straight down the page.
- **Every one of the five treatment implementations gathers the same three concurrently** —
  `[[R,V,Z]]`, all three pairs `unordered`, via a three-way `Promise.all` present in all five.

So the arms disagree **maximally** on concurrency structure (0.00% cross-arm) while each is
internally unanimous. The metric measures within-arm convergence, and both arms are at the maximum.

## The two limitations, stated because they bound the headline

**1. The metric saturated.** Both arms scored the ceiling. A measure on which both arms achieve the
maximum cannot discriminate between them — treatment could not have exceeded control even if the
methodology did add convergence, because there was no headroom above 100.00%. The registration did
not anticipate saturation and registered no void condition for it.

**2. The specification is a confound for the control arm.** `SPEC.md` enumerates the steps as a
numbered list, 1 through 7, in execution order. That numbering plausibly hands the control arm its
ordering for free. The instrument cannot separate *the specification determined the structure* from
*the method determined the structure*, and for the control arm the former is the more parsimonious
reading.

**Neither limitation is offered as an escape.** The falsification condition was registered in
advance precisely so that it could not be renegotiated after the data arrived, and voiding a run on
grounds invented after seeing the result is the exact move pre-registration exists to prevent. The
headline stands as registered. The limitations bound what it licenses; they do not withdraw it.

## What this licenses, and what it does not

**Licensed:** JBCT did not produce *more* inter-implementer convergence than idiomatic Java, on this
use case, on this instrument. The determinism claim at `book/introduction.md:54` is **not
distinctive** here — convergence was achieved without the methodology.

**Not licensed:** any claim that JBCT lacks determinism. Both arms were perfectly deterministic. The
data show determinism is *achievable without JBCT on this use case*, not that JBCT fails to deliver
it.

**Not licensed:** any claim that the two methods produce the same code. They demonstrably do not —
see below.

## Observation, explicitly not a registered test

The cross-arm column is the interesting number and **no prediction was registered on it**, so it is
recorded as an observation and may not be promoted to a finding in this run.

Five of five treatment implementations parallelized three independent I/O calls that five of five
control implementations serialized. That is a behavioural difference with latency consequences,
arrived at independently by ten implementers who could not see each other's work, and it is total —
0.00% agreement, no overlap. Guard placement (66.67%) and ordering (70.00%) differ partially;
failure absorption is identical (100.00%), which is unsurprising because the specification fixes the
only interesting case by naming step 7 best-effort.

This is the same distinctiveness result that survived Run 1b's collapse, now visible on a structural
instrument rather than a vocabulary-dependent one. **Distinctiveness continues to be well evidenced.
Determinism, as a claim that JBCT converges implementers *more than the alternative*, is not.**

## What a repair would need

A successor run needs headroom and a specification that does not hand over the ordering:

1. **A specification that does not enumerate steps in execution order** — a statement of what must
   be true rather than a numbered procedure, so neither arm is given its DDG by the prompt.
2. **A use case with genuine structural choice** — more independent gathering, an optional branch, a
   failure with more than one defensible absorption point, so that a perfect score is not reachable
   by following the prompt down the page.
3. **A finer-grained metric**, so that agreement is a distribution rather than a coin flip. D1's
   all-or-nothing partition comparison is the coarsest possible measure of concurrency structure.

Registered as the next item; not attempted here, because attempting it inside this run would be
choosing the instrument after seeing the data.

## Provenance

Corpus: `../oss/internal/measurement-corpus/run1b/`, the ten Run 1b implementations unchanged, all
of which disclosed `READ_OUTSIDE_PROMPT: no`. Extractions:
`../oss/internal/measurement-corpus/run1c-extractions/`, ten agents, one implementation each,
working from a byte-identical brief that never named the hypothesis, the arms, or the existence of a
comparison. Scoring: `run1c-score.py`, committed before extraction ran.

**One check worth recording, because it nearly became a fifth measurement bug of my own.** The
perfect tie initially read as an extraction artifact — the brief carried an illustrative JSON
example whose values matched the treatment arm exactly, and anchoring on it was a live hypothesis.
It was tested against the code rather than assumed, and it was false: the control extractions report
serial gathering, which contradicts the example they were supposedly anchored to. The alarm was
wrong and the extractions are sound. The example should still be removed from any successor brief —
it was a real hazard that happened not to fire.
