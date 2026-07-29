# Review 2 — Disposition and proposed edits (2026-07-19)

Source: `architecture-synthesis-review.md` (external reviewer, second pass). Scope ruling
by user 2026-07-19: **Clusters A + B + accepted-D ride to 1.0; Cluster C (worked tie
example, verify-correct-rederive loop) and ch. 3 diagrams deferred post-1.0.**
Status: **APPLIED 2026-07-19, manuscript 0.3.15** — user approved drafts as written
("making book much stronger"). E1–E6 landed verbatim; E7 landed as two site-glossary
entries (press, inert) plus a bonus catch: the site glossary's Persistence Configuration
entry carried the same unscoped "only value" claim — aligned with the book fix.

## Verification findings (claims checked against manuscript before drafting)

- **"only value" (correctness item):** reviewer slightly misquoted; the sentence scoped
  "unique position in the whole ledger" but left "the only value that provides" absolute.
  Sibling passage three-profiles.md already used the scoped form. Fixed:
  "the *only* value in this ledger that provides". APPLIED.
- **"mechanically" frequency: REJECTED** — 4 occurrences in the whole manuscript. The
  reviewer likely perceived the *mechanism* family (~60), which is the book's core defined
  term and not prunable.
- **"standing bill" frequency: REJECTED** — 2 manuscript occurrences.
- **"presses" density: CONFIRMED** — genuine term of art (12 in ch. 4 alone). First use at
  two-teams.md rule 2 is self-defining but not marked as a term. E6 below.
- **PFD "open research question" pointer (item 2): FAILED VERIFICATION** — no such
  acknowledgment exists in PFD 2.1.0. (Closest: PFD cites Poltorak's geometric
  completeness argument for structural patterns — a different claim.) The empiricism gets
  stated directly in AS instead (E3), mirroring ch. 2's own "count is an output /
  criterion outranks the number" law.
- **Item 5 (local vs global): the book already argues stronger than the reviewer's
  requested concession** — derivation.md "A word on order" establishes route-independence
  (pressures fixed before resolution; mechanism count over the finished vector;
  enumeration as tiebreak). E1 cites it rather than conceding "locally minimal."
