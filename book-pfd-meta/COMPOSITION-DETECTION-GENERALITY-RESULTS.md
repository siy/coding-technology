# Run 6 — does composition detection generalize beyond Pragmatica? Results

**Executed 2026-08-23** against `COMPOSITION-DETECTION-GENERALITY-PREDICTIONS.md`, registered at commit
`f092d10` before the target was measured.

**Headline: it generalizes. SEQUENCER fires on vavr-composed Java, so Run 3's central discriminator
measures structure rather than a library import — and the rate lands exactly between imperative Java and
JBCT.**

---

## Data

`ddd-by-examples/library` — 222 methods, 85 files, 0 parse errors.

| | LEAF | SEQUENCER | MIXED | Residual |
|---|---|---|---|---|
| **JBCT band** (3 codebases) | 62.21–73.41% | **8.30–20.35%** | 0–0.34% | 5.19–20.28% |
| **ddd-library (vavr)** | 78.83% | **1.35%** | 0.00% | 18.92% |
| **External band** (4 codebases, 48k methods) | 52.39–76.45% | **0.00–0.17%** | 0–0.005% | 23.28–44.48% |

## Grading

> **P1 (the load-bearing one).** vavr-composed Java produces a **non-zero SEQUENCER rate**.

**HIT.** 1.35%, three methods. The classifier recognises `Either`/`Try` chains it was never written for.
**Run 3's headline stands and needs no rewrite.**

> **P2.** The SEQUENCER rate lands **below the JBCT band but materially above the external band** — say
> above 1%.

**HIT, precisely.** 1.35% is roughly **8× the top of the external band** and roughly **6× below the
bottom of the JBCT band**. Functional-composition Java sits between imperative Java and JBCT, which is
the position the prediction described and the most informative single number in the run.

> **P3 (registered prior).** **MIXED > 0.**

**MISS.** MIXED is 0. Two readings, and this run cannot separate them: the one-pattern-per-function
discipline may be more widely shared than assumed, or the bucket is narrower than its fix suggested.
The target is a *teaching* codebase, where cleanliness is expected, so the second reading is not
supported either. Recorded as unresolved.

> **P4.** Residual lands **between** the JBCT band and the external band.

**MISS.** 18.92% sits **inside** the JBCT band (5.19–20.28%), near its top, and below every external
codebase. On residual, vavr code resembles JBCT code rather than sitting between. That is a stronger
result for the vocabulary than the prediction asked for, and it arrived as a failed prediction.

## What this resolves

Run 3 carried an explicit confound: *"SEQUENCER detection keys on monadic chains, which is a Pragmatica
idiom. A large part of this gap is 'these codebases do not use this library.'"*

**That confound is now bounded rather than open.** SEQUENCER fires on a different library, so it is not
detecting `org.pragmatica` imports. The JBCT-versus-vavr gap that remains — 8.30–20.35% against 1.35% —
is the difference between a methodology that **mandates** composition and a library that **permits** it.
That is a real distinction and it is the one the books claim.

**What it does not license.** N=1, a teaching codebase, 85 files, below Run 3's own size threshold.
Nothing here supports a claim about functional Java generally.

## The corpus finding, which may outlast the measurement

The search behind this run is worth more than N=1 usually is. GitHub code search for
`io.vavr.control.Either` in Java returns overwhelmingly **katas, workshops and library integrations** —
`advent-of-craft` exercise repos, `cyclops-integration`, `vavr-jackson`, `assertj-vavr`. Of two
topic-tagged candidate applications, one used **no vavr at all**.

**Public Java business code that composes with typed error values is rare.** That is context the books
should hold: JBCT is not a variation on a common style, it is a rare style, and the external base rate
in Run 3 (SEQUENCER at 0.00–0.17% over 48,000 methods) is what the ordinary case actually looks like.

Claims-ledger row: *claim — composition detection measures structure, not a library; instrument —
`jbct shape-census` over one vavr-composed codebase; result — **confirmed, SEQUENCER 1.35%, between the
imperative and JBCT bands**; caveats — N=1, teaching codebase, below Run 3's size threshold, and the
qualifying population is nearly empty.*
