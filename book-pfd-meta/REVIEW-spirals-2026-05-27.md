# Review — Spiral Passes 1–3 (2026-05-27)

Reviewer: Sergiy + Claude (oss session). Reviewed current versions of `spiral-1-use-case.md`,
`spiral-2-workflow.md`, `spiral-3-subsystem.md`. This note covers **only what is not yet
addressed** plus one structural finding. Items from the prior review that already landed are
listed first so they are not re-litigated.

---

## 0. Prior feedback — confirmed landed (no action)

The May 26 revisions absorbed these. Flagging so they are not re-opened:

- Pass 1: "Why these four" shapes compressed to one paragraph (was redundant two-subsection).
- Pass 1: Aspect wrapping-order detail deferred to Architecture Synthesis (was previewing workflow content).
- Pass 1/2/3: notation note added at first code block ("pseudo-code for shapes, Java for composition").
- Pass 2: `InternalConsistencyError` now defined inline (line ~85).
- Pass 2: `Workflow.WithPromise` explained as methodology-level type (line ~91).
- Pass 2: `CompensationAspect.builder` flagged as illustrative, not a library API (line ~139).
- Pass 2: workflow SLO numbers marked illustrative + sourced to Phase-4 elicitation (line ~399).

Good responsiveness. The rest of this note is new.

---

## 1. Headline finding — the chapter-size taper is a feature; make it intentional

Word counts: **Pass 1 = 8,373 · Pass 2 = 8,344 · Pass 3 = 4,849.**

Not a smooth taper — flat across 1→2, then a **−42% cliff at 3**. That knee is informative,
not accidental.

**Interpretation.** The shrinkage is the telescope thesis demonstrating itself physically. The
book claims the same vocabulary (six properties, six patterns, four shapes, three recovery
classes) recurs at every altitude. *If that is true*, each successive chapter has less to teach,
because the reader already owns the vocabulary — only the **delta** at each altitude needs new
words. The knee between Pass 2 and Pass 3 marks exactly where the methodology **stops
introducing new primitives and starts only re-applying them**.

This is the most persuasive meta-argument the book can make about itself. A skeptic's natural
objection to "same vocabulary at every level" is *"you've just relabeled things to fit."* The
shrinking chapters are the rebuttal that can't be faked: if the telescope were rhetorical, each
altitude would need fresh apparatus and chapters would grow or hold. They shrink.

**Action — make the taper explicit (two short insertions):**
1. Where the spiral begins (Foundations or Pass 1 intro): one line — "Each pass is shorter than
   the last. That is the telescope working, not us running short of things to say."
2. In the book's closing/retrospective: the clearest evidence the telescope is real is the shape
   of this book — each pass had less new vocabulary to introduce than the one before.

**Discipline to hold:** chapter length must track **delta-size, never a target**. Pass 3 is
short because its delta is genuinely small (verified — it still fully covers its altitude). The
failure mode is a later chapter shrinking from fatigue rather than from the material thinning.

---

## 2. Primary structural recommendation — the cohesion/change-driver criterion is over-taught

**The observation.** Pass 2's near-equality with Pass 1 is partly real concept-density and
partly a factoring artifact. Be careful not to over-attribute: workflow altitude is genuinely
the concept-rich altitude — saga-as-composite, time-as-decay, the compensation taxonomy
(domain-internal vs domain-escaping), residuals, and the compensation Aspect *all* debut at
Pass 2. That payload is large on its own and earns its weight. Cutting cohesion alone will not
restore strict monotonicity, and shouldn't be expected to.

**But there is one genuine redundancy.** The change-driver / cohesion criterion — "what business
change forces all of these to change together?" — is a **primitive of the methodology**. It is
the *same test* at every altitude; Pass 3 itself says so best: "the same question asked of larger
candidate sets." Like every primitive, it should be **introduced once and re-applied**, not
re-developed. Right now it is developed at length **twice**:
- Pass 2, "Workflows emerge from multiplicity" (~5 paragraphs incl. the Yannick Loth /
  Independent Variation Principle citation, and the "sharper than 'these feel related'" elaboration).
- Pass 3, "Subsystems emerge from clustering" (~the change-driver test re-explained from scratch,
  incl. the refund ambiguous-case example).

**Recommended factoring (respects "show, don't assert"):**

- **Pass 2 is the rightful introduction site** — cohesion genuinely first arises here (you cannot
  cluster a single use case; Pass 1 had one). Keep the full introduction *and* the Yannick Loth
  citation; that external-convergence validation is valuable. This weight is earned.
- **Pass 3 should NOT re-introduce the test.** Open the "Subsystems emerge from clustering"
  section with "the same test, one altitude up — nothing new in the criterion, only the
  granularity" and spend words **only on what is genuinely new at subsystem altitude**: the
  *refund ambiguous-case resolution* (noun points to pricing, force points to booking, the force
  wins). That example is a real new demonstration and should stay; the re-derivation of the test
  around it should go. This is the cleaner win and it also reinforces the telescope (even the
  grouping criterion obeys "introduce once, re-apply").
