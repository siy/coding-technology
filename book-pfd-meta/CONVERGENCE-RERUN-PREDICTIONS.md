# Pre-registered predictions — Run 1b, convergence re-run with isolation

**Registered 2026-08-23, BEFORE any implementer was launched.** Second attempt at Run 1, whose first
attempt is published in full at `CONVERGENCE-RESULTS.md` and failed on an isolation defect.

---

## Why there is a re-run

Run 1's treatment arm leaked. Two of four implementers read the Pragmatica source and ran JBCT tooling —
one iterated against `jbct lint` until it reported zero findings, which is convergence toward the
methodology's fixed point applied *by a machine*. The clean arm was n=2, one pair, and **P1 was not
evaluable**.

**The cause was a design asymmetry, not agent misbehaviour.** JBCT requires an external library whose
exact signatures matter for code that compiles; idiomatic Java requires nothing outside the JDK. Only
the treatment arm faced pressure to consult sources. Both leaking agents disclosed the violation
themselves and gave that exact reasoning.

## What changed, and only this

1. **The reason to leave is removed.** The treatment prompt now carries a **vendored signature
   appendix** — the Pragmatica package names, types, statics and combinators, transcribed from source
   into the prompt. Nothing needs to be looked up.
2. **An explicit escape hatch**: if a signature is not in the appendix, use a plain Java equivalent
   rather than guessing or searching. This gives a legal move where Run 1 gave only an illegal one.
3. **Tooling is banned explicitly** — no `jbct lint`, no reviewers, no compiling against real
   libraries, no sub-agents.
4. **Disclosure is mandatory output.** Every implementer must end by stating whether it read any file
   outside its prompt and whether it ran any tool. Run 1's contamination was caught only because two
   agents volunteered it; here it is required, so silence is itself informative.
5. **n=5 per arm**, up from 4. Run 1 lost half an arm; this leaves margin.

**Nothing else changes. The predictions below are carried over verbatim and are not revised.** Revising
predictions after a failed attempt is the researcher-degrees-of-freedom risk this programme has already
flagged twice; carrying them unchanged is the only defence available.

## Predictions — carried verbatim from `CONVERGENCE-PREDICTIONS.md`

**P1 (primary).** **Treatment within-arm shape convergence exceeds control within-arm shape
convergence.** Direction only; no threshold is registered.

**P2.** **Treatment method-name overlap exceeds control method-name overlap.** The margin should be
*smaller* than P1's — the methodology constrains structure more tightly than vocabulary.

**P3.** Every treatment implementation shows **SEQUENCER > 0**; control implementations sit at or near
**0.00%**.

**P4 (registered prior).** **The control will converge more than the methodology's rhetoric implies.** I
expect a real but **modest** margin.

**P5 (falsification).** P1 is falsified if control convergence equals or exceeds treatment convergence.
**It gets published as the headline if it happens.**

## Standing evidence from Run 1, which this run may confirm or overturn

Run 1's *distinctiveness* result survived its isolation failure and is the prior this run tests against:
SEQUENCER **15.6–21.2%** treatment against **0.0%** control, and UNCLASSIFIED **0.0%** treatment against
**17.9–38.5%** control — total separation on both, 4 against 4.

P2 reversed in Run 1: treatment naming converged at **25.6%** against control's **40.4%**. If P2 reverses
again on a clean arm, that is two independent runs against the prediction and should be treated as the
finding rather than as noise.

## Confounds

1. **Instruction volume, now wider.** The treatment prompt gains a signature appendix the control does
   not need, because the JDK is already in the model. Padding the control with filler would be
   artificial, so the asymmetry is accepted and recorded. **It biases P1 upward**, which matters only if
   P1 passes.
2. **One model, one vendor, one specification, one domain.**
3. **Five per arm, ten pairs per arm** — better than Run 1's six, still small.
4. **Mutation fingerprints out of scope.**
5. **This is a second attempt at the same hypothesis.** The defence is that predictions are carried
   verbatim and the metric is unchanged and already locked at `b68cb4f`.

## Contamination handling, fixed in advance

Any implementer that discloses reading outside its prompt or running tooling is **excluded from the
primary analysis**, and the primary result is computed on the clean subset only. A contaminated-inclusive
figure is reported alongside, clearly labelled. **If the clean treatment arm falls below n=3, P1 is
reported as not evaluable again** — as it was in Run 1 — rather than computed on whatever survives.

## Grading

The writeup quotes P1–P5 verbatim, grades each on the clean subset, publishes every implementation's
histogram and every disclosure, and states the instruction-volume confound beside the headline.
