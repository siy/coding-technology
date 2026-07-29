# Fresh Read — Learner — AS 0.3.6

## Reader profile

I read `book-arch/` strictly in `root.md`'s spine order, front matter through back matter, as a mid-level engineer (~3 years) who has not internalized architecture theory and has not read the companion volume (*Process-First Design*). I did not jump ahead to resolve confusion; where a term arrived before its definition, I logged the confusion at that point and only later noted whether a subsequent chapter paid it off. Goal: could I actually run this method at work on Monday, and where did I almost put the book down trying to get there.

## Energy / bail-point curve

| Chapter | Load | Why |
|---|---|---|
| series-note.md | EASY | Short, orienting; one explicit forward-reference (recovery triple's long names) with a promised crosswalk. |
| acknowledgments.md | EASY | Skimmable front matter; dense with unglossed proper nouns and forward-referenced concepts, but nothing here demands comprehension yet. |
| two-teams.md | MANAGEABLE | Introduces answer sheet, six axes, three-plus-one rules, the "derivative" metaphor, and the claim-grade vocabulary all at once — but one worked example (the venue) carries all of it concretely. |
| answer-sheet.md | HIGH-LOAD | Nine questions, five driver modes, five gate disciplines, a three-way audit/replay/erasure split, and two families of second-row facts, in one chapter, plus a deferred shape-vocabulary list. First real point a learner could drown. |
| axes-and-ledger.md | HIGH-LOAD | The single densest chapter: six axes × 3–5 values × (provides/mechanism/cost), plus demand shapes, containment rungs, boundary pricing, the selection rule, and the axis-membership criterion, arriving directly after another dense chapter. Also the chapter where "the three-spaces model" is promised (by root.md and the chapter's own recap) but never actually taught under that name. |
| derivation.md | MANAGEABLE | Mostly assembles already-introduced pieces into `next_step`; genuinely new material (conflict rule, pressure matrix) is well-grounded in a concrete example. Relief after chapter 3. |
| verification.md | MANAGEABLE | Concrete, arithmetic-driven, reinforces rather than introduces; closes Part I cleanly. Rule 2's fan-out math needs a slow read but is well explained. |
| three-profiles.md | MANAGEABLE (compounding risk) | Rewarding if Part I stuck, but assumes full fluent recall of all six axes' vocabulary at once with no re-grounding — this is where a shaky Chapter 3 becomes visible and painful, especially in Profile 3's five-move rapid-fire walk. |
| derived-blind.md | MANAGEABLE–HIGH (length) | Individually excellent and the most narratively engaging chapter so far (the Stack Overflow "the derivation refused the taste and was right" reveal is a genuine highlight) — but four back-to-back real-system case studies, each loaded with a dozen-plus facts, risk fatigue by the fourth (Companies House), which also introduces a non-trivial statutory model right where attention is most likely flagging. |
| when-derivation-says-no.md | MANAGEABLE | Clean, single worked contradiction, pays off the "fourth rule" promise precisely; four halt-types land compactly. One of the clearer chapters. |
| derivative.md | EASY–MANAGEABLE | A relief chapter; finally cashes the "derivative" metaphor into three concrete, checkable cases (audit / increment / path). Best chapter-level payoff in the book so far. |
| pathfinding.md | MANAGEABLE | New model (nodes/edges/weights) grounded immediately in a vivid two-team extraction-order example; six indicators listed compactly but clearly. |
| brownfield.md | MANAGEABLE, high engagement | Dense — assumes full fluency in everything so far, no re-teaching — but real historical stakes (claimants, hardship, benefits stopped) make it the emotional and evidentiary high point of the book. |
| judgment.md | MANAGEABLE | Argument-dense but builds cleanly on established vocabulary. Two names/acronyms (VOID, the essay's author) stay unresolved in-body until the back matter. |
| closing.md | EASY | Satisfying wrap-up, no new load, clear call to action ("Monday"). One opaque personal-project aside, low stakes. |
| appendix-worksheet.md | EASY | Pure consolidation, no new concepts — genuinely useful as the safety net a struggling reader needed two chapters earlier. |
| appendix-reference-cards.md | EASY | Same — the desk-reference version of the whole book. |
| references.md | EASY | Back matter; incidentally resolves the VOID acronym and Allspaw's name, which the main text never spells out. |

**Where a learner would drown or bail:** answer-sheet.md and axes-and-ledger.md, back to back, right at the start — the highest concept-density of the book arrives before any payoff (Part II) has demonstrated it was worth the weight. A reader who survives those two chapters is very unlikely to bail again; nothing later reaches the same density without a concrete example doing the work of a definition.

## Undefined-on-first-use log

| term/concept | first used (chapter · phrase) | first defined (chapter, or NEVER) | gap hurt understanding? |
|---|---|---|---|
| answer sheet | two-teams.md · "The input is an **answer sheet**" | answer-sheet.md (whole chapter) | No — glossed on the spot, full chapter follows immediately |
| six axes | two-teams.md · full table given | axes-and-ledger.md (capabilities/costs) | No — values given early, ledger promised and delivered on schedule |
| containment / "presses on nothing" | two-teams.md · "An answer the cheap position already satisfies presses on nothing" | axes-and-ledger.md · "Containment rungs" | No — intuitive from context, formalized as promised |
| the derivative (subtitle metaphor) | two-teams.md · "It is a **derivative**: the next correct step..." | derivative.md (audit/increment/path) | Mild — an evocative but under-specified label carried for ten chapters before being cashed out concretely |
| driver modes (prune/select/isolate/split/bound) | answer-sheet.md | answer-sheet.md, same chapter | No, but five new categories land in one sitting |
| entry gate (priced/scoped/decomposed/triaged/surfaced) | answer-sheet.md | answer-sheet.md, same chapter | No, but dense |
| audit / replay / erasure decomposition | answer-sheet.md | answer-sheet.md, same paragraph | No — clean and concrete |
| "null position" → the null vector | answer-sheet.md · "an honest UNKNOWN derives a null position" | axes-and-ledger.md / derivation.md · "Start at the **null vector**" | No — concept usable immediately, formal name arrives one chapter later |
| demand shapes (volume/contention/burst/deadline) | answer-sheet.md · named in one clause, explicitly deferred | axes-and-ledger.md · "Demand shapes: what kind of pressure is this?" | Mild — one chapter of unglossed nouns, though the text flags the deferral honestly |
| change-driver facts / volatility structure | answer-sheet.md · "the same change-driver analysis that PFD builds its entire design method on" | answer-sheet.md, but only a one-sentence functional gloss — full depth lives in the companion book | Yes (MED) — recurs at load-bearing moments (e.g. brownfield.md's "volatility driver uncontained") without ever deepening inside this book |
| the three-spaces model | axes-and-ledger.md · footer tag only ("Instruments introduced: the three-spaces model...") | **NEVER**, in body prose | Yes (MED–HIGH) — promised by root.md's own chapter description, never actually taught under that name |
| cells | axes-and-ledger.md | axes-and-ledger.md, same sentence | No — clean |
| quorum commit | axes-and-ledger.md · throwaway example ("what quorum commit cannot avoid") | **NEVER** | Yes (LOW–MED) — reused twice more (three-profiles.md, when-derivation-says-no.md) as load-bearing shorthand for a latency floor, never mechanically explained |
| recovery triple / BER / FER | series-note.md · promised crosswalk | axes-and-ledger.md · crosswalk delivered exactly as promised | No — a model of a kept promise |
| the conflict rule ("fourth rule") | two-teams.md · deferred explicitly | derivation.md | No — kept promise |
| scaffolding step / the priced scaffold | when-derivation-says-no.md · "scaffolding step" | pathfinding.md · "the priced scaffold" | No — the book explicitly bridges the two names itself ("Chapter 8 called this the scaffolding step from the failure side; here it is...") |
| VOID (acronym) | judgment.md · "the VOID incident-data project" | references.md (back matter) | Yes (LOW) — resolved very late, easy to miss entirely |
| the essay's author (Allspaw) | judgment.md · "an influential 2010 essay," "the essay's author" | acknowledgments.md / references.md only | Low — not a comprehension blocker, but the chapter that uses the argument never names its source |
| RTL / netlist / gate-level | two-teams.md · hardware-synthesis analogy | **NEVER** | Low — supports an analogy, not core machinery |

## Open-promises ledger

| where promised | what | paid off? where |
|---|---|---|
| series-note.md | crosswalk for the recovery triple's long names | Yes — axes-and-ledger.md |
| two-teams.md | the fourth rule, for opposing pressures on one axis | Yes — derivation.md (the conflict rule) |
| two-teams.md | "that ledger is Chapter 3" (axis capabilities/costs) | Yes — axes-and-ledger.md |
| two-teams.md | "the derivation rules... Chapter 4, verification... Chapter 5" | Yes — derivation.md, verification.md |
| two-teams.md | four blind derivations, three-scale re-derivation | Yes — three-profiles.md, derived-blind.md |
| two-teams.md | "Chapter 12 is that inventory" (judgment) | Yes — judgment.md |
| answer-sheet.md | shape vocabulary (volume/contention/burst/deadline) | Yes — axes-and-ledger.md |
| answer-sheet.md | "what the derivation does when a contradiction survives... Chapter 8's subject" | Yes — when-derivation-says-no.md |
| axes-and-ledger.md | "the three-spaces model" | **No** — never delivered under that name anywhere in body prose |
| axes-and-ledger.md | conflict rule for genuinely different scopes | Yes — derivation.md |
| axes-and-ledger.md | "one of them by surviving an audit this book nearly retired it with; Part II tells that story" | Yes — derived-blind.md (Companies House: the read/write axis "kept its seat by earning it") |
| three-profiles.md | "Chapter 8 will show the method failing honestly" | Yes — when-derivation-says-no.md |
| when-derivation-says-no.md | "Chapter 11 contains a field specimen at national scale" | Yes — brownfield.md |
| when-derivation-says-no.md | infeasible-intermediate is "Part III's territory" | Yes — pathfinding.md (the priced scaffold) |
| derivative.md | "the disease the brownfield chapter will confront" | Yes — brownfield.md |
| derivative.md | "getting from a vector to a vector is a path problem" | Yes — pathfinding.md |
| pathfinding.md | "the next chapter drops that assumption... audited by an institution with no stake" | Yes — brownfield.md |
| brownfield.md | "Part IV names them" (the method's boundaries) | Yes — judgment.md |
| judgment.md | "one chapter remains: what to do with all of this on Monday" | Yes — closing.md |
| closing.md | "the counterexamples are yours to send" | Yes — references.md (github.com/siy/derivation-artifacts, issues invited) |

Of ~19 tracked promises, 18 pay off exactly where promised — an unusually disciplined structure. The one miss ("the three-spaces model") stands out precisely because everything else lands.

## Findings (typed, located, severity)

- [HIGH] axes-and-ledger.md · "Instruments introduced: the three-spaces model · the ledger and its discipline · ..." — forward-reference: "the three-spaces model" is promised by root.md's own description of this chapter and repeated in the chapter's closing recap, but is never introduced or defined under that name in the body prose. The closest the text comes is one unlabeled sentence ("Chapter 2 produced demands; Chapter 4 will run the procedure; between them sits the space where selection actually happens"). Reader expected: an explicit paragraph naming and defining the three spaces, the way every other recap-tagged instrument in the book gets one.
- [MED] answer-sheet.md · "The shape vocabulary that decides what a load answer can force — volume, burst, contention, deadline — belongs to the ledger" — forward-reference: four load-shape nouns are dropped and explicitly deferred a whole chapter. Reader expected: even a one-clause gloss per term (as axes-and-ledger.md later supplies) would have removed the dangling unknowns sooner.
- [MED] answer-sheet.md · "the same change-driver analysis that PFD builds its entire design method on" — unearned-assumption: "change-driver facts" / "volatility structure" get one sentence of functional gloss and are never developed further inside this book, though the series-note frames this volume as usable by an architect who "starts here," without the companion book. The concept recurs at load-bearing moments (brownfield.md's "volatility driver uncontained") without ever deepening. Reader expected: either a fuller in-book definition or an explicit "you don't need PFD for this" reassurance.
- [MED] axes-and-ledger.md · the full six-axis ledger (Deployment topology through Recovery) — pace-rush: six axes × 3–5 values × three properties each, plus demand shapes, containment rungs, boundary pricing, the selection rule, and the axis-membership criterion, all in one chapter, arriving directly after answer-sheet.md's own dense chapter. This is the single densest concentration of new taxonomy in the book. Reader expected: a mid-chapter recap, a chapter split, or an earlier pointer to the reference-card appendix as a safety net.
- [MED] derived-blind.md · four consecutive case studies (Stack Overflow / Shopify / Discord / Companies House) — pace-rush (cumulative): each case study is individually well-paced, but stacking four back-to-back, each carrying a dozen-plus domain facts, risks fatigue by the fourth; Companies House additionally introduces a non-trivial statutory model (layered corrections, retroactive legal fiction, redaction-by-law) exactly where attention is most likely to be flagging. Reader expected: a short recap between cases, or Companies House (which does the most conceptual work — settling whether the read/write axis deserves its seat) moved earlier in the sequence.
- [MED] three-profiles.md · Profile three's derivation walk ("The split," "Pricing," "Booking across regions," "The cores," "The burst") — lost-thread: five sub-moves fire in quick succession, each invoking Part I vocabulary (unique-container, unified runtime, polyglot, second-copy diagnostic, scope test) at full speed with no re-grounding. A reader whose grip on axes-and-ledger.md was already shaky loses the thread fastest exactly here, at the book's most complex worked example.
- [LOW] two-teams.md · "It is a derivative: the next correct step from where the system stands, given the forces acting on it now." — unearned-assumption: the calculus metaphor is asserted as the book's organizing idea before any of its concrete cash-outs (audit/increment/path, in derivative.md) exist to anchor it. It resolves cleanly ten chapters later, so the finding is about the gap, not a permanent failure.
- [LOW] two-teams.md · "RTL is a formal language and a timing constraint is a number" — unearned-assumption: RTL, netlist, and gate-level carry the hardware-synthesis analogy without definition. The argument survives even if these stay opaque, but a reader unfamiliar with chip design gets three unglossed technical nouns in one paragraph.
- [LOW] axes-and-ledger.md / three-profiles.md / when-derivation-says-no.md · "what quorum commit cannot avoid" / "quorum commit across three regions carries a physics floor" — forward-reference, never resolved: quorum commit is used three times across three chapters as load-bearing shorthand for a distributed-consensus latency floor, but the mechanism itself is never spelled out anywhere in the book.
- [LOW] judgment.md · "the VOID incident-data project confirmed it empirically" — forward-reference: VOID is used as an unglossed proper noun; the acronym (Verica Open Incident Database) is spelled out only in references.md, back matter many readers reach last or skip.
- [LOW] judgment.md · "an influential 2010 essay" / "the essay's author" — the chapter never names John Allspaw in-body (named only in acknowledgments.md and references.md). Not a comprehension blocker, but a reader who wants to trace the source mid-chapter can't from the chapter text alone.
- [LOW] closing.md · "a running gap-drain of deferred decisions, verified before building, merged under named hard-stops" — confusing-example: this aside about the author's own distributed-runtime project uses project-specific jargon outside the book's taught vocabulary and is never unpacked. Low stakes since it's a non-load-bearing disclosure, but it is the one opaque moment in an otherwise clear closing chapter.

No contradictions were found across the eighteen files read. [reconstruction] / UNVERIFIED labels (used throughout derived-blind.md and brownfield.md) were consistently well-handled — brief, clearly marked, and never disruptive to reading flow.

## Overall verdict

A motivated learner can follow this to the end and apply it — the worksheet and reference-card appendices genuinely condense the whole method to something usable "on Monday," and the discipline of every chapter closing with an explicit forward pointer the next chapter fulfills (18 of 19 tracked promises pay off exactly where promised) makes the book unusually easy to keep oriented in, chapter to chapter. The real risk is not at the end but near the beginning: answer-sheet.md and axes-and-ledger.md land back-to-back as the two densest chapters in the book, before Part II has shown why the density earns its keep, and that is where the largest fraction of readers would either bail or push through on faith alone. The one genuine structural gap — "the three-spaces model," promised twice (root.md's spine and the chapter's own recap) but never taught under that name — is a small thing to fix and worth fixing precisely because everything else in the book's promise-keeping is this reliable.

Fresh-read file: `/Users/sergiyyevtushenko/IdeaProjects/coding-technology/book-arch-meta/FRESH-READ-LEARNER.md`
