# Series Review — Disposition (v2, 2026-07-12)

*Sources: (1) `book-aether-meta/Three_Book_Series_Review.md` (summary-level, dispositioned 07-12 v1); (2) `book-arch-meta/series-review-feedback.md` (full-text review of all three volumes, P0–P3 tagged — the substantive one; its findings verified against the manuscript and BOOK-PLAN where checkable). This file is the single revision-pass input; v1's content is merged and superseded.*

**Status 2026-07-12: APPLIED.** The staged batches below landed in manuscript 0.3.0 (P0/P1/P2 items), 0.3.1 (mechanical passes), and 0.3.2 (sync echoes: Card 6 Rule 5; Card 1 + Appendix A change-driver facts — the appendix "Touches" of item 3.1 that 0.3.0 missed). User decisions: 1 (volatility option 1 + bridge) and 3 (LLM-operator foregrounding) confirmed by application; 2 resolved — replication repo live at github.com/siy/derivation-artifacts; 4 resolved — schema + spec now (`NEXT-STEP-SPEC.md`), engine post-ship as `jbct derive` (rc3 ticket in pragmatica); 5 (umbrella brand) and 6 (glossary timing) remain open. The user's full PDF read continues; structural verdict pending. Backlog sections at the tail remain live feeds.

## Verified drafting defects (fix first in revision pass)

- **[P0] 3.1 Volatility has no eliciting question.** Ch. 11's load-bearing answer (policy volatility) is producible by none of the nine questions. RESOLUTION (recommended, pending user confirm): **option 1 + bridge** — change-driver volatility joins the second row source beside domain-shape facts (matches how ch. 11 obtained it: process analysis, [reconstruction from the regulations record]); explicitly name PFD's change-driver analysis as the producing discipline (the layers story, delivered). NOT a tenth question: in UC it pressed only in combination with continuity (F24), failing independent-press. Touches: ch. 2 second-row-source section, ch. 11 one line, Appendix A, Card 1.
- **[P0→trivial] 2.4 Fifth halt dropped in drafting.** BOOK-PLAN ch. 8 spine has five (incl. "unexplored territory"); the chapter has four. Restore as its own halt (do not fold silently).

## P0 batch (cheap, high-value, all staged)

- **2.1 Question-count continuity:** ch. 2 names PFD explicitly as the eleven-question predecessor + one-line migration note ("what merged and why"). PFD-side supersession note = decision D at SHIP (the review overstates today's urgency: PFD readers aren't stale until the arch book publishes); D now has its concrete shape — module → design-time preview + canonical pointer; record supersessions in both revision histories.
- **2.2 Recovery-names crosswalk:** one sentence in ch. 3's recovery entry ("PFD and JBCT readers know these as BER, FER, design-out — same classes, renamed for self-description") + Card 2 note. Longer-term retrofit = PFD/JBCT backlog.
- **2.3 Phase vocabulary:** EXCISE "Phase-5/Phase-6" from the arch book (2 known sites: ch. 2 "Phase-5 axis", ch. 3 "Phase-6 choices"); replace with "an architecture axis" / "technology choice." Cleaner than defining the six-phase model for standalone readers. JBCT's migration-"Phase" collision → JBCT backlog (rename to stages/waves).
- **4.1 Pre-registration verifiability:** publish the artifact set (answer sheets, registered predictions, run transcripts incl. CH's quarantine rules and prompts, grading rubrics) + cite in References. HONESTY CONSTRAINT: public timestamps are prospective; the four existing runs' ordering is internally documented — the book states that plainly (attested vs verifiable), and the protocol adopts public registration for all future runs. USER decisions: public-repo creation + scrubbing pass (working files ≠ publication artifacts).
- **4.5 Operator disclosure:** the CH isolated operators WERE LLM agents under written protocols. FOREGROUND in ch. 7's methods note (mechanizability evidence; ties to PFD's AI predictions and "what benefits humans benefits AI"); publish prompts with 4.1's kit → replication kit. USER confirm on framing.

## P1 adoptions (staged for revision pass)

