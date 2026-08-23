# Run 3 — external shape census: results

**Executed 2026-08-23** against `SHAPE-CENSUS-EXTERNAL-PREDICTIONS.md`, registered at commit `6b6f967`
before any external repository was cloned. Instrument: `jbct shape-census`, jbct-cli 1.0.0-rc3.

**Headline: the corpus objection is answered, an instrument defect was found, and the prediction the run
was built on was based on a misreading of the tool.**

---

## Data

Baseline — the author's JBCT codebases, measured before the external corpus was chosen:

| Codebase | Methods | LEAF | SEQUENCER | MIXED | Residual |
|---|---|---|---|---|---|
| jbct-loan | 880 | 73.40% | 8.64% | 0 | 10.91% |
| ticketing | 462 | 68.83% | 20.35% | 0 | 5.19% |
| jbct-realworld | 118 | 65.25% | 15.25% | 0 | 17.80% |

External — four qualifying repositories, no author contributions, no Pragmatica:

| Codebase | Methods | LEAF | SEQUENCER | MIXED | Residual |
|---|---|---|---|---|---|
| Apache Fineract | 18,769 | 52.39% | **0.17%** | 0 | 44.47% |
| Broadleaf Commerce | 15,384 | 62.64% | **0.00%** | 0 | 36.16% |
| OpenMRS | 7,312 | 61.27% | **0.03%** | 0 | 37.83% |
| Shopizer | 6,173 | 76.45% | **0.02%** | 0 | 23.28% |

**48,000 methods across 45,000 files of code nobody in this project wrote.** Zero parse errors.

**Excluded:** spring-petclinic, 30 main files, fails selection criterion 3 (≥100). Measured anyway and
reported separately, since P5 was specifically about it: 82 methods, LEAF 62.20%, SEQUENCER 0.00%,
residual 32.93%.

## Instrument defect: MIXED appears unreachable

`MIXED` is zero in all seven codebases. Before reading that as a finding, I tested whether the
classifier can emit it at all:

1. A deliberately maximal imperative method — nested branching, two loop forms, a switch, sequential
   statement composition, a ternary — classifies as **UNCLASSIFIED**.
2. A monadic chain that genuinely mixes Sequencer and Fork-Join (`.flatMap` chain containing a
   `Promise.all(...).map(...)`) classifies as **SEQUENCER**.

Those are the two things "mixed patterns" can mean, and neither produces MIXED.

**Consequence for the book, and it is not small.** *Basic Patterns* states *"each function implements
exactly one pattern; mixing patterns is the signal to split."* The census bucket that would detect a
violation of that rule does not fire. `shape-census` cannot currently find the defect the rule exists to
catch, and the baseline's "MIXED = 0 across 1,460 JBCT methods" was measuring the instrument, not the
code. Filed for jbct-cli.

## Grading

> **P1 (primary).** External codebases show a **non-zero MIXED rate**, and at least three of the four
> exceed **1%**.

**FALSIFIED — and uninformative.** All zero. But the design was built on a misreading of what MIXED
means in this tool, so the failure says nothing about external code. The registration argued MIXED was
the load-bearing prediction *because* it is a positive identification rather than a classification
failure. That reasoning was sound; it was applied to a bucket that never fires.

> **P2 (weak, and registered as weak).** External residual exceeds the JBCT range (5.19%–17.80%).

**HIT.** All four external sit at 23.28%–44.47%, entirely above the JBCT range. Registered as weak, and
the weakness is now confirmed rather than precautionary: the MIXED discovery shows the classifier's
blind spots are real, and `UNCLASSIFIED` on foreign code remains ambiguous between *no pattern* and
*tool cannot see it*.

> **P3.** External **LEAF share is lower** than the JBCT range, with the difference showing up as more
> SEQUENCER, CONDITION and MIXED.

**PARTIAL, and the stated mechanism is wrong.** Three of four fall below the JBCT range (Fineract
52.39%, OpenMRS 61.27%, Broadleaf 62.64%); **Shopizer at 76.45% sits above it**. And where LEAF is
lower, the difference goes almost entirely to **UNCLASSIFIED**, not to the composed patterns predicted.

> **P4 (Fineract, the domain match).** Fineract's distribution differs from jbct-loan's by more than
> jbct-loan differs from ticketing.

**HIT, and this is the run's most important result.** On (LEAF, SEQUENCER, residual), summed absolute
difference: **jbct-loan vs ticketing = 22.0**; **jbct-loan vs Fineract = 63.0**.

Two lending systems, same domain, differ nearly three times as much as two JBCT systems in *different*
domains. This was the designated collapse condition — if the vocabulary tracked domain rather than
methodology, the whole census would mean nothing. It does not.

> **P5 (registered prior).** I expect **spring-petclinic to be the closest to JBCT's profile**.

**MISS, in the methodology's favour.** Petclinic sits squarely in the external band (residual 32.93%,
SEQUENCER 0.00%), not the JBCT one. A canonical, deliberately clean Spring sample does not resemble
JBCT — so "leaf-dominant with composed patterns" is not simply a description of *careful Java*.

## The signal, which is not the one I predicted

**SEQUENCER.** JBCT 8.64%–20.35% against external **0.00%–0.17%** — a difference of two to three orders
of magnitude, with no overlap and 48,000 external methods behind it. Like MIXED, SEQUENCER is a positive
identification rather than a classification failure, which is exactly the property that made MIXED the
intended primary.

**The confound, stated plainly.** SEQUENCER detection keys on monadic chains, which is a Pragmatica
idiom. A large part of this gap is "these codebases do not use this library". The finding is *not* that
external teams could not express sequencing; it is that they do not express it as a **named composition
the tool can see**, which is a claim about visible structure and not about capability. Anyone citing
this number owes that sentence alongside it.

## Standing

**The corpus objection is materially weakened.** "Every corpus is the author's" has appeared in three
prior measurements. There is now an external base rate over 48,000 methods of business Java, obtained
without a volunteer or a collaboration, and it is reproducible by anyone with the CLI.

What it establishes: JBCT's shape distribution is **distinguishable** from business Java at large, and
the distinction survives a same-domain comparison (P4). What it does not establish: that the
distribution is *better*. That argument lives in the books and is untouched by this run.

Claims-ledger row: *claim — JBCT produces a distinctive structural distribution; instrument —
`jbct shape-census` over four external business-Java codebases (48k methods) against three JBCT
codebases (1.5k); result — **distinguishable, on SEQUENCER and residual, and it survives a same-domain
control**; caveats — SEQUENCER is confounded with library choice, UNCLASSIFIED is ambiguous on foreign
code, MIXED is unreachable in the current tool, and the JBCT baseline is the author's own.*
