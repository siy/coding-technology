# From Terra to Aether: Building Java Applications in Slices — Reading Order

In-progress draft. Read top-to-bottom; each part builds on the one before. Working
title; structure and rationale live in `../book-aether-meta/BOOK-PLAN.md`.

## Front matter
- [Introduction](introduction.md) — who this book is for (mid-level Java dev with JBCT basics), the promise (→ senior Aether application developer), and how to read it.

## Part 0 — On-ramp
- [Part 0 — On-ramp](part0-onramp.md) — JBCT recap (assumed, fast) and the "let Java be Java" thesis. Overview vignettes span domains.

## Part I — The Aether model *(practical entry point)*
- [Part I — The Aether model](part1-aether-model.md) — your first slice, request routing, config inheritance and the provisioned step, three environments, idempotency as the enabling rule.

## Part II — The playbook *(the heart)*
- [Part II — The playbook](part2-playbook.md) — problem-driven idioms in modules: A Persistence · B Messaging · C Other resources · D Reliability & consistency · E Performance & scale · F Architecture-in-the-large.

## Part III — Testing & evolving
- [Part III — Testing & evolving](part3-testing.md) — plain-Java tests, Forge, k6, legacy → slice migration.

## Part IV — Operate like a senior
- [Part IV — Operate like a senior](part4-operate.md) — blueprints, scaling tiers, canary/rollback, observability, the 50% rule as a design force.

## Part V — Thinking in Aether *(capstone)*
- [Part V — Thinking in Aether](part5-thinking.md) — deriving idioms, designing for failure, the finished app, techniques this book invented.

## Part VI — Under the hood *(optional)*
- [Part VI — Under the hood](part6-under-the-hood.md) — anatomy (written vs generated), lifecycle, assembly & resource provisioning.

## Back matter
- [Appendix A — API quick reference](appendix-a-api-reference.md) — the author-facing surface in one place, pinned to a named runtime commit.
- [References](references.md) — works cited.