- **(from review 1) Fourth obligation in ch. 1's "What the book owes you":** *naming where judgment remains* (pointer to ch. 12) — preempts the admit-remaining-judgment critique on page 10 instead of page 60.
- **(from review 1) Claims legend:** the five-way taxonomy — derived / empirical / heuristic / contextual / implementation-specific — stated once in ch. 1 or the preface, with the existing provenance labels ([reconstruction], UNVERIFIED, registered/graded, evidence grades A/B/C) mapped onto it. Directly answers both reviews' overclaiming-determinism risk.
- **(from review 1) Assumptions register:** consolidate the scattered assumptions (enterprise backend; answers elicitable and priceable; ledger entries as mechanism physics; percentile regime) into one explicit statement, end of ch. 1 or start of ch. 2.
- **3.2 Fifth arithmetic rule:** mechanism count × standing ops cost vs cost envelope + operating headcount (bound-mode verification closes). Discord (4 engineers) = the worked example.
- **3.3 Erasure collision:** audit vs replay vs **erasure** three-way decomposition (ch. 2 gets the sharpened split; ch. 3 gets containment mechanisms: crypto-shredding, tombstoning, out-of-band PII stores); replay+erasure on one data class = sourced statutory contradiction reinforcing ch. 8 (keeps the constructed case as clean-room, adds the field specimen; pairs with 3.8's ch. 8↔11 bracket).
- **3.4 Name the strongest rejected axis candidate:** trust/tenancy/authn topology shown failing the membership criterion (isolation routes through blast-radius/cells; remainder is mechanism or technology choice) — or conceded open. Naming it makes six credible.
- **3.6 Synthesis disanalogy:** RTL is a formal input language; the sheet is elicited from humans who game it — the entry gate is the informal type-checker; synthesis lost to experts for years before winning (adoption expectations, in the book's voice).
- **4.2 Evidence grades:** A (isolated-operator) / B (registered-clean) / C (registered-contaminated) table atop ch. 7; label all four runs (SO: B; Shopify: B; Discord: C — the registered-revision honesty note already says so; CH: A).
- **4.3 Null-model baseline:** state what always-predict-the-boring-monolith would score; enumerate the wins over it (SO HA-replica-not-read-replicas; Shopify cells; CH read-split via convergence); acknowledge position non-independence. The answer favors the book — say it before a critic does.
- **2.5/2.7 Taxonomy + glossary:** driver modes become series-canonical (PFD adopts at next revision — backlog); crosswalk table lives in the shared glossary; canonical glossary at pragmatica.dev = series infrastructure, USER timing.

## P2/P3 adoptions (one-liners and sidebars, staged)

3.5 correlation caveat extended to Rule 2 (tails under correlated slowness) · 3.7 conflict-rule termination fixpoint (mechanism-level is the floor; opposition at the floor IS the contradiction) · 3.8 ch. 8 forward-reference to ch. 11's field specimen · 4.4 survivorship sentence in the protocol note · 6.2 socializing audit findings (half-page: "unforced," never "wrong"; blame-free by construction; revisit triggers as graceful exits) · 6.3 AI demand-shapes footnote (GPU contention = contention-shaped; token streaming = streaming value) · 6.4 rung-zero economics metal-vs-cloud sidebar · 2.6/2.8 reading-map + stated register decision in all three front matters (arch side now; PFD/JBCT at their revisions) · 6.1 legal: CC BY attribution must travel WITH any adapted edge material in-book (currently ch. 10 credit paragraph; if edge table enters an appendix, the block moves with it); no-warranty disclaimer in front matter; Loth References-note paragraph past Loth in the permissions pass; Zora coda neutrality preserved through edits.

## Declined

- **6.5 self-referential coda** — too cute, as the review itself suspects.
- **Mathematical ledger formalization** (review 1) — false precision is a named genre failure; redirected to the papers track.
- **3.1 option 2 (tenth question)** — fails independent-press on the only evidence in hand; revisit only if a future derivation shows volatility pressing alone.

## User decisions (batch for after the PDF verdict)

1. **Volatility resolution** — confirm option 1 + bridge (recommended above).
2. **Artifacts repo** — create public replication repo (scrubbed)? Prospective-registration protocol adoption?
3. **LLM-operator foregrounding** — confirm framing in ch. 7.
4. **`next_step` CLI** (review §5) — strategic: proves mechanizability, delivers PFD Prediction #1, creates the series interchange format + counterexample intake (decision H's destination, solved). Post-ship project vs parallel track — priority call. Existing jbct tooling lowers cost.
5. **Umbrella brand** (review 1): "Software Engineering by Derivation" / trilogy naming for the reading map (2.8 needs a referent).
6. **Canonical glossary at pragmatica.dev** — timing.

## Backlogs fed (parked per standing ruling)

- **PFD next revision:** driver modes adopted; recovery renames (BER/FER parenthetical for one edition); synthesis module → preview + pointer (at arch ship, decision D); running case study (item 7, reconfirmed twice); stakeholder-disagreement examples (check Edge Cases overlap first).
- **JBCT next revision:** migration "Phases" → stages/waves; universal-vs-Java separation; principles vs Pragmatica-library features; Spring-brownfield adoption path (fold legacy-adoption article).
- **Build tooling:** grep-check instrument-name consistency across chapters (review §7) — cheap regression guard, add to build-pdf.sh or a check script.
- **Production checklist (arch, pre-ship):** index; wide-table reflow check (ch. 6); title SEO check; permissions-pass scope extended per 6.1; disclosure-count regression (exactly 3 Aether mentions).

## Review §8 offered artifacts

All four (crosswalk table, answer-sheet schema, evidence-grade section, erasure section draft) producible in-session during the revision pass; no external dependency.
