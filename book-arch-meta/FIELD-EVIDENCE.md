# Field Evidence — engagement threads as book material

*Harvested 2026-07-11. Book-facing index; operational detail and reply drafts live in `ENGAGEMENT-2026-07-06.md`, verbatim lines in memory `project_quotable_lines.md`, interlocutor profiles in memory `project_pfd_interlocutors.md`.*

## Exhibit 1 — The Galyen arc (ch. 1 evidence; ch. 13 candidate)

Four rounds, 2026-07-06 → 07-10, LinkedIn. A centralized-DB advocate opened with "you don't understand atomicity"; by round 4 he was proposing monolith deployment with service-shaped internals plus generated remoting — **he re-derived transport transparency himself, against his own opening position, without ever conceding**. The arc:

1. "Single DB superior; the difference is technical only" → countered by partition-key-falls-out-of-invariant-scope (per-seat, not per-user).
2. "Single DB scaled across servers" → *is* the ledger's distributed shared store; he agreed with the derivation without noticing.
3. "Keep everything flexible; P99 matters only in production" → "Flexibility is bought, not declared" / "Physics decides whether you can."
4. Seams + codegen + "experience part of the tooling" → "Tooling can generate everything except the commitments"; seniority ladder countered by same-commitments-same-landing.

**What it evidences:** architectural debate as preference war dissolving under derivation — the skeptic's positions converged to the derived one because every counter cited a mechanism, not a taste. Pairs with CodersWorld's "disguised preference wars dressed up as engineering certainty." Use anonymized/paraphrased in ch. 1, or as ch. 13's "what engagement looks like when the method holds."

## Exhibit 2 — The Yannick deep-read (ch. 13 / relationship asset; NOT References)

IVP author, mid-read of the PFD book (DM 2026-07-09): best-thought concept set for business analysis he's seen apart from EPC; BPMN2 "quite poor" by comparison; "this thing will fly." His extension — gaps filled at knowledge level, "design patterns fundamentally are" gap-filling — is *his* synthesis, not in his papers (`IVP-CLAIMS-MAP.md`: papers are mention-not-cite, user ruling 2026-07-10).

**What it evidences:** independent theoretical convergence (Quiet Consensus) — he arrived at change-driver partitioning without Löwy. Use as: one prose mention as independent formulation; reviewer for derivation-step rigor. His flagged UC/workflow boundary gap = PFD PLANNED-CHANGES item 11 (cold-reader clarity signal, the feedback loop working).

## Exhibit 3 — The Veyssière comment + the reception meta-read (Part III mandate; ch. 10 epigraph candidate)

Unprompted, article 1, 2026-07-10: once the target is computable, "the real differentiator is the transformation path… where architects truly earn their value." **Unknowingly stated the book's Part III thesis** — demand pointing precisely at the thinnest chapters (10, 11).

The user's meta-read of the whole reception (drove the 2026-07-10 material-first ruling): people (a) want this, (b) accept even simple/incomplete derivation, (c) raise no objections — "deterministic nature is what everyone wants; architectural debates just annoy everyone." The approach is welcome *despite* limitations: determinism is the product, completeness is not the gate.

**What it evidences:** ch. 1's framing (the debates are the pain, not the architectures) and the book's release posture (ship the procedure; the counterexample invitation is the completeness mechanism).

## Cross-cutting observation

All three exhibits are the same shape: **people keep arriving at the book's positions from their own starting points** — a skeptic (Galyen), a theorist (Yannick), a practitioner (Veyssière). That's the Quiet Consensus pattern operating at three altitudes, and it is itself a ch. 1 argument: the book names something already converging, it doesn't propose something new. (Same shape as PFD's "we're not pushing standardization; we're revealing that it does happen.")
