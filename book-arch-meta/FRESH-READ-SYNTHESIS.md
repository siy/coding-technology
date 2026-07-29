# Fresh-Read Synthesis — AS 0.3.6 (2026-07-14)

*Reconciliation of three independent, voice-blind fresh reads (architect / learner /
skeptic — full reports in `FRESH-READ-{ARCHITECT,LEARNER,SKEPTIC}.md`) against the
private voice contract and the known-debts list. Cross-persona agreement is the
primary severity signal: a stumble two or three readers hit independently is a real
defect; a solo hit is weighed on its merits. Anchors for every Tier-A/B item verified
against the manuscript text. **Nothing applied — this is discussion-pass input**,
sibling to USER-READ-FEEDBACK item 1 (the 11→9 move).*

**Verdict, all three:** the book survives an adversarial read better than almost
anything in its genre — self-audits its instrument counts, discloses its conflicts,
keeps its misses on the record, grades its own evidence. No true bail point. The
issues below are concentrated, not diffuse.

---

## Tier A — Structural / thesis-level (author judgment, not polish)

### A1. The founding move is asserted, not defended — and the book's own best case argues against it
**Personas:** skeptic (2× HIGH). **Locus:** `two-teams.md` + `axes-and-ledger.md` "Why six axes and not sixteen?" + `brownfield.md`.
The move "two correct architectures share nothing → the domain didn't determine it →
*therefore* the priced answer-sheet procedure did" never rules out the obvious rivals:
**Conway's Law / org topology, contract structure, capital & risk appetite, sunk
infrastructure.** The completeness argument for six axes tests exactly one rejected
candidate (security topology) and never runs the membership criterion against an
organizational-topology candidate — the single most obvious rival given Ch. 1's own
puzzle. Worst: `brownfield.md`'s strongest quote — *"we were effectively on a waterfall
project, because it was a waterfall contract"* — is live evidence **for** the rival
causal account, sitting undigested in the method's proudest validation chapter.
**Fix options:** (a) engage the strongest rival explicitly — run the membership
criterion against an org-topology axis and show why it's downstream, ideally with a
case where the same answers under different org structures produced different
architectures; (b) qualify the scope: the method derives the *technical* vector;
whether an organization can *act* on it under its contracts/politics is a separate,
named boundary (this also repairs A-adjacent B-items). This is the deepest finding and
the one most in tension with the book's central claim.

### A2. Companies House "isolated operator" — the strongest evidence chapter overclaims (3-persona convergence)
**Personas:** architect (HIGH), skeptic (2× HIGH), learner (MED, fatigue). **Locus:** `derived-blind.md:13,53`.
The one chapter all three readers converged on. Three distinct real problems:
- **Parametric contamination unaddressed** *(verified)*: "the operator provably could
  not have seen the outcome" defends against *browsing / contextual* leakage (quarantine,
  demand-side-only sources). The operators are explicitly "language-model instance[s]";
  Companies House's own engineering blog is cited two paragraphs later. "Provably" claims
  a guarantee the protocol does not establish for an LLM's training memory.
- **The topology-miss absorption is unfalsifiable** in the direction reality erred:
  "the rule speaks to what *forces* topology; it can't predict what organizations choose
  beyond the forced minimum" can swallow *any* real over-decomposition. Nothing names
  what a genuine disconfirmation of "team size never presses topology" would look like.
- **Target selection ≠ execution blinding:** the system was chosen "to be decisive about
  the read axis either way"; a statutory registrar being read-heavy is near-foregone.
**Fix:** acknowledge the parametric limit (or use a model whose cutoff predates the cited
sources / a system postdating any plausible corpus); pre-name a real disconfirmation on
the over-decomposition side; separate the (genuinely strong) execution-blinding claim
from target selection. *Voice-reconcile:* keeping the miss is deliberate (evidence
register) — the critique is the absorption move and the "provably," not that the miss is
shown.

