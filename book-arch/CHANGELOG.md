# Changelog — Architecture Synthesis: The Next Correct Step

All notable manuscript changes. Format: keep-a-changelog-ish; the top entry's version is
what the build stamps on the PDF (single source of truth).

## [1.1.0] — 2026-08-01

Seven findings from building `next_step` against the book, applied. The engine was written
by following the book literally; every place it had to invent something, guess, or accept a
worked example that contradicted a card is a place the book was underspecified. This entry
is that list, closed.

### Added
- **Card 2b — the ledger, printed** (*Appendix B*): the per-value `provides / via / costs`
  entries for all six axes, plus the containment rungs and the boundary cost. `axes-and-ledger.md`
  had forward-referenced these to the reference cards since the chapter was written, and Card 2
  carried only axes and values, so the promise went unfulfilled and the priced entries existed
  only in working notes. Numbered **2b** deliberately: inserting a Card 3 would have shifted
  every "Card 5" and "Card 6" citation in the book, which is the exact failure the naming
  change below exists to prevent.
- **The sheet's normal form — one row per unit** (*The Answer Sheet*, under *Scoped*; echoed in
  Card 5's step 1). Release cadence, read-model divergence, and the regulation-and-volume pair
  all press on divergence *between* units, so a row answering for "the services" collectively
  has averaged away the only thing those axes read. Step 1 was called *normalize* and did not
  normalize.
- **The UNKNOWN rule, stated** (*The Six Axes and the Ledger*; Card 5): an answer nobody
  supplied presses nothing, is recorded with the position it leaves standing, and is never
  guessed. The blind derivations had been leaning on this rule for months and citing it as
  "rule 3" against a list that never contained it.
- **The mechanism note as a third press outcome** (Card 5): a demand contained by a *named
  mechanism* with no axis move — the regional profile's session-pinned reads. The card
  previously offered only contained-inert and uncontained-record, and the worked example
  produced a third thing.
- **Read-model divergence elicited** (Card 1, second row): whether a read wants a *different
  shape* from the write model, or only more of the same. Volume climbs the containment rungs;
  only divergence reaches the top one — and by the book's own membership criterion, a fact that
  decides an axis has to be asked for.

