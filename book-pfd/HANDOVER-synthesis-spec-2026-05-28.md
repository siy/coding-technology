# HANDOVER — Architecture Synthesis spec work · 2026-05-28

*For the next session. Orientation document; read first, then dive into the spec or canonical sources.*

## TL;DR

1. The **architecture-design skill** (Metapatterns digest) is **done** at `architecture/.claude/skills/architecture-design/`. Self-contained, ~1,700 lines, ~0.5% verbatim from source (measured). Treat as a tool, not as canon.
2. The **Architecture Synthesis spec** for the PFD book exists at `coding-technology/book-pfd/SPEC-architecture-synthesis.md`. **It aligns to and defers to `oss/content/pfd-book-spec.md` L503–527** (the canonical module outline). It is a drafting brief, not prose. Drafting agent has not yet been invoked.
3. **One load-bearing constraint dominates everything below — read §2 before doing anything.**
4. An **adversarial-reviewer prompt was prepped, then paused by the user** before launching (see §8). It's ready to fire when the user wants the discussion.

## 1. State of play across the two projects

| Project | Path | This session's status |
|---|---|---|
| `architecture` | `/Users/sergiyyevtushenko/IdeaProjects/architecture/` | Skill complete, verified, dry-runs both workflows |
| `coding-technology/book-pfd` | `/Users/sergiyyevtushenko/IdeaProjects/coding-technology/book-pfd/` | Synthesis spec v2 written (canon-aligned); Brownfield spec not started; module prose not started |

The architecture project is otherwise empty — only the skill dir exists. Nothing committed in either repo.

## 2. The load-bearing constraint (do not violate)

The PFD book is **emergence-first** (considerations.md Theme 3): *derive from PFD primitives first; recognize external names second.* "Name comes third, not first." Precedent: JBCT↔BPMN convergence.

**This rules out** making Poltorak's 19 metapatterns the spine of any section, importing his taxonomy as primary structure, or letting his vocabulary leak into surface prose. Using metapatterns as the engine of Architecture Synthesis would contradict the book's identity and read as borrowed scaffolding.

**The only on-brand use** of the Metapatterns skill in the PFD book is as a **"recognize-second" Convergence callout** — a *named second-layer device* per voice.md L44–63, positive-crediting per L158, non-blocking, on the **2 of 6 axes** where the convergence actually lands (deployment topology + composition substrate). The spec §5 codifies this; do not weaken it.

If the next session feels temptation to "just use the catalog as the structure for §4.2," that is the failure mode. Stop and re-read this section.

## 3. The Architecture Synthesis spec (current state)

**File:** `coding-technology/book-pfd/SPEC-architecture-synthesis.md`
**Target:** ~12K words of prose, drafted by another agent.
**Position in book:** post-spiral, before Brownfield. Hourglass payoff. Integrative-not-delta.

**Canon alignment.** The spec mirrors the **canonical 8-section spine at `oss/content/pfd-book-spec.md` L503–527** (this fact is non-obvious — I only discovered it on the second extraction pass). Word sub-targets: Phase-4 elicitation 3K · six-axis vector 5K · selection mechanism 3K · Phase-5/6 boundary 1K · recovery-class selection 2K · continuous transformation 3K · walkthrough 1K. Threads advanced: **1, 2, 11, 13, 14, 15**. Sub-targets sum to ~18K vs ~12K total — flagged "indicative, scale with figure"; compression needed.

**Folded-in verbatim** so the drafter has it in one place: the 11 Phase-4 questions + 4 categories + 3 attachment scopes; the six axes + options; the recovery 4 judgment axes (the only axis with extant heuristics); Temporal placement + 3 traps; 6 cost/risk indicators + 5 failure modes; the event-ticketing three-profile walkthrough decision.

**Metapatterns integration (§5).** Confined to a Convergence callout on axes 1–2, anchored in Theme 3, voice-compliant. Divergences (unified runtime, dropped Hexagonal, axes 3–6 outside Poltorak) treated as proof of independence.

## 4. Resolved (recorded, not open)

