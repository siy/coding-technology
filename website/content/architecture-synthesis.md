# Architecture Synthesis

Architecture Synthesis derives where computation happens — deployment topology, data placement, consistency boundaries — from service-level objectives, instead of choosing it from a catalog of styles. Derived, not chosen.

The method runs on nine questions, translated into six architecture axes through a fixed set of rules, and closed with verification arithmetic: back-of-envelope capacity math that checks a derived architecture against its own budget before anything gets built. An architecture produced this way is never a one-time choice. It is re-derived whenever the answers to those nine questions change — on a greenfield system and on one you inherited, by the same procedure.

A practicing architect can start here directly; a reader arriving from Process-First Design will recognize this as the next step.

Four architectures have been derived blind, against a locked answer sheet, and graded against what those systems actually run — in the open, with the misses shown alongside the hits. The registered predictions, answer sheets, operator prompts, and grading rubrics are public in a [replication kit](https://github.com/siy/derivation-artifacts). Every derivation after the first four is registered there before its outcome is checked, and counterexamples are invited.

The book — [*Architecture Synthesis: The Next Correct Step*](https://leanpub.com/architecture-synthesis-the-next-correct-step) — is on Leanpub. The [free course edition](/method/architecture-synthesis/course/) walks the whole derivation lesson by lesson, each paired with an exercise you run on a system you own.
