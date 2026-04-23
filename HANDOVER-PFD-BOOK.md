# Handover: Process-First Design Book

Handover document for the agent taking over authoring of the **Process-First Design (PFD)** book in this repository. Read this document first, then the linked spec, then the source articles. Do not start drafting chapters before reading all three.

---

## What This Project Is

A new, separate book titled **Process-First Design**, subtitle **Leveraging the Semantic Potential of Types and Patterns**. It sits **above** the existing JBCT book (in `book/`). Not a replacement. Not a rewrite. A different altitude.

**Relationship to the existing JBCT book:**
- **PFD book** = the *why* at the methodology layer. Language-neutral. Industry framing, convergence evidence, principles, patterns, adoption.
- **Existing JBCT book** = the *how* for Java. Language-specific, Pragmatica Core APIs, implementation detail.
- Analogy: "We Should Write Java Code Differently" is to PFJ as PFD is to JBCT. High-level *why* vs concrete *how*.
- The two books **refer to each other** at appropriate points but do not duplicate content. Readers can adopt PFD principles in Scala, Kotlin, Rust, C#, TypeScript without opening the JBCT book; JBCT is one implementation shortcut for Java teams.

**Where the PFD book lives in this repo:** create a new directory `book-pfd/` at the repo root (sibling to `book/`). Use the same naming convention (`ch01-introduction.md`, `ch02-...`, etc.). Maintain the build scripts analogous to the JBCT book's `build-epub.sh` and `build-pdf.sh` when you reach that stage.

---

## Read These Files in This Order

1. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/pfd-book-spec.md`** — the book specification. Title, thesis, authorial principles, 13 narrative threads, 5-part / 24-chapter structure, per-chapter word targets, article reuse map, publication schedule, risks, preconditions. This is the working agreement. Treat every section as load-bearing.

2. **`/Users/sergiyyevtushenko/IdeaProjects/oss/content/article-index.md`** — the article canon with verified URLs on Dev.to and Medium. Use these URLs when citing, and read the actual articles when seeding chapters.

3. **The source articles.** Nine are published on Medium+Dev.to, one on LinkedIn only. Medium URLs are in the article index. When seeding a chapter, read the source article first to understand its argument and voice.

---

## Non-Negotiable Constraints (voice, tone, content boundaries)

### Three Authorial Principles (stated in introduction, enforced throughout)

1. **Legibility first.** Code optimized for the reader. Every structural choice is a concession to the future reader. Rebuts brevity objections when they arise: "extra words that aid the reader are purchased legibility, not ceremony."

2. **Show possibilities, don't make claims.** Describe properties. Demonstrate with examples. Never promise compliance-readiness, productivity multipliers, or bug reductions. Readers map possibilities to their own situations. Where data is absent, say so explicitly.

3. **More time for the interesting work.** The structural discipline offloads mechanical work so human attention moves up to architecture and domain judgment. Most developers want more architecture time; PFD is how to get it. (Low-level-focused developers get their own invitation: interesting problems live at higher altitudes — bubble-sort-in-asm vs Python-quicksort example.)

### Voice and Tone

- **Research-cited with sharp punchlines.** Model: *Accelerate*. Hard data, respectful framing, occasional one-liners.
- **Industry critique is honest but not polemic.** "Here's what the last decade taught us" beats "you were all wrong."
- **Never name competitors or competing products by name** in publishable content. This applies to both individual frameworks (no "Spring" / "Quarkus" framing against each other) and individual practitioner criticism (no naming people to criticize). Named references only when crediting positively.
- **No Aether product pitch** in the PFD book. PFD is methodology, Aether is platform. They connect but don't share marketing space.
- **No Pragmatica Labs marketing copy.** A single closing pointer to pragmaticalabs.io in the back matter is fine. The body of the book is methodology writing.

### Content Boundaries

- **No effect-systems deep dive.** Keep the comparison thread at "most functional styles express structure implicitly through combinators; PFD names the shape first" level. Do not dive into ZIO / Cats Effect / monad transformers comparisons. That was explicitly cut from the scope.
- **No "linear complexity" claims.** The defensible claim is **compositional complexity** — each feature adds its own complexity without multiplying existing. In practice this approaches linear, but don't say "linear" — reviewers will attack the mathematical claim.
- **Specific features don't get wrapped in containers when they cannot fail.** The `T` baseline is real. `Result<T>` for a total function is ceremony without payload.

---

## Narrative Threads (13, referenced per chapter in the spec)

Every chapter should list which threads it advances. Drift is visible immediately this way.

1. Compositional complexity
2. Deterministic rules
3. Industrialization / streamlining
4. AI-era coding (commoditized mechanical work)
5. Legibility asymmetry
6. Knowledge preservation in code
7. Less code, more business
8. Observable by construction
9. Failure modes (credibility earned)
10. Team as Choice (liquid work)
11. The Interesting Work (architecture time as payoff)
12. Manufacturing analogy (single paragraph only, in opening chapter)
13. What We Expect (predictions, no data claims)

---

## Chapter Structure (summary — full detail in spec)

**Part I — Why We're Stuck** (~18k words, 5 chapters): productivity plateau, cargo-cult best practices, DDD strategic gap, OO vs FP, AI meets code.

**Part II — The Shift Already Happening** (~16k words, 4 chapters): Quiet Consensus, process-first vs entity-first, semantic potential of types, knowledge gathering as upstream.

**Part III — Process-First Design: The Framework** (~20k words, 5 chapters): four shapes, six patterns, leaves and quarantine, slices, assembly vs provisioning.

**Part IV — End-to-End Practice** (~22k words, 5 chapters): request-to-code walk-through, naming as design, knowledge preservation, observable by construction, less code more business.

**Part V — Adoption** (~20k words, 5 chapters): one-sprint migration, priority guide, Team as Choice, failure modes, What We Expect.

Plus Introduction and Closing (~6k combined).

**Target total:** 85,000–110,000 words. Book length, not manifesto length.

---

## Article Reuse (what seeds what)

See `content/article-index.md` for full URLs. Seeding map:

| Article | Seeds chapter | Expansion |
|---|---|---|
| The Underlying Process of Request Processing | 15 | ~2k → ~5.5k |
| The Six Patterns That Cover Everything | 11 | ~2.5k → ~5.5k |
| Slices: The Right Size for Microservices | 13 | ~2k → ~3.5k |
| Fail-Safe Your Legacy Java in One Sprint | 20 | ~2k → ~3.5k |
| The Quiet Consensus | 6 | ~2.5k → ~5.5k |
| Java Backend Design Technology: A Process-First Methodology | 9 | ~2.5k → ~4.5k |
| When Types Become the Business Language | 7, 8, 10 | ~1.9k → ~13.5k (heavy expansion) |
| Less Language, More Business | 19 | ~1.5k → ~3k |
| Frictionless Prod | 18 | ~1.5k → ~2.5k (partial) |
| The DI Confusion | 14 | ~2k → ~4k |
| Epicycles of Software Design (LinkedIn) | 2 or 3 | ~600 → ~4k (mostly new) |

**Raw article words seeding chapters:** ~21,000.
**Estimated new writing required:** 50,000–60,000 words.

Source article markdown is at `/Users/sergiyyevtushenko/IdeaProjects/oss/content/` — drafts with frontmatter. Do not edit the draft files; they are published artifacts. Read to extract content and voice, then rewrite for book depth and cross-chapter continuity.

---

## Commitments to Honor

- **William Jackson acknowledgment.** He coined "semantic potential" (now the subtitle) via a Medium comment on *When Types Become the Business Language* (April 2026). Phrase adopted with his explicit permission. At ship time: (1) send him a free copy, (2) acknowledge in front matter, (3) credit in any public reference to the phrase's origin.
- **Leanpub incremental publication.** Sell from day one, work visible as it develops.
- **Numbered predictions with commitment to update.** Chapter 24 ("What We Expect") includes the list and the honest disclaimer that updates will be published as evidence accumulates.
- **Every chapter lists its advanced threads** at the top. Standard format — see spec.

---

## Case Study Material Available

One anonymized case study belongs in Chapter 22 (Team as Choice). Prose already drafted, ready to integrate:

> A small startup team committed to a microservices architecture with a team too small to staff each service conventionally. The system's nature made microservices necessary, not chosen for fashion. They knew frequent context-switching between services would destroy the small-team advantage they needed to preserve. Their response was total end-to-end standardization — every service looked the same. Identical naming conventions, identical project layouts, same framework, same patterns, same error shapes. A developer moving from Service A to Service D on Monday afternoon was productive within the hour, because Service D was structurally indistinguishable from Service A except in what it did. The approach worked. The person who described it to me was proud of what that team built, and sad that the organization they now work in doesn't follow the same approach.

Place early in Chapter 22 (after the premise, before the Kanban section). It is the only concrete case available now; carry structural argument as the weight-bearing element with the case as illustration.

---

## Preconditions Still Open

From the spec — resolve these before drafting Chapter 1:

1. **Time allocation.** Background task (1–2 days/week) vs dedicated sprints vs mixed. Affects schedule, not scope.
2. **JBCT book relationship re-verified.** Confirm positioning (PFD above JBCT, no conflict) by reading the existing `book/` table of contents and flagging any overlap. Overlap likely exists in patterns chapters — JBCT has `ch07-basic-patterns.md` and `ch08-advanced-patterns.md` that cover the six patterns at the Java implementation level. PFD's Chapter 11 should cover them at the process-shape level with Java examples moved to JBCT references.
3. **Additional case studies.** One is not zero, but one is thin. As the book drafts, actively seek 1–2 more anonymized cases for Chapters 20, 22, or 24.
4. **Leanpub book shell initialization.** Use the `release` skill (Leanpub sync is already integrated). Coordinate with the user before creating the Leanpub product.

---

## First Concrete Action

**Draft the Introduction + Chapter 1 + Chapter 2 as a Leanpub launch package (~15,000 words total).**

- **Introduction** (~3,000 words) — thesis, three authorial principles, manufacturing analogy paragraph, book's promise. Set the voice readers will judge the whole book by.
- **Chapter 1 — The Productivity Plateau** (~4,000 words) — DORA + Stack Overflow data; decade of tooling investment with flat outcomes; stage-set for the industrialization argument.
- **Chapter 2 — Best Practices as Cargo Cult** (~3,500 words) — contradictory practices, FAANG-to-enterprise import failures, lack of systematic frame. Opens the "we need a distillation" door the rest of the book walks through.

Write one at a time. Get Introduction right before Chapter 1 — it sets voice. Get Chapter 1 right before Chapter 2 — same voice, different content. Iterate with the user at each chapter boundary.

**After the launch package lands on Leanpub,** cadence continues per spec schedule.

---

## How to Use Other Repo Assets

- **`book/`** — existing JBCT book. Reference for voice (the author's established style) and for content boundaries (what JBCT already covers that PFD should not duplicate).
- **`articles/`** — if present, additional article drafts that may feed chapters.
- **`series/`** — content series drafts, potentially seed material.
- **`templates/`** — reusable snippets. Check for existing book-format boilerplate before creating new.
- **`CHANGELOG.md`** — version the PFD book's progress. Add `book-pfd/` entries separately from `book/` entries.

---

## Working Rules (from the author's global preferences)

- **Commit messages:** single line, conventional prefix (`docs:`, `feat:`, etc.), no body, no `Co-Authored-By` trailer.
- **No merging of PRs** unless explicitly requested.
- **Track progress with tasks** for 3+ step work; keep main-thread context clean.
- **Delegate noisy work** (builds, tests, large surveys) to appropriate subagents when available.
- **No competitor names** in public content. No product/vendor names as comparative framing.
- **Show, don't tell.** Applies to technical claims in the book and to status updates to the user.

---

## Source of Truth Hierarchy

When instructions conflict, follow in this order:

1. This handover document (what the originating author and previous agent agreed on)
2. `content/pfd-book-spec.md` (the working spec, which evolves)
3. Source articles for content seeding
4. Author's direct instructions in-session

If the user says something in-session that contradicts the spec, they are overriding. Update the spec to match, commit the change, note the deviation in the chapter's notes.

---

## Contact Points

- **User (author):** Sergiy Yevtushenko. Co-founder dynamic — propose ideas proactively, push back when the thesis risks weakening, flag tradeoffs explicitly. Not a client relationship.
- **Existing agents in other repos:** ndx palace in each project carries per-repo knowledge. Search before asking. Don't cross repositories with git operations (see feedback memory in `~/.claude/projects/-Users-sergiyyevtushenko-IdeaProjects-oss/memory/feedback_no_git_in_pragmatica.md` — similar caution applies to any repo where another agent may be active).

---

*This handover is complete when you can recite the three authorial principles from memory, name at least 10 of the 13 narrative threads, and identify which articles seed which chapters without re-reading the spec. Read until then.*