| Decision | Resolution | Source |
|---|---|---|
| Walkthrough | **Event-ticketing three-profile** (small-venue → mid-stage → enterprise) — *replaces* the cargo walkthrough | spec L526, decision 2026-05-27 |
| Continuous-transformation split | Synthesis **presents** the framework (~3K); Brownfield **applies** it | spec L150–177, L524, L531–545 |
| Metapatterns integration shape | Second-layer Convergence callout on axes 1–2 only; Theme 3 governs | this session |
| License posture | Poltorak is CC BY 4.0 → no SA → PFD book may license itself differently with positive-crediting attribution; framework names allowed only as positive crediting (voice L158) | session §earlier |

## 5. Genuinely open (for the user or the next drafting decision)

From spec §8:

1. **Two homeless debts** flagged in canon L507–517 as "needs an explicit home":
   - **Aspect wrapping convention** (metrics → timeout → circuit-breaker → retry → rate-limit → business). My recommendation: short cross-cutting note under §4.2 or §4.5.
   - **When-to-decompose judgment** (distinct triggers / distinct SLOs / non-trivial compensation / independent operation). My recommendation: decomposition-granularity heuristic adjacent to §4.2.
2. **Per-axis heuristics for axes 1–5 are net-new authoring.** Canon directs "3–4 heuristics per axis anchored in Phase-4 inputs" (spec L146, L520) but does not write them. Required shape: "consider this as well," not "pick from menu"; anchored in a Phase-4 input; infeasible vectors surfaced as walkthrough contrast cases (validation L668–676, L819–825). **Highest fidelity risk** — drafter must derive from the three-profile walkthrough, not invent. This is the single largest piece of original methodology authoring left in the book.
3. **Budget compression.** Sub-targets sum to ~18K against ~12K module total. Recommended cut: trim axes 3–5 (read/write, state, persistence) — less contested, no convergence layer. Keep axes 1–2 + recovery + walkthrough rich.

## 6. Canonical sources — paths that aren't obvious

