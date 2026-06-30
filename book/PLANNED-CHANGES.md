# JBCT — Planned Changes (backlog)

> Queued JBCT changes. Not shipped until folded into `book/*.md`, the CHANGELOG, and the
> authoritative naming rules (the **jbct-coder** agent + the **/jbct** skill).

## Open items

_None._

## Shipped

- **4.2.1** (2026-06-30): the `*State` naming rule — state-machine lifecycle-state sums named
  `*State` with bare variants — landed in *Design Methodology* (ch02), the glossary (new *State /
  State Machine* entry), the PFD glossary (one-clause cross-reference), and the authoritative
  naming sources (the **jbct-coder** agent and the **/jbct** skill). The read-vs-write refinement of
  the shared-code rule (shared reads couple nothing; the one legitimate shared write per resource is
  the guarded transition) and the shared-spine glossary cross-reference (deferred from 4.2.0) shipped
  in the same release.