- **Defer "Why the decomposition rewards itself" (Pass 2, ~lines 151–160) to Architecture
  Synthesis.** This is the one piece of Pass 2 cohesion material that is *not* a workflow-altitude
  concept — it's a *when-to-decompose* judgment (distinct triggers / distinct SLOs / non-trivial
  compensation / independent operation). That is an architecture decision, not a definition of
  what a workflow is. Moving it deflates Pass 2 toward its natural delta-size without losing the
  introduction of cohesion itself.

Net effect: Pass 2 keeps its earned concept-density and its rightful introduction of cohesion;
the cross-chapter redundancy (2↔3) collapses; the "when to decompose" judgment lands where the
other deferred decisions already live. The taper moves toward monotone for the *right* reason.

---

## 3. The hourglass prediction — confirm Architecture Synthesis reverses the taper

The taper predicts **Pass 4 (system altitude) is shorter still** — its delta is technical
cross-cutting going load-bearing + resource provisioning + the assembly-vs-provisioning split.
A short Pass 4 is *correct*, but risks an anticlimactic finale if it is also the book's last word.

Every spiral pass defers decisions to Architecture Synthesis ("the full treatment belongs to…").
Synthesis is **integrative, not delta-based** — it pays all those deferred debts at once, so it
should be **large**. That gives the book an **hourglass**: heavy Foundations → spiral passes
tapering to a point at system altitude → Synthesis swelling back out as the payoff.

Worth confirming this is the intended shape in the book spec so it is deliberate rather than
emergent. If Pass 4 + Synthesis are meant to be the back half, the deferred-decision inventory
(every "belongs to Architecture Synthesis" promise across Passes 1–3) is effectively Synthesis's
table of contents — worth collecting into a checklist so none are dropped.

---

## 4. Pass 3 specific items

1. **SLO thread goes missing (decide: carry up or retire).** Pass 1 has per-use-case SLOs;
   Pass 2 explicitly carries workflow-level SLOs up. Pass 3's "Architecture surfaces" covers
   boundaries, persistence, consistency, coordination — but **no subsystem-level SLO treatment**.
   A reader tracking that thread across passes will read the absence as an oversight. Either carry
   it up (a subsystem SLO is the *envelope* of its workflows' SLOs — derived, not declared anew)
   or retire it with one explicit line. Right now it is silently absent.
2. **"The current price is a fold over the log"** (pricing subsystem) assumes event-sourcing /
   fold fluency. If Foundations covers it, fine; if not, a half-clause gloss helps a reader strong
   on backend but new to the idiom.
3. **The reconciliation sweep** in `ChangeSeat` (settling the briefly-two-seats residual) reads as
   dropped in. A half-sentence tying it to the sweep-workflow shape from Pass 2 closes it.
4. **Pattern-distribution section is slightly more listy** than Passes 1–2's. Acceptable given
   there's less new to say — but it's the one place the prose dips toward checklist. Optional.

---

## 5. Cross-reference opportunities (low priority, high polish)

The book is a synthesis of work the target audience may already have engaged with. Article
citations strengthen the claim:
- **Foundations** — footnote *Software's Industrialization Moment* where standardization /
  "why this is the move" is framed. It is the warm-up piece for exactly that argument.
- **Near the four-shape introduction** — footnote *The Quiet Consensus* as convergence evidence
  (six practitioners arriving at process-first across six languages).
- *Saga Is Not a Pattern* is already cited well in Pass 2 — good model for the others.

---

## Priority summary

| # | Item | Effort | Payoff |
|---|------|--------|--------|
| 1 | Make the taper explicit (2 lines) | trivial | high — self-demonstrating thesis |
| 2 | Stop re-teaching cohesion in Pass 3; defer "why decomposition rewards itself" to Synthesis | medium | high — monotone taper, stronger telescope |
| 3 | Confirm hourglass / Synthesis-reverses-taper in spec; collect deferred-decision checklist | low | medium — prevents dropped debts |
| 4 | Pass 3 SLO thread decision | low | medium — closes a tracked thread |
| 5 | Pass 3 glosses (fold-over-log, reconciliation sweep) | trivial | low |
| 6 | Article cross-references | low | low — polish |

What's genuinely-new and earns its weight stays: per-process types and the seat-across-three-
processes example (Pass 1); saga-as-composite, time-as-decay, the compensation taxonomy (Pass 2);
the refund ambiguous-case resolution and cross-subsystem-recovery insight — "the boundary that
keeps subsystems independent is the same boundary that makes design-out the natural cross-subsystem
recovery" (Pass 3). That last one is original-contribution territory; keep it prominent.