- `HANDOVER-PFD-BOOK.md` is at `coding-technology/` **repo root**, NOT in `book-pfd/`. (Easy to miss.)
- `oss/content/pfd-book-spec.md` L503–527 is the **canonical module outline** (the spine you must align to).
- `oss/content/pfd-book-considerations.md` carries the load-bearing themes: 3 (emergence-first), 6 (show possibility), 18 (Temporal/durable-workflow), 19 (show-don't-argue), 22 (Synthesis-is-a-module), 23 #4 (perf-vs-process-simplicity → phase separation), 25 (determinism is phase-scoped), 26 (integrative-not-delta).
- `oss/content/pfd-validation-notes.md` Gaps 3 (recovery), 5 (Phase-4 set), 6 (six-axis); the infeasible-vector contrast-case rule; hybrid-normal.
- `oss/content/pfd-book-voice.md` L44–63 (three-layer named-device model), L85–88 (forbidden vocab — NFR strictly), L116–121 (em-dash ≤2), L156 (register), L158 (positive-crediting rule).

Working digest of the external Metapatterns framework: `architecture/.claude/skills/architecture-design/` — use for §5 Convergence callout content only; **cite the book** (Poltorak's *Architectural Metapatterns*, CC BY 4.0, https://metapatterns.io/), not the skill.

## 7. Recommended next steps (in priority order)

1. **Run the prepped adversarial review** of the spec (see §8) before any drafting starts. The module is "crucial" per user; review-then-draft beats draft-then-fix here.
2. **Resolve the two homeless debts** with the user — these are real choices, not author-can-decide.
3. **Brownfield spec.** The natural successor; reuses much of the same canon (continuous-transformation framework applies here). The Metapatterns evolution maps (56 transitions, our skill) are the strongest external source for this module — revocabularized into PFD's change-driver / next-correct-step terms.
4. **Then** invoke a drafting agent for one Synthesis section as a probe — recommend §4.5 (recovery) first, since it has the most existing canonical content and lowest hallucination risk. Validate voice/style before tackling §4.2 (the heuristics).

## 8. Carry-over — the adversarial-reviewer prompt (paused mid-launch)

This prompt was ready to fire when the user paused for the handover. It is multi-lens (fidelity + the Metapatterns strategic question + executability + structure + homeless debts + missed topics + ranked issues). Paste into `Agent` with `subagent_type: "general-purpose"`, `name: "spec-reviewer"`:

```
CHALLENGE MODE: $500 on the line. You are a hard, adversarial reviewer — NOT a rubber stamp. Find what's wrong, weak, missing, or mis-framed. Rank issues by severity; propose concrete alternatives.

READ:
- /Users/sergiyyevtushenko/IdeaProjects/coding-technology/book-pfd/SPEC-architecture-synthesis.md  (under review)
- /Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-book-spec.md  (L503–527 = canon outline; axes L137–148; Phase-4 L104–131; recovery L179–208; cont-transformation L150–177)
- /Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-book-considerations.md  (Themes 3, 6, 18, 19, 22, 23, 25, 26)
- /Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-validation-notes.md  (Gaps 3, 5, 6)
- /Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-book-voice.md
- /Users/sergiyyevtushenko/IdeaProjects/coding-technology/book-pfd/spiral-{1..4}.md, foundations.md
- /Users/sergiyyevtushenko/IdeaProjects/architecture/.claude/skills/architecture-design/

CRITIQUE COVERING:
1. Fidelity to canon — drift, contradictions, factual errors; cite lines.
2. The Metapatterns integration — steelman AGAINST (does it dilute emergence-first / Trojan-horse external taxonomy / invite "metapatterns rebranded"?), steelman FOR (Theme 3, reader recognition, completeness), 2-of-6-axes coherent vs arbitrary, alternative placements (Brownfield-only / appendix / cut entirely). Take a position.
3. Executability — is the brief enough for 12K faithful words? The per-axis heuristics (axes 1–5) don't exist in canon — is "derive from the three-profile walkthrough" enough guard against hallucination?
4. Structure & proportion — is the canon's 8-section order right for an integrative module? Author's proposed cut (trim axes 3–5) the right one?
5. The two homeless debts — author's proposed homes right?
6. Anything missed — assembly-vs-provisioning, subsystem-SLO-as-derived-envelope, axis-interaction coherence, Phase-4 contradictions surfacing, falsification bet #10 demo, AI-legibility threads.
7. Top 5 issues ranked blocker/major/minor with one-line fixes.

Be specific, cite files+lines, disagree where warranted, don't soften. End with your single biggest concern.
```

## 9. What was tried and rejected (so the next session doesn't redo)

- **v1 spec structure** (8 sections of my own design, with cargo walkthrough recommended) — replaced by canon-aligned v2. Cargo walkthrough was the old plan; event-ticketing three-profile is current.
- **Using Metapatterns as the spine of any section** — violates Theme 3; rejected categorically.
- **Decision trees per axis / compatibility matrix** — canon explicitly rejects both (spec L146); the selection mechanism is *half-structured heuristics + walkthroughs*.
- **Bolting the per-axis heuristics into the spec without sourcing** — they don't exist in canon; spec flags this as net-new and tells the drafter to derive from walkthrough.
- **n-gram analysis** confirmed the architecture-design skill is ~0.5% verbatim from Poltorak — kept attribution at CC BY 4.0; do not re-debate licensing.

## 10. Session timestamps & key artifacts

| Artifact | Path | Lines |
|---|---|---|
| Architecture-design skill (10 files) | `architecture/.claude/skills/architecture-design/` | ~1,700 |
| Synthesis spec v2 | `coding-technology/book-pfd/SPEC-architecture-synthesis.md` | ~210 |
| This handover | `coding-technology/book-pfd/HANDOVER-synthesis-spec-2026-05-28.md` | — |
| Plan file (skill build) | `~/.claude/plans/calm-finding-kitten.md` | reference only |
| Source clone (ephemeral) | `/tmp/metapatterns.wiki/` | 81 md, may be GC'd |

---
End of handover. Next session: read §2, then the spec, then either fire §8's review or pick a next-step from §7.
