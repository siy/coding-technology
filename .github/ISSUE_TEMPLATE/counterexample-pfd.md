---
name: Counterexample report (Process-First Design)
about: A decomposition PFD derives that diverges from one that demonstrably works
title: "[counterexample] <system or domain, era>"
labels: counterexample, pfd
---

<!-- Process-First Design has no registered-prediction corpus yet, so reports here are
     read and answered rather than graded against a rubric. Architecture Synthesis
     counterexamples belong in the replication kit instead:
     https://github.com/siy/derivation-artifacts/issues/new/choose -->

## System context

Domain, era ("2019-2023"), and scale in one paragraph. "Private system, details
anonymized" is fine. Say who owns the system and how many people work on it.

## The change drivers you found

Per rule set or data class: how often the governing logic changes, and under whose
control. Where volatility is already realized, say what the version-control history
shows; where it is not, say so and mark the answer a low-confidence prior rather than
a fact.

## The decomposition PFD derives

Use cases attributed to drivers, grouped by shared attribution. Name the attribution
per use case, not just the grouping.

## The decomposition that actually works

The boundaries the working system uses, era-pinned.

## The divergence

Where the two disagree, and why the working boundaries are load-bearing rather than
habit or history: what breaks if the system is reorganized along the derived ones?
Co-change evidence is the strongest form this can take — files or modules that change
together across commits, against the grouping the method produced.
