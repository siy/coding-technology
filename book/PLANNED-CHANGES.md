# JBCT — Planned Changes (backlog)

> Queued JBCT changes for the next version (target **4.2.1**). Not shipped until folded into `book/*.md`,
> the CHANGELOG, and the authoritative naming rules (the **jbct-coder** agent + the **/jbct** skill).
> Origin: session 2026-06-30.

## Target 4.2.1

### 1. `*State` naming rule — state-machine state types

The sealed sum type enumerating a state machine's lifecycle states is named with a `*State` suffix:
`BookingState`, `HoldState`, `SeatState`. Why it earns a rule:

- It names exactly the **state** axis of the four-way split (identity / state / representation / policy),
  keeping it distinct from the entity (`Booking`), its value-object representation, and its use-case
  policy.
- It joins JBCT's suffix-by-role family (`*Request`, `*Response`, `Cause`): a reader sees `…State` and
  knows it is a sealed sum of lifecycle states with guarded transitions, not a DTO.
- It codifies existing practice — the books already use `HoldState` (`Fresh` / `Stale` / `Expired`).

Refinements:

- **Variants stay bare.** `BookingState` with `Free` / `Held` / `Confirmed` / `Cancelled`, never
  `HeldState`. The enclosing type carries the meaning; suffixing variants is redundant noise.
- **Scope to the lifecycle-state sum** that transitions guard — not every mutable holder. A config
  snapshot or a UI holder is not a `*State`; reserve the suffix or the signal dilutes.
- **Transition companion (ties to "Designing out contention").** The single multi-writer field *is* the
  `*State`, written only as a guarded transition — naming the type `*State` makes the transition the only
  way it changes.

Homes to update:

- **Book naming conventions** — locate the conventions section (ch02-design-methodology or
  ch15-project-structure) and add the rule; align any worked examples that show state machines.
- **Glossaries** — JBCT `appendix-c-glossary.md` and PFD `glossary.md` (its **State machine** entry) each
  get a one-clause `*State` note. PFD prose already conforms via `HoldState`; only the glossary clause is
  new.
- **Authoritative naming rules** — the **jbct-coder** agent and the **/jbct** skill (canonical per project
  setup). Run `/config-snapshot` before editing `~/.claude` config; preserve the jbct-coder header.

### 2. Shared-spine cross-reference (deferred from 4.2.0)

Add a one-line back-reference at the top of `appendix-c-glossary.md` pointing to *Process-First Design*'s
`glossary.md` for the methodology vocabulary — PFD owns the conceptual terms, JBCT's appendix keeps the
Pragmatica-level ones. This is the JBCT half of the shared spine, deferred when PFD's glossary shipped as
1.4.0 to avoid an immediate JBCT republish.
