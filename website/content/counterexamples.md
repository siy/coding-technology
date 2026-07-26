# Counterexamples

Every method in this series makes a falsifiable claim: given these inputs, this is the architecture — or process, or code structure — that follows. The standing invitation is to prove one wrong.

A counterexample is not a general objection. It is one system, one derivation, and a specific place where the method's answer and reality parted ways.

## Run it first

Use a system you actually know: your production service, not a toy example.

1. Fill the [worksheet](/method/architecture-synthesis/worksheet/) for that system, era-pinned. Architectures drift, and an undated sheet cannot be checked against anything.
2. Run the sheet through the [entry gate](/method/architecture-synthesis/next-step/). Unpriced and unscoped answers are the first thing reviewers check, so it is worth catching them yourself.
3. Walk the derivation with the [reference cards](/method/architecture-synthesis/reference/), or the [course](/method/architecture-synthesis/course/) if you want it lesson by lesson.
4. Compare what the derivation produced against what the system actually runs. Where they diverge, you have a counterexample.

## What the report contains

Five things, which the issue template will prompt you for:

- **System context** — domain, era, scale, in a paragraph. "Private system, details anonymized" is fine.
- **Answer sheet** — filled, scoped and priced where the method demands it.
- **Derived vector** — what the derivation produced, axis by axis, with the forcing answer cited per moved axis.
- **Observed vector** — what the system actually runs, axis by axis, era-pinned.
- **The divergence** — where the two disagree, and why the observed position is load-bearing rather than habit or history: what breaks if the system is moved to the derived position?

The last one carries the weight. A divergence explained by history is a finding about that system; a divergence that survives "what breaks if we move it?" is a finding about the method.

## How it is judged

By the same [grading rubric](https://github.com/siy/derivation-artifacts/blob/main/protocol/GRADING-RUBRIC.md) and [evidence grades](https://github.com/siy/derivation-artifacts/blob/main/protocol/EVIDENCE-GRADES.md) applied to the four registered derivations, under a public [protocol](https://github.com/siy/derivation-artifacts/blob/main/protocol/PROTOCOL.md). Misses are published alongside hits.

<p class="cta"><a class="btn course" href="https://github.com/siy/derivation-artifacts/issues/new/choose">File a counterexample</a></p>

That intake is the Architecture Synthesis [replication kit](https://github.com/siy/derivation-artifacts). Process-First Design and JBCT have their own templates on the [series repository](https://github.com/siy/coding-technology/issues/new/choose) — a PFD report argues about a decomposition and its change drivers, a JBCT report about a rule that makes the code worse. Neither has a registered-prediction corpus yet, so reports there are read and answered rather than graded.