### A3. The payroll validation is invoked but never shown (voice-contract tension)
**Personas:** architect (HIGH), skeptic (HIGH). **Locus:** `derivative.md`, `pathfinding.md`.
The audit mechanism — Part III's central novel claim — rests on two summarizing
sentences and a pointer to the *PFD* volume. It is the **only** validation case in the
book never shown as an in-page worked table; every other case (three profiles, four
blind runs, the trading-platform halt, Universal Credit) gets full treatment.
*Voice-reconcile:* the overlay says payroll "belongs to PFD's Brownfield chapter; here
it appears only as callbacks — never re-told." So the defect is precise: the text uses a
callback **as load-bearing validation**, which the callback-only rule didn't sanction.
**Fix (aligned with the voice doc):** downgrade it to a pure callback and **drop it from
the validation tally**, OR show enough of the case in-book to be checkable at the book's
own standard. (Connects to A4's tally item and C-tier "nine derivations" mixing.)

### A4. Axis-visit-order confluence never established + "ordering principles" mislabel
**Personas:** skeptic (HIGH). **Locus:** `derivation.md` Step 4; spine blurb `root.md:15`.
The procedure never shows the *order* axes are resolved is safe — yet the ledger admits
axes interact ("deployment topology changes what persistence's boundary costs"). Every
worked derivation visits axes in the same fixed order without arguing that order is
canonical. Separately *(verified)*: `root.md`'s spine promises "ordering principles" for
`derivation.md`; the only such section is `pathfinding.md:26` — a *different* question
(temporal migration sequencing). **Fix:** prove order-independence (confluence) or state
and justify a canonical visit order; then fix the spine blurb so the promise points to
real content.

---

## Tier B — Concrete corrections (high-confidence; several are drop-in)

### B1. "three-spaces model" promised twice, never taught *(verified; voice violation; DROP-IN)*
**Personas:** learner (HIGH). **Locus:** `root.md:14`, `axes-and-ledger.md:70`.
Named by the spine and by the chapter's own *Instruments introduced* tag; never defined
under that name in body prose. The overlay requires every recap-tagged instrument to
have a home. **Fix:** add the one defining paragraph (Ch. 2 produced demands → Ch. 4 runs
the procedure → between them the selection space) under an explicit name, OR strike it
from the tag + spine. Cheap; no author judgment needed.

### B2. 99.5% mislabeled "three nines and a half" *(verified; DROP-IN)*
**Personas:** architect (MED). **Locus:** `verification.md:29`.
99.5% is *two* and a half nines (99.9% = three; 99.95% = three-and-a-half). The 44h/yr
figure and the other two rungs are correct — only the nickname is wrong, in the chapter
most invested in precision. **Fix:** "two nines and a half," or drop the nickname.

### B3. Aether "unified runtime" selected as a derivation output only in the self-authored example
**Personas:** architect (MED), skeptic (MED-HIGH). **Locus:** `three-profiles.md` Profile 3 ("the cores").
The author's disclosed commercial category is the pick in the single most rhetorically
important "hardest case" demo, with no shown cost comparison against multiple-deployables
— and it is selected **nowhere else** in the book (never in any blind/real run).
*Voice-reconcile:* the overlay's Aether rule says the value is disclosed "so the
derivations can be checked for favor: none requires it… never recommended by the
derivation." Here the derivation *does* recommend it, in the one unverifiable case — a
tension with the book's own stated rule. **Fix:** price the two-deployables alternative
beside it (as every other axis choice in the chapter is priced), or explicitly note the
value is never selected under checkable conditions.

### B4. "It is arithmetic" (Ch. 1) quietly downgraded to "mechanism-counting" (Ch. 3) *(verified)*
**Personas:** architect (MED), skeptic (MED). **Locus:** `two-teams.md:90` vs `axes-and-ledger.md:63`.
Ch. 1 sells the derivation as literal arithmetic ("It is arithmetic… a computable
error"); Ch. 3 admits the real criterion is an ordinal proxy ("fewest new mechanisms…
how 'cheapest' stays honest **when prices resist arithmetic**"). The softer version is
the honest one, but the downgrade is unflagged. *Voice-reconcile:* touches the named
belief-displacement "simplicity → arithmetic" and the punchline-home rule. **Fix:**
reconcile the two — either soften Ch. 1's claim to "computable" (not "arithmetic") or
have Ch. 3 explicitly acknowledge it is refining, not contradicting, the Ch. 1 framing.

### B5. "in both directions" overclaims; taste-miss folded into the derivation's miss-count
**Personas:** skeptic (HIGH), architect (LOW-MED). **Locus:** `derived-blind.md:5` + the scorecard.
*(verified phrase)* "the registered prediction and the derivation can disagree… It
happens twice below, in both directions." Per both readers, both realized blind cases
resolve the **same** direction (naive prior wrong, derivation right); no case shows the
derivation losing to a registered prediction. Relatedly, the Stack Overflow "miss" is a
miss of the author's *un-derived taste*, not of the derivation (which was right) — folding
it into "two misses kept" overstates how often the *method* failed. **Fix:** drop "in
both directions" (or find a real counter-case); separate "misses of prior/taste" from
"misses of the derivation" in the scorecard.

---

## Tier C — Located minor polish (LOW; quick, mostly drop-in)

- **Undefined-on-first-use** (learner): `quorum commit` — load-bearing across 3 chapters
  (`axes-and-ledger.md:9`, `three-profiles.md:51`, `when-derivation-says-no.md:21`), never
  mechanically defined; `VOID` — resolved only in back-matter `references.md`; **Allspaw**
  named only in acknowledgments/references, never in `judgment.md` where his argument is
  used; `gap-drain`/"named hard-stops" jargon in `closing.md`. Each: one-clause gloss at
  first use.
- **Nine-reads-as-eight** (architect LOW): `answer-sheet.md` groups two questions under one
  bound-mode subhead, so a reader tallying gets eight; count only resolves in the appendix.
  **→ fold into the 11→9 rework already in flight (USER-READ-FEEDBACK item 1).**
- **RTT inconsistency** (skeptic LOW): cross-region round-trip cited as "70–140 ms"
  (`when-derivation-says-no.md:21`) vs "80–150 ms" (`verification.md` anecdote). Reconcile
  or state why they differ.
- **three-profiles "prove" framing** (skeptic MED): the chapter claims proof-weight for
  self-authored, self-graded examples and concedes the limit only in its last paragraph.
  Move the concession to the opening, per the book's own "surface early" discipline.
- **`when-derivation-says-no.md`** (skeptic MED): only a *hard-physics* contradiction is
  worked (speed-of-light quorum floor); the commoner *soft-economic* contradiction (every
  option technically possible but unaffordable) is never shown. Also: the renegotiation
  menu is offered all-or-nothing, not scoped to the narrowest subset the book's own
  selection rule demands.
- **closing.md "Nine derivations… four blind"** (skeptic MED): the tally counts a
  constructed case (Ch. 8) and the cross-book payroll case at equal weight with real
  in-book runs. State the tally by evidentiary tier (self-authored / constructed / blind /
  externally cited). *Ties to A3.*
- **closing.md convergence anecdote** (skeptic MED): bundles one genuine independent
  discovery (Loth) with two ordinary persuasion cases (a debate opponent; a reader of the
  author's own derivation) as equal evidence of convergence. Separate the two kinds — the
  book already does this correctly for Loth in `references.md`.
- **RTL/netlist/gate-level** (learner LOW): three unglossed nouns in the Ch. 1
  hardware-synthesis analogy. Supports an analogy, not core machinery — optional.

---

## Signpost candidates (deliberate design that still tripped readers — not defects)

- **Front-loading density** (learner HIGH bail-zone + architect patience-risk):
  `answer-sheet.md` + `axes-and-ledger.md` land back-to-back as the two densest chapters,
  *before* Part II shows the weight was worth carrying. The hybrid discipline (live
  fragments) is meant to mitigate this; both readers say it isn't enough. **Not a rewrite
  — a re-grounding aid:** a mid-chapter recap in Ch. 3, an early pointer to the
  reference-card appendix as a safety net, and/or moving Companies House earlier in Ch. 7
  (learner's cumulative-fatigue point). Author call whether the density is acceptable
  given the two-to-three-sitting reading-mode target.

---

## Filtered out (deliberate per voice contract / already tracked — did NOT survive reconcile)

- Showing the derivation's **misses at full rhythm** — deliberate (evidence register).
  *(The scorecard-conflation critique in B5 is separate and survives.)*
- **UNVERIFIED / [reconstruction]** provenance labels — deliberate; all three readers
  independently confirmed they read cleanly.
- Payroll **not re-told** in-book — deliberate callback-only rule. *(Its use as
  validation, A3, is the surviving part.)*
- Em-dash sweep, mechanical-repetition pass — known debts, handled separately (correctly
  did not surface in these reads).

---

## Cross-persona convergence scoreboard

| Finding | Architect | Learner | Skeptic |
|---|---|---|---|
| A2 Companies House overclaim | HIGH | MED | HIGH×2 |
| A3 payroll shown-nowhere | HIGH | (change-driver depth) | HIGH |
| Front-loading density | patience | HIGH bail | — |
| B4 arithmetic→mechanism | MED | — | MED |
| B5 "both directions"/miss-count | LOW-MED | — | HIGH |
| B3 Aether unified-runtime pick | MED | — | MED-HIGH |
| C nine-reads-as-eight | LOW | — | — |
| A1 founding move | (survives read) | — | HIGH×2 |
| A4 confluence/ordering | — | — | HIGH |
| B1 three-spaces | — | HIGH | (ordering sibling) |

*The architect judged the instruments honest and the math sound; the skeptic — whose
whole job was the argument's integrity — is the source of most Tier-A structural findings.
Those two are not in conflict: the architect vouched for the toolkit's rigor, the skeptic
attacked the founding claim and the causal rivals. The learner owns pace and jargon.*