- **Item 9: selection rule 4 already refuses scalarization** ("not that costs add like
  numbers — they do not"). E1 completes it with the genuine-tie → refusals connection.
- **Item 7: ch. 1's "It is arithmetic" punchline stays** — ch. 3 rule 4 already pays that
  debt precisely, ch. 1 line 116 already tables the assumptions, and E1's "space is
  chosen" + "objective is not a scalar" paragraphs discharge the residue. No site edits.

## Per-item ruling summary

| # | Item | Ruling | Edit |
|---|------|--------|------|
| 1 | derived vs minimal | ACCEPT — name the math once, one section | E1 |
| 2 | axes axiomatic | ACCEPT modified — empiricism stated in AS; PFD pointer dropped (failed verification) | E3 |
| 3 | ledger formal structure | PARTIAL — schema articulated in-text; algebra declined (item 9 refutes it: costs don't scalarize) | E4 |
| 4 | containment undefined | ACCEPT — definition as ledger-discipline bullet | E2 |
| 5 | local vs global | ACCEPT modified — cite existing route-independence argument, don't concede localness | E1 |
| 6 | recovery asymmetry | ACCEPT — explicit defense in the axis entry | E5 |
| 7 | physics/arithmetic overstated | PARTIAL — discharged by E1 + existing rule-4/assumptions text; no punchline edits | E1 |
| 8 | search-space incompleteness | ACCEPT — "space is chosen, not complete" + ledger amendment | E1 |
| 9 | "cheapest" underspecified | ACCEPT — dominance/mechanism-count/tie chain named | E1 |
| 10 | too-clean examples | DEFERRED post-1.0 (no worked tie exists; cheapest route = tie inside an existing Part II run) |
| 11 | negative verification loop | DEFERRED post-1.0 (WORKED-FAILURE-CASE is the contradiction path, not this) |
| 12, 13 | praise | no action |
| ed. | mechanically / standing bill | REJECTED (counts) |
| ed. | press gloss | ACCEPT | E6 + site glossary entry |
| ed. | diagrams ch. 3 | DEFERRED post-1.0 |
| corr. | "only value" | APPLIED 2026-07-19 |

---

## E1 — derivation.md: new section after "What the procedure refuses to decide"

Placement: after "…judgment concentrates where it is genuinely owed." and before the
"What the procedure hands over is not yet a verdict…" hand-off, which becomes this
section's closing paragraph. Answers items 1, 5, 7, 8, 9.

NEW SECTION:

> ## What the procedure is, mathematically
>
> Stated in another discipline's vocabulary, `next_step` is **constrained optimization
> over a finite design space**. The answer sheet supplies the constraints. The ledger
> defines the space — six axes, a handful of atomic values each, composable by scope
> splits. The objective is cost; the output is the cheapest vector whose capability
> envelope contains the demands. A reader trained in operations research will recognize
> the shape at a glance, and the recognition is correct — nothing in the word
> *derivation* denies it. Naming it buys three boundary statements that would otherwise
> stay implicit.
>
> **The space is chosen, not complete.** The procedure selects among mechanisms the
> ledger prices; it cannot invent one. When the field produces a genuinely new mechanism
> — a storage class, a substrate, a containment trick like the coalescer that opened
> Chapter 3 — it enters as a ledger amendment: a new value or rung with its own
> provides/mechanism/costs entry, available to every derivation after that day and
> invisible to every one before. What the procedure guarantees is minimality *within the
> ledger it ran against* — a checkable claim — not minimality over all possible
> engineering, which no method can promise honestly.
>
> **The objective is not a scalar.** Costs arrive in currencies that do not convert —
> money, operating attention, latency floors, blast radius — and the selection rule
> already refuses the conversion: comparison is by mechanism count precisely because
> prices resist arithmetic. Where counting fails to settle it — two vectors, each cheaper
> in a currency the business must weigh — the procedure has found a genuine tie, and ties
> sit on the refusals list above by design. Weighing one currency against another is
> business preference; a formula that hid the weighing would be the fake precision this
> book exists to refuse.
>
> **The minimum is global over that space.** The order argument earlier in this chapter
> carries the weight — pressures fixed before any axis resolves, mechanisms counted over
> the finished vector, enumeration as the tiebreak that six axes keep cheap. A greedy
> walk trapped in local minima is what the procedure was built not to be.
>
> So the architecture does not follow from reality itself. It follows from the answers,
> over the ledger, up to the ties that come back priced — and each qualifier is visible
> on the page: the answers sit on the sheet with owners, the ledger sits in the appendix
> with costs, the ties return as menus. *Derivation* names what the optimization
> vocabulary leaves out: where the constraints come from. They are elicited facts rather
> than preferences, which is why two teams holding the same sheet and the same ledger
> reach the same vector, up to the ties the procedure refuses. Constrained optimization
> is what runs; derivation is why the result binds.

Instruments line gains: `· the optimization naming and its three boundaries`

## E2 — axes-and-ledger.md: containment definition (new ledger-discipline bullet)

After the "Costs are always-on" bullet:

> - **Containment is a claim about a bound.** A value or mechanism *contains* a demand
>   when it holds the demand's stated number — at its percentile, over its window, under
>   its declared shape — at the demand's scope, at the mechanism's always-on cost. The
>   claim is exactly as probabilistic as the bound it serves: a replica pool contains a
>   read-volume demand at P95 and at a named staleness, not absolutely; an admission gate
>   contains a contention demand up to its configured arrival rate and not beyond.
>   Whatever assumptions the bound carries, the containment claim inherits — which is why
>   every containment survives or dies at the exit gate's arithmetic rather than on the
>   ledger's word.

## E3 — axes-and-ledger.md: axes empiricism (insert in "Why six axes" paragraph)

Insert before "If a future derivation finds a security or organizational demand…":

> The count is an output here exactly as it was in Chapter 2: the criterion is the
> theory, six is its current result, and the result is empirical — earned against the
> derivation record, not proven from first principles. A completeness proof for a design
> space is not on offer, here or anywhere.

## E4 — axes-and-ledger.md: ledger schema articulated (expand "The axes" intro)

BEFORE: "Six axes, each with atomic values, each value a provides/mechanism/costs entry.
What follows renders the ledger at chapter altitude — the full entries live in the
reference cards."

AFTER:

> Six axes, each with atomic values, each value a **provides / mechanism / costs** entry
> — and the entry's three fields are exactly the joints the procedure will articulate:
> prune strikes a value when *provides* cannot meet a correctness demand; press tests
> demands against what *provides* holds at scope; resolve counts *mechanisms*; and
> *costs* is the always-on bill the whole selection minimizes. A richer schema — requires
> columns, excludes columns — would add nothing the three fields do not already encode:
> exclusion is the absence of a provides, and a prerequisite is a mechanism, priced like
> any other. What follows renders the ledger at chapter altitude — the full entries live
> in the reference cards.

## E5 — axes-and-ledger.md: recovery asymmetry defense (insert in recovery entry)

After "…rather than anyone's preferences." insert:

> It is also the axis a careful reader flags as the odd one out: the other five position
> *structure*; recovery prescribes *behavior under failure*. The asymmetry is real, and
> the seat is earned under the same criterion as the rest — systems with different
> recovery answers differ structurally before any technology is chosen: compensation
> paths are real code with real tests, design-out reshapes the domain model itself,
> degradation demands bounded windows with visible state. The exit gate's failure column
> consumes exactly this axis's choices, per operation. An axis is a dimension along which
> systems must differ; nothing requires the dimensions to be the same kind of thing.

## E6 — two-teams.md: press/inert marked as terms of art (rule 2)

BEFORE: "**Move an axis only when an answer is not contained by the current position.**
An answer the cheap position already satisfies presses on nothing; it is inert."

AFTER:

> **Move an axis only when an answer is not contained by the current position.** An
> answer the cheap position already satisfies **presses** on nothing; it is **inert**.
> Both words are load-bearing for the rest of the book, always in exactly this sense: a
> demand *presses* an axis when it escapes what the current position contains, and an
> answer that presses nothing is inert — recorded, and rightly ignored.

## E7 — site glossary (apply-time, rides the site-redesign working tree)

Add "press" (and "inert") entry to `website/content/glossary.md`, series-glossary
section, pointing at the AS book's usage.

## Deferred register (post-1.0)

- Item 10: one worked genuine tie, left standing, human preference choosing — cheapest
  route is a tie inside an existing Part II run, not a new system.
- Item 11: derive → verify → discover sheet mistake → correct → re-derive convergence
  demo — candidate home: coda in ch. 5 or the ch. 6 re-derivation.
- Diagrams: 1–2 derivation-pipeline figures for ch. 3/4.
