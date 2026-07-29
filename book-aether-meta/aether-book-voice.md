# Aether — Book Voice (overlay)

Aether-specific overlay to the shared **`../../oss/content/book-voice.md`** (prose
discipline common to all books in the series). Read that first; this file adds and
overrides only what is specific to the Aether book. Companion to `BOOK-PLAN.md`
(structure, outline, code/spec conventions).

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

Length bands are per `BOOK-PLAN.md`; the shared §1 rhythm rules (paragraph
distribution, 400-900-word `###` sections) apply within them.

---

## Framework and competitor names: shared default (permitted, factual)

The Aether book uses the shared default (`book-voice.md` §7): framework, library, and
tool names **may** be used, but only factually — no teardown, no disparagement, no
strawmanning. This is load-bearing here: the book's thesis ("let Java be Java")
contrasts Aether with the fat-jar / Spring / Kubernetes status quo, so those names
appear — named factually and credited where credited at all. No override needed.

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
  something new. Forward-opening continuity between chapters (shared §4 closing
  discipline).
- **Source-first code fidelity.** Every code example is verified against current
  Aether / Pragmatica Core **source** (`../pragmatica/`), not docs or the skill.
  Idiomatic JBCT — the `jbct-coder` agent / `jbct` skill are authoritative for Java
  style. No speculative API.
- **Stability tags.** Each chapter/section is tagged STABLE / VOLATILE / INVENTED
  (see `BOOK-PLAN.md` §3). VOLATILE (exact API surface) stays outline-only until the
  runtime overhaul lands; INVENTED idioms ship only with a working, tested prototype.

---

## Second-layer devices

The Aether book's second-layer signaling (`book-voice.md` §3) is carried by:

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
  carries the rule; the "why" is second-layer per shared §3.
- **Code fidelity + stability tags** as above.
- **Skip-disclaimer** at the head of Part I as a sanctioned layering device.

---

## Example density (overlay to shared §8)

Shared §8 frames example density by chapter *type* (diagnostic / framework / practice
/ adoption); that mapping doesn't fit a build-along book where **every chapter carries
the running spine by construction**. For the Aether book:

- Each chapter has one **spine integration** (the idiom folded into the order app),
  plus minimal standalone snippets isolating the specific technique.
- **Overview/intro sections** carry the varied-domain vignettes (logistics, IoT,
  booking, …); spine chapters stay in the orders domain.
- INVENTED-idiom chapters (Part III) run heavier on worked code (design + tested
  prototype); STABLE conceptual chapters (Part 0, Part VI) run lighter.

---

## Aether review-checklist additions

Run the shared `book-voice.md` checklist, plus:

- [ ] Every code example verified against current Aether / Pragmatica Core source
      (not docs/skill); idiomatic JBCT
- [ ] VOLATILE API surface marked, not finalized before the overhaul
- [ ] INVENTED idioms backed by a working, tested prototype
- [ ] Every rule/idiom carries an explicit "why" (and appears in the Why index)
- [ ] Orders domain-vocabulary clean in the spine; other domains only in overview
      vignettes
- [ ] Framework names used factually, no teardown (shared §7 default)
- [ ] No strawman contrast (shared §5): state what a thing is, positively; a negation
      only against a belief the reader actually holds (e.g. failure-as-exception)

---

*Companion documents: `../../oss/content/book-voice.md` (shared prose discipline),
`BOOK-PLAN.md` (structure, outline, code/spec conventions).*