### Changed
- **Rules are cited by name, never by number** (*The Six Axes and the Ledger*, *Verification*,
  Card 5, Card 6, Appendix A). Four documents had ordered the selection rule four different
  ways, so "scope exclusion" was rule 5, rule 3, rule 2, or unnumbered depending on which one
  you held; a second family (Card 6's arithmetic) was separately cited as "Rule N"; and one
  citation resolved against no list at all. Each rule now carries a name, the names are the
  contract, and the ordered lists remain only where they teach. An index is a citation that
  expires.
- **Q2 decomposed** (Card 1): the error budget is **per service or path**, criticality is **per
  operation**. The card asked for both "per operation" while every worked example answered the
  first at system scope — the bundle the entry gate's *decomposed* discipline exists to catch,
  in the question list itself.
- **"Shape" disambiguated** (*The Six Axes and the Ledger*, *Three Profiles*): the read chain's
  top rung turns on **read-model divergence**, now named as such and kept clear of Card 3's
  demand shapes. Two instruments had been sharing one word, and only one of them had a question.
- **Part II opens with its experimental design** (*Three Profiles, One Domain*): hold the domain
  fixed, vary only the answer sheet, and anything that differs between the vectors has one
  possible source. This was previously a subordinate clause; a reader who finished the book
  asked what it had been demonstrating.

## [1.0.1] — 2026-07-24

Terminology pass, shared with the companion editions.

### Changed
- **Numbers no longer brand the label-only sets**: the driver modes, the cost-and-risk indicators, and the path constraints are introduced by name rather than by count. The counts that carry an argument are kept — the nine questions (an output of the membership criterion) and the six axes (with their completeness argument).
- **Recovery value name standardized**: the axis table's *design-the-failure-out* becomes *design-out*, matching the ledger and the rest of the series.

## [1.0.0] — 2026-07-19

First edition. Content as of 0.3.15 (fresh-read pass, user read feedback items 1–4,
external review 2 disposed — records in book-arch-meta/), plus:

### Fixed
- **Ch. 7 and References: replication-kit claims brought current with the live
  repository** (github.com/siy/derivation-artifacts). Ch. 7's disclosure said the kit
  "is being prepared" while the references already cited it; both now state exactly what
  is published — answer sheets, registered predictions, grading rubrics, the fourth
  run's derivation transcript and operator prompts verbatim, schema in summary form —
  with prospective-by-commit registration from the repository's creation onward, and
  the four pre-repository runs attested.

## [0.3.15] — 2026-07-19

### Added
- **Ch. 4: "What the procedure is, mathematically"** — new section naming `next_step` as
  constrained optimization over a finite design space, with its three boundaries stated:
  the space is chosen, not complete (new mechanisms enter as ledger amendments; minimality
  is guaranteed within the ledger run against, not over all possible engineering); the
  objective is not a scalar (currencies don't convert, mechanism count is the honest
  comparator, residual ties go to the refusals by design); the minimum is global over the
  space (the order argument carries the weight). Closes with why "derivation" still earns
  its name: the constraints are elicited facts. Answers external review 2 items 1/5/7/8/9.
- **Ch. 3: containment defined** as a ledger-discipline bullet — a claim about a bound,
  exactly as probabilistic as the bound it serves, inheriting the bound's assumptions,
  surviving or dying at the exit gate's arithmetic (review item 4).
- **Ch. 3: recovery axis asymmetry owned** in the entry — five axes position structure,
  recovery prescribes behavior under failure; seat earned under the same membership
  criterion; "nothing requires the dimensions to be the same kind of thing" (review item 6).

### Changed
- **Ch. 3: axes empiricism stated** — count-is-output mirrored from Ch. 2 into the
  membership-criterion paragraph ("the criterion is the theory, six is its current
  result"); no completeness proof claimed (review item 2; reviewer's suggested PFD
  pointer dropped — the referenced PFD discussion does not exist).
- **Ch. 3: ledger schema articulated** — the provides/mechanism/costs fields named as the
  joints the procedure articulates; requires/excludes columns declined in-text (exclusion
  is the absence of a provides; a prerequisite is a mechanism) (review item 3).
- **Ch. 1: press/inert marked as terms of art** at selection rule 2 (review editorial);
  site glossary gains both entries.

### Fixed
- **Ch. 3: distributed-shared-store uniqueness claim scoped to the ledger** ("the only
  value *in this ledger* that provides…") — review's correctness item; the sibling
  passage in Ch. 6 already used the scoped form. Site glossary entry aligned.

Review record: `book-arch-meta/architecture-synthesis-review.md` (verbatim),
`REVIEW-2-DISPOSITION.md` (per-item rulings incl. rejections with evidence and the
post-1.0 deferred register: worked tie, verify-correct-rederive loop, diagrams).

## [0.3.14] — 2026-07-19

### Changed
- **Ch. 5 budget arithmetic restructured into math → example pairs** (user proposal during
  the read). Each rule now carries its law sentence, one set-off formula line in Unicode
  notation (no LaTeX math mode — portable to every downstream format), and the worked
  example + discussion. Rules 1/2/4 get full formulas (path-floor subtraction; series
  slow-fraction addition + p/n allowance + fan-out 1 − (1 − p)ⁿ; series/parallel
  availability products with plugged numbers 0.9999⁵ and 1 − 0.001²); rule 3 gets its
  composition rule-form; rule 5 gets its inequality (Σ mechanism bills ≤ operating
  envelope) and keeps its "comparison rather than a formula" character. Rule 1's worked
  example is now the chapter's opening quote contract itself — the ninety-second
  arithmetic the cold open says nobody ran (200 − 80…150 geography = 50–120 ms for all
  software), closing the loop instead of gesturing at it.

## [0.3.13] — 2026-07-19

### Fixed
- **Ch. 4's closing hook no longer pre-states Ch. 5's thesis** (user read finding, same
  ruling as 0.3.12: reader-experienced repetition wins). The chapter close and
  Verification's opening both said "a derived vector is a set of claims — this guarantee,
  from this mechanism, within this budget" plus the wrong-vectors/fake-answers function,
  one page apart. The definitional home is Verification, whose two checks the triplet
  maps onto; Ch. 4's close is now a lean hand-off — every position is a claim, claims get
  checked, the last instrument does the checking.

## [0.3.12] — 2026-07-17

### Fixed
- **Ch. 4 Step 0 cites the null vector by name** instead of re-enumerating its five values
  (user read finding; anti-repetition rule 3 — the null vector's home is Ch. 3's selection
  rule, the reference cards carry the verbatim list). Reverses the 0.3.1 repetition-pass
  ruling that had kept the enumeration as the procedure chapter's own artifact: the reader
  experiences it as repetition, and the reader wins. Step 0 keeps what is new at its site —
  recovery has no null, the living-system starting position, and the measurement-precondition
  defense.

## [0.3.11] — 2026-07-15

### Changed
- **Ch. 3, deployment-topology entry: the delivery plumbing priced** (user finding during
  the read). The artifact's bill extends beyond release coupling: pipelines, release
  processes, and dependency streams multiply per artifact, and independent cadences buy a
  **version matrix** — production runs a mixture of versions through every rollout window,
  so the tested composition is no longer the only one running and cross-artifact
  compatibility becomes a standing bill (contract tests, deprecation windows, N-by-M
  pairs). Priced in both directions: the single artifact's train grows with the codebase
  (one test gate every team's merge waits behind), contained a long way by module-aware
  builds and affected-only test selection, and capping out as a *cadence* demand — pressing
  the axis through the answer sheet rather than around it. The single deployable's
  provides-line gains "one composition in production — the composition you test is the
  composition that runs."
- **Card 2** billing note echo: delivery plumbing bills to the artifact.

## [0.3.10] — 2026-07-15

### Changed
- **Series note:** supersession sentence updated for the convergence landing — PFD 2.1.0 asks
  the same nine questions; earlier editions' eleven noted as historical, transition story in
  PFD's changelog.

## [0.3.9] — 2026-07-15

### Changed
- **Ch. 2: the eleven→nine audit narrative moved out** (user read-feedback item 1). The chapter
  keeps the membership criterion, its provenance in one clause, and the count-is-output law;
  the historical arc (which questions merged and why; the PFD-reader migration note) relocates
  to PFD's revision history — specified in `book-pfd-meta/PLANNED-CHANGES.md` item 12; both
  books converge to nine at PFD's next revision; the published articles stay at eleven
  (historical). Also resolves the fresh-read "evidentiary IOU" on the unshown audit claim.
- **Series note** now carries the cross-book note itself (pre-convergence PFD editions ask
  eleven where this book asks nine; PFD's revision history has the transition) — replacing the
  pointer to a ch. 2 migration note that no longer exists.
- **Ch. 1** promise updated to match: the next chapter holds questions to a membership
  criterion (no longer "watch that audit happen").

### Fixed (queued fresh-read findings, folded into the same pass)
- **Nine reads as nine:** the bound-mode questions split into their two entries (Release
  structure · The cost and capacity envelope) — the in-prose tally now matches the count.
- **Shape vocabulary glossed at first mention** (volume / burst / contention / deadline, one
  clause each); the ledger keeps the full treatment.
- **Change-driver facts:** explicit reassurance that the sheet does not require the companion
  book — the question as stated produces the row; PFD owns the systematic method.

## [0.3.8] — 2026-07-15

### Changed
- **Ch. 3, deployment-topology entry rewritten around the artifact/unit distinction** (user
  finding during the read: role-selective activation — one artifact, handlers/process classes
  enabled per instance group — defeats the old "whole-unit scaling" cost line). Costs now
  bill to their countable: release coupling → artifact; scaling shape + runtime blast →
  unit; network-in-crossing → boundaries the composition actually crosses (largely pre-paid
  on an event substrate). The role-selective form named with its record (web/worker
  processes, database node roles) and its honest limits (one release train; runtime disable
  = kill-switch, not cadence; dormant-handler wake-up shares the envelope). Unified runtime
  re-grounded: the role-selective form is its hand-rolled ancestor; the platform class is
  young, the pattern is not (shrinks the disclosure's exposure). Multiple deployables narrow
  to what only artifact multiplicity buys. Validation record checked: no graded derivation
  flips (every derived split also cites cadence, polyglot, or blast; Profile 3's cores pick
  is now better-cited — direct-call coupling is what forces the productized form).
- **Card 2** synced: role-selective activation listed; artifact/unit billing note added.

## [0.3.7] — 2026-07-14

### Added
- **Ch. 3:** the three-spaces model named and defined (demand / selection / position spaces) —
  closes the spine + instruments-tag promise; **team topology** run against the
  axis-membership criterion as the second shown rejection (Conway's-Law candidate → existing
  axes + unforced positions).
- **Ch. 4:** order-independence paragraph — Step 4 stated as computing Ch. 3's global
  cheapest-containing vector; the mechanism count is global over the finished vector.
- **Ch. 7:** methods-note honesty extensions — parametric-memory limit named (procedural vs
  informational blindness; the topology miss as contamination counter-evidence);
  target-selection vs execution-blinding distinction; pre-committed disconfirmations for the
  topology rule ("provably" dropped from prose and grade table).
- **Ch. 9:** in-book worked audit + increment on the Chapter 6 enterprise profile (replay
  mandate lapses → event-sourced pricing recedes; the quote path's separation stays, its
  citations intact); payroll case reweighted as imported at-scale evidence, callback-only.
- **Ch. 12:** fourth scope wall — acting on the vector (derivability ≠ authority to act;
  Universal Credit as the exhibit).

### Changed
- **Ch. 1:** founding move sharpened — rival drivers (team structure, contracts, risk
  appetite) named and folded in as inputs-or-debt before "there is a better account."
- **Ch. 11:** waterfall-contract epitaph extended into the rival-account exhibit (the
  contract stood in for a derivation; the audit trail is the bill).
- **Ch. 6:** author-graded concession moved to the chapter door (exit line becomes a
  callback); unified-runtime pick annotated (sole selection of the disclosed value in the
  book; never demanded by the blind runs).
- **Ch. 7:** "in both directions" dropped (both realized cases resolved the same way);
  scorecard splits the misses by kind (author's prior vs derivation's own); sharper-baseline
  concession added (an architect's registered judgment is the real rival — exists once in
  this set, the replication kit invites the corpus); rung-zero culture tied back to Ch. 3's
  unnamed mention.
- **Ch. 8:** bend-A2 branch names the scope discipline (a bend applies at the narrowest
  relieving scope; one market leaves none to cut).
- **Closing:** tally restated by evidentiary kind; the two misses split; convergence
  anecdote graded by evidence kind (contact vs independent); gap-drain
  disclosure de-jargoned.
- **Ch. 3:** "mechanism-counting" explicitly stated as the precise sense of Ch. 1's
  "arithmetic" (refinement, not retreat); quorum commit glossed at first use.

### Fixed
- **Ch. 5:** 99.5% correctly labeled two nines and a half (was "three nines and a half").
- **Ch. 8:** cross-region RTT aligned to Ch. 5's 80–150 ms (was 70–140).
- **Spine:** derivation.md blurb no longer promises "ordering principles" (that section
  belongs to Ch. 10); now says what the chapter states (why axis order does not matter);
  brownfield blurb reframed retrospective ("read retrospectively against," not "graded by").
- **Ch. 12:** VOID spelled out at first use; Allspaw named in-body.

### Verification round (skeptic re-read of the changed passages: 12 closed, 5 improved)
- **Ch. 1:** recovery axis flags its input class at first use (domain-shape facts, the
  second input class Ch. 2 formalizes); "prices them as debt" softened to "a price"
  (the debt judgment lives in Ch. 9, with its falsifier).
- **Ch. 9:** pre-committed disconfirmation for "unforced = debt" (option value exercised →
  missing question, sheet grows) — the same medicine the topology rule got; closes the
  cross-cutting unfalsifiability the verify pass named.
- **Ch. 11:** the £34–40M counterfactual scoped to the missing *diagnosis*, with an explicit
  pointer to Part IV's acting-on-the-vector wall (the two chapters no longer pass in silence).
- **Ch. 7:** Discord's C-grade re-flagged at point of use in the cross-findings.

*(Source: three-persona voice-blind fresh read, reconciled in
`../book-arch-meta/FRESH-READ-SYNTHESIS.md`; edits per `../book-arch-meta/PROPOSED-EDITS.md`,
forks A1=C, A4=C, three-spaces=demand/selection/position, RTT=80–150 user-ruled 2026-07-14.)*

## [0.3.6] — 2026-07-13

### Changed
- **References, Loth note simplified at his request** ("stay on the safe side, don't
  overstate until my work is more stable"): the proofs-audit clause removed; the stated
  reason is now his own still-under-development framing; readers invited to judge the
  relation themselves. Nothing promised on either side.

## [0.3.5] — 2026-07-12

### Added
- **Ch. 10 epigraph:** Loïc Veyssière's comment, used with permission (granted 2026-07-12).

## [0.3.4] — 2026-07-12

### Added
- **References:** the replication-kit repository cited (github.com/siy/derivation-artifacts),
  with the attested-vs-prospective registration distinction stated — completes review item
  4.1's "cite in References" now that the repository exists.

## [0.3.3] — 2026-07-12

### Changed
- **Real cover replaces the placeholder** ("the vector" concept): six axes, candidate values
  as open ticks, the derived vector as one bold polyline — in the series visual language
  (black line-art on warm off-white, scattered shapes, one spot of colour). The amber dot is
  the leftmost position: PFD's output is this book's origin (user ruling on series-token
  semantics). Concepts A ("unfolding point") and C ("pathfinding lattice") retained in the
  meta dir as the design record.

## [0.3.2] — 2026-07-12

### Fixed
- **Sync echoes dropped by 0.3.0's staging:** Card 6 gains Rule 5's echo (mechanism bill
  vs operating envelope); Card 1 and Appendix A gain the change-driver-facts second-row
  extension (the disposition's 3.1 "Touches" items for the appendices).

## [0.3.1] — 2026-07-12

### Fixed
- **Ch. 11:** NAO 2018 hardship attribution corrected to the source's wording — design and
  implementation issues combined, not rollout pace (dual-state-duration reading stays as the
  chapter's own inference). Sourcing debt closed: NAO 2018 quotes, identity-assurance wording,
  and the £2.4bn reference verified verbatim against primary sources (corpus updated);
  amendment-frequency confirmed correctly [reconstruction]-labeled (no primary verbatim exists).
- **Repetition pass (voice anti-repetition rule 4):** "an SLO you haven't priced is a wish"
  re-landing in ch. 2 compressed to attribution; ch. 6 audit/replay definitional restatement
  compressed to verdicts-plus-name. Ch. 4's Step-0 null-vector enumeration ruled legitimate
  (mechanics-as-artifacts; procedure's home chapter).

### Changed
- **Em-dash budget pass (voice §5)** across all 13 chapters: 547 → 412, punctuation-only
  conversions (parentheticals → commas/parentheses, clause-joins → colons/periods); structural
  leads, artifact notation, and quoted material exempt; word streams verified unchanged.

## [0.3.0] — 2026-07-12

### Added
- **Series front matter** (`series-note.md`): the layers pipeline, reading map, register
  note, PFD-module supersession note, no-warranty disclaimer.
- **Ch. 1:** synthesis disanalogy (formal inputs vs elicited answers; adoption-curve honesty);
  fourth obligation (naming where judgment remains); claims legend (derived / empirical /
  heuristic / contextual); assumptions statement.
- **Ch. 2:** PFD named as the eleven-question predecessor + migration note; the audit/replay/
  **erasure** three-way decomposition; second row source extended with **change-driver facts**
  (the PFD seam — closes the volatility-input gap the series review found).
- **Ch. 3:** recovery-triple unification (long names canonical prose, BER/FER official short
  forms — series ruling); erasure containment mechanisms (scope exclusion, crypto-shredding,
  tombstoning) + the statutory replay-vs-erasure contradiction; security topology shown
  failing the axis-membership criterion; AI-era demand-shape note; rung-zero economics
  metal-vs-cloud.
- **Ch. 4:** decomposition termination fixpoint (mechanism level is the floor).
- **Ch. 5:** Rule 5 (mechanism bill vs operating envelope — bound-mode verification closes);
  correlation caveat extended to Rule 2.
- **Ch. 7:** evidence grades A/B/C with per-run labels; attested-vs-verifiable registration
  disclosure + replication-kit commitment; survivorship-selection note; null-model baseline
  ("always predict the boring monolith") with the wins over it enumerated; **isolated
  operators disclosed as AI agents, foregrounded as mechanizability evidence**.
- **Ch. 8:** fifth halt restored (unexplored territory — the instrument-gap halt); statutory
  contradiction + ch. 11 field-specimen bracket around the constructed case.
- **Ch. 9:** socializing audit findings ("unforced," never "wrong"; blame-free by construction;
  revisit triggers as graceful exits).

### Changed
- "Phase-5/Phase-6" vocabulary excised (standalone-reader fix); reference cards carry the
  BER/FER short forms; build spine includes the series note.

## [0.2.0] — 2026-07-11

### Added
- **Full first draft, all chapters.** Part 0 (Two Teams, with the miniature derivation),
  Part I (Answer Sheet, Axes & Ledger, Derivation, Verification), Part II (Three Profiles,
  Systems Nobody Asked Us to Derive, When the Derivation Says No), Part III (Derivative,
  Pathfinding, Brownfield/Universal Credit), Part IV (Judgment, Closing), acknowledgments,
  Appendix A (worksheet), Appendix B (reference cards), references.
- Voice: per the shared base + arch overlay (hybrid discipline, anti-repetition rules,
  positive-formulation rule, mechanics-as-artifacts, evidence register, rules-exercised tags).

## [0.1.0] — 2026-07-11

### Added
- Book scaffold at writing-go: reading-order spine (`root.md`), 17 chapter/appendix
  stubs matching the confirmed 13-chapter plan (BOOK-PLAN decisions A–C, G resolved),
  build script (`../book-arch-meta/build-pdf.sh`, adapted from the PFD pattern,
  no-despine), placeholder cover.
- All chapter material assembled and validated pre-scaffold: ledger v0.2, worksheet
  v0.2, four blind derivations (10/2/2 of 14 on Companies House under the
  isolated-operator protocol), Universal Credit brownfield case with verified corpus,
  17-edge Metapatterns transition list (CC BY 4.0).
