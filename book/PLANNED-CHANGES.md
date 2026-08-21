# JBCT — Planned Changes (backlog)

> Queued JBCT changes. Not shipped until folded into `book/*.md`, the CHANGELOG, and the
> authoritative naming rules (the **jbct-coder** agent + the **/jbct** skill).

## Open items

### 1. `Option<List<T>>` joins the forbidden nestings (2026-08-21) — `ruled`, rides the next release

*Four Return Types* forbids `Promise<Result<T>>`, `Result<Result<T>>` and `Option<Option<T>>` under
**Forbidden (Double-Monad Nesting)**, and is silent on `Option<List<T>>`. That silence made cardinality
look like an open question about the shape vocabulary when it is not.

**Ruling (author, 2026-08-21): forbidden.** A collection already carries emptiness as a value, so the
`Option` is a second absence channel saying the same thing twice. The matrix's existing rule then
generalizes cleanly — *each concern appears at most once in a return type*, and emptiness is the
collection's own concern.

**The edit:** one row in the Forbidden table with that reason, and the matching line wherever the
allowed-nesting list is restated (`appendix-a-api-reference.md`, `ai-tools/skills/jbct/SKILL.md` via
`sync-book-blocks.py` if the region is book-owned).

**Cross-book:** the PFD half shipped in **PFD 2.6.0** — *Foundations*, *The shapes* now states that the
four shapes describe effects rather than contents, and that an empty collection is a value rather than
an absence. Until this lands, the published books disagree by one release.

## Shipped

- **4.2.1** (2026-06-30): the `*State` naming rule — state-machine lifecycle-state sums named
  `*State` with bare variants — landed in *Design Methodology* (ch02), the glossary (new *State /
  State Machine* entry), the PFD glossary (one-clause cross-reference), and the authoritative
  naming sources (the **jbct-coder** agent and the **/jbct** skill). The read-vs-write refinement of
  the shared-code rule (shared reads couple nothing; the one legitimate shared write per resource is
  the guarded transition) and the shared-spine glossary cross-reference (deferred from 4.2.0) shipped
  in the same release.
