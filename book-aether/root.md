# Building Applications with Aether — Reading Order

In-progress draft. Read top-to-bottom; each part builds on the one before. Working
title; structure and rationale live in `../book-aether-meta/BOOK-PLAN.md`.

## Front matter
- [Introduction](introduction.md) — who this book is for (mid-level Java dev with JBCT basics), the promise (→ senior Aether application developer), and how to read it.

## Part 0 — On-ramp
- [Part 0 — On-ramp](part0-onramp.md) — JBCT recap (assumed, fast) and the "let Java be Java" thesis. Overview vignettes span domains.

## Part I — Aether Slice: No Magic *(optional deep dive)*
- [Part I — Aether Slice: No Magic](part1-no-magic.md) — anatomy (written vs generated), lifecycle, assembly & resource provisioning, config inheritance, request routing. Opens with a skip-disclaimer.

## Part II — The Aether model *(practical entry point)*
- [Part II — The Aether model](part2-aether-model.md) — your first slice, three environments, idempotency as the enabling rule.

## Part III — The playbook *(the heart)*
- [Part III — The playbook](part3-playbook.md) — problem-driven idioms in modules: A Persistence · B Messaging · C Other resources · D Reliability & consistency · E Performance & scale · F Architecture-in-the-large.

## Part IV — Testing & evolving
- [Part IV — Testing & evolving](part4-testing.md) — plain-Java tests, Forge, k6, legacy → slice migration.

## Part V — Operate like a senior
- [Part V — Operate like a senior](part5-operate.md) — blueprints, scaling tiers, canary/rollback, observability, the 50% rule as a design force.

## Part VI — Thinking in Aether *(capstone)*
- [Part VI — Thinking in Aether](part6-thinking.md) — deriving idioms, designing for failure, the finished app, techniques this book invented.

## Back matter
- [Appendix A — API quick reference](appendix-a-api-reference.md) — the author-facing surface in one place, pinned to a named runtime commit.
- [References](references.md) — works cited.
