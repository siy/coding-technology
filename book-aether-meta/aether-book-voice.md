# Aether — Book Voice (overlay)

Style rules for the Aether book's prose, self-contained: every rule the book follows
is stated here, including the house rules it shares with the rest of the series.
Companion to `BOOK-PLAN.md` (structure, outline, code/spec conventions).

**Status:** Created 2026-06-20 at book scaffold stage. Living document.

---

## Reading-mode target: build-along, one Part at a time

The Aether book is a **build-along** book, not a single-sitting read. The reader
constructs a running application (e-commerce order fulfillment) across the parts,
each chapter solving a stated problem and folding the solution into the spine. The
target is **each Part readable in one sitting**, with the running example carrying
continuity between them — not cover-to-cover in one pass.

**Part I "Aether Slice: No Magic" is an optional deep dive.** It opens with an
explicit skip-disclaimer; a reader who only wants to build can skip to Part II and
return later. Later parts cross-reference back into Part I for "why this works."

Length bands are per `BOOK-PLAN.md`. Within them, vary paragraph length with intent
rather than mechanically (roughly 60% medium at 3-5 sentences, 25% longer at 6-8, 15%
short at 1-2), and keep `###` sections in the 400-900 word range, never under 200 or
over 1,200.

---

## Framework and competitor names: permitted, factual

Framework, library, and tool names **may** be used, but only factually — no teardown,
no disparagement, no strawmanning; credit positively where credited at all. This is
load-bearing here: the book's thesis ("let Java be Java") contrasts Aether with the
fat-jar / Spring / Kubernetes status quo, so those names appear, named factually.

---

## Domain vocabulary

The running spine is **e-commerce order fulfillment** (reserve inventory → charge
payment → arrange shipping). Keep the orders vocabulary clean and consistent in the
spine. Other domains (logistics, booking, IoT, banking, telemetry) appear **only in
introductory/overview vignettes**, to show the patterns generalize — never mixed into
the spine's own vocabulary.

---

## Structural discipline: problem-driven, source-anchored

The Aether book is **problem-driven**, not spiral (PFD's spiral structure does not
apply). Every chapter runs the loop: **problem → analysis → derivation → idiom →
integrate-into-spine → why.**

- **One growing example.** The orders app grows by solving problems, not by touring
  features. Don't re-explain a primitive once introduced; each chapter surfaces
  something new. Chapter closings open forward — pointing at what the next chapter or
  layer reveals — rather than summarizing what was just covered.
- **Source-first code fidelity.** Every code example is verified against current
  Aether / Pragmatica Core **source** (`../pragmatica/`), not docs or the skill.
  Idiomatic JBCT — the `jbct-coder` agent / `jbct` skill are authoritative for Java
  style. No speculative API.
- **Stability tags.** Each chapter/section is tagged STABLE / VOLATILE / INVENTED
  (see `BOOK-PLAN.md` §3). VOLATILE (exact API surface) stays outline-only until the
  runtime overhaul lands; INVENTED idioms ship only with a working, tested prototype.

---

## Second-layer devices

The book separates surface prose (the main concept, self-sufficient on first read)
from second-layer material (conceptual commitments, lineage, threads advanced): the
surface never depends on second-layer content for its main claim, and second-layer
material lives in named, skippable devices rather than leaking into the main flow. In
the Aether book this second-layer material is carried by:

- **Part I "No Magic"** — the skippable deep dive; the canonical place where "how it
  works" lives, cross-referenced from the surface.
- **"Why" callouts** — every rule/idiom carries an explicit reason, collected in the
  **Why index** appendix. This is the book's signature second-layer device, stronger
  than a generic threads tag.

---

## Aether-specific adds

- **The "why" rule.** Every rule and idiom states its reason — technical (correctness,
  latency, fault-tolerance, determinism) or organizational (team boundaries,
  deployment independence, reviewability). The Why index collects them. Surface
  carries the rule; the "why" is second-layer material.
- **Code fidelity + stability tags** as above.
- **Skip-disclaimer** at the head of Part I as a sanctioned layering device.

---

## Example density (overrides the house rule below)

House rule: example density varies by chapter *type* — diagnostic chapters carry
fewer worked examples, framework chapters introduce one example per primitive,
practice chapters carry one worked example end-to-end, adoption chapters cite case
studies. That mapping doesn't fit a build-along book where **every chapter carries
the running spine by construction**. For the Aether book:

- Each chapter has one **spine integration** (the idiom folded into the order app),
  plus minimal standalone snippets isolating the specific technique.
- **Overview/intro sections** carry the varied-domain vignettes (logistics, IoT,
  booking, …); spine chapters stay in the orders domain.
- INVENTED-idiom chapters (Part III) run heavier on worked code (design + tested
  prototype); STABLE conceptual chapters (Part 0, Part VI) run lighter.

---

## Review checklist

Run before declaring a chapter complete:

- [ ] Opening states the chapter's position within 1-2 paragraphs
- [ ] Closing opens forward, doesn't summarize backward
- [ ] No section under 200 words or over 1,200 words
- [ ] Em-dash count: under 2 per paragraph as default
- [ ] Trio audit: structural trios preserved; decorative trios varied
- [ ] Causal-pivot audit: load-bearing pivots kept; rhetorical pivots cut
- [ ] No strawman contrast: a negation (not-X) only against a belief the reader
      actually holds, never an un-raised assumption
- [ ] Hedge audit: every "perhaps," "tends to," "in many cases" warranted
- [ ] No "the reader might wonder" framings
- [ ] No "let's explore" / motivational filler
- [ ] No forbidden terminology: "non-functional requirements" / "NFR" (use "quality
      requirements" / "system qualities")
- [ ] Framework/competitor names used factually, no teardown, no disparagement, no
      strawmanning
- [ ] Surface flow self-sufficient; second-layer content in named devices
- [ ] No cross-reference within main flow that depends on knowledge from later
      chapters
- [ ] At least one moment per chapter where commitment density breaks the sterility
- [ ] Voice register uniform with rest of book

Aether additions:

- [ ] Every code example verified against current Aether / Pragmatica Core source
      (not docs/skill); idiomatic JBCT
- [ ] VOLATILE API surface marked, not finalized before the overhaul
- [ ] INVENTED idioms backed by a working, tested prototype
- [ ] Every rule/idiom carries an explicit "why" (and appears in the Why index)
- [ ] Orders domain-vocabulary clean in the spine; other domains only in overview
      vignettes

---

*Companion document: `BOOK-PLAN.md` (structure, outline, code/spec conventions).*
