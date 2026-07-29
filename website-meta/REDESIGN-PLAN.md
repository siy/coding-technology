# pragmatica.dev Redesign — Plan (v1, 2026-07-13)

*Working doc, never committed (joins the meta-dir never-commit set). Decisions below
are user rulings 2026-07-12/13 unless marked open. Companion: memory
`project_pragmatica_site_vision`; arch BOOK-PLAN ship checklist (timing).*

## Decisions (settled)

- **(a) Umbrella:** motto **"Less Art, More Engineering"** (PFD's own line, elevated
  to series thesis). Front-door banner + the series-note pipeline line. Running prose
  says "the series"; no book-side change needed (AS series-note uses no umbrella name).
- **(b) IA halves:** `/method/` (stack-independent: PFD, AS, glossary, counterexamples)
  and `/java/` (JBCT, Pragmatica lib, Aether). The `/java/` landing carries an explicit
  declaration: Java is the reference realization, NOT a lock-in — the principles are
  language-portable (wording to be shared with the JBCT-revision backlog item on
  universal-vs-Java separation).
- **(c) Content model — the differentiator:** *site = free education, books = books.*
  Every book gets a free **course edition** on the site; the book (Leanpub PDF/EPUB)
  remains the artifact. NO free web book editions.
  - **Single-source guardrail (the 2026-06-22 scar):** the course is a BUILD PRODUCT
    plus a thin layer, never a fork. Book chapters remain the single prose source; the
    build chunks them into lessons; the hand-authored course layer (lesson framing,
    exercises, checkpoints, run-this-on-your-system prompts) is stored separately,
    REFERENCES book content, never restates it. A lesson needing different prose =
    a book defect, fixed in the book.
  - **Sequencing:** JBCT course first (replaces the current web edition; raw material
    = the retired series at git `03c6ba4^`, series/part-00..). AS course at/after book
    ship (never gates the book). PFD course last (landing+sample holds the slot).
  - **Cutover:** one release — the JBCT web book edition disappears the moment the
    course ships (no dual-rendering transition). Existing `/book/*` URLs 301 to the
    course TOC.
- **(d) Riders:** canonical glossary v1 (sources: AS reference cards + PFD glossary +
  JBCT appendix-c, with crosswalk; stable anchors) and the Race Condition Theater demo
  (after its honesty/fidelity/attribution pass) ship with the redesign.
- **Interactive assets get course homes:** RCT demo → JBCT course concurrency lesson;
  AS course closing exercise → fill the worksheet + counterexample intake
  (github.com/siy/derivation-artifacts issues); future `next_step` playground → AS
  course asset (post pragmatica#443).

## IA (settled shape)

```
/                       front door: motto, pipeline line, reading map (who-starts-where)
/method/                stack-independent landing
  pfd/                  landing + sample (+ course later)
  architecture-synthesis/   landing + sample + replication-kit pointer (+ course later)
  glossary/             canonical glossary, stable anchors
  counterexamples/      intake page -> derivation-artifacts issue template
/java/                  Java-half landing + no-lock-in declaration
  jbct/                 landing + COURSE (replaces web edition)
  pragmatica/           the library
  aether/               honest status page
```

## (e) Visual direction — SETTLED 2026-07-13; mocks APPROVED (user LGTM)

Mocks: `website-meta/mocks/{front-door,lesson}.html` — approved as the design
reference. Settled by approval: serif lesson prose (Charter/Georgia stack; final site
self-hosts a serif), lattice progress indicator, amber next-action button, monochrome
paper UI, default you-start-here mark on PFD (chips move it). Status: BUILD phase
open — branch `site-redesign`.

- **Ink option #2 (user ruling):** navy-dark ink `#1a2840` (labs family) for text AND
  line art, on the warm book paper `#f4f3f0`. One ecosystem, two rooms: labs = company
  (cool ground, shadowed cards), dev = education (warm paper, flat line art), shared
  ink + amber.
- **Amber = the labs triple** (user ruling): `#f59e0b` base, `#d97706` text-adjacent,
  `#fbbf24` light. Book covers keep print `#E9A23C`. Amber has ONE semantic on the
  site: *you-are-here / the next step* (nav position, progress, primary continue
  action). No second accent color.
- **Fonts:** Inter (UI/headings), JetBrains Mono (code). OPEN micro-choice: lesson
  prose serif (book-like; recommended) vs Inter — resolve via mocks.
- **Code highlighting (user ruling 2026-07-13):** yes — colors from the palette's dark
  tones so bright amber stays purely navigational: keywords `#1e40af` bold, strings
  `#92400e`, comments gray italic. Matches the book's print listing palette in spirit.
- OPEN micro-choice: lattice progress indicator (outline nodes / filled done / amber
  ring current) vs plain text counter — resolve via mocks.

## Rulings 2026-07-13 (round 2)

- **Articles:** stay on Medium/dev.to (funnel INTO dev); NO /articles/ content type on
  the site. Optional later: a plain links page. IA is frozen without articles.
- **JBCT file-title mapping fix (user: files/chapters off by one; one-time overhaul):**
  filenames from ch02 on lag their real chapter numbers (3.0.0 renumbered H1s, not
  files; b/a suffixes papered over insertions). Fix: **number-free slug filenames +
  explicit spine** (`book/root.md`, PFD/AS pattern); order lives in the spine; course
  URLs use the same slugs (`/java/jbct/course/<slug>/`) — insertion-proof. Touches:
  `book/build-pdf.sh`, `book/build-epub.sh`, `website/build.js`, git renames.
  Optional phase 2 (separate scope, needs an in-prose cross-ref pass): strip
  "Chapter N:" from H1s, builds inject numbering from spine position.
- Rename lands WITH the course cutover — one URL migration, not two.

## Scope ruling 2026-07-13: education only

CONTACT and MANAGEMENT_PERSPECTIVE pages are DROPPED from the site (the .md files
remain in the repo, unpublished). Commercial content belongs to pragmaticalabs.io;
pragmatica.dev is education only. Dropped URLs get redirects/410 at cutover.

## Technical posture (settled by discussion, no objection)

- Keep `build.js` static generator; new templates (landing, course TOC, lesson) +
  restyled CSS. No framework migration.
- Course progress: localStorage only, no accounts, no backend.
- All new assets content-hashed immutable (PR #34 lesson); HTML short-cached.
- Root-level page inventory decision needed at build time: MANAGEMENT_PERSPECTIVE.md,
  CONTACT.md (currently pulled from repo root into the site — keep/move/retire?).
- Per-page titles/descriptions; AS landing claims the unclaimed "Architecture
  Synthesis" title.

## Timing

Design/build in parallel with the AS read; ship the redesign with the AS release so
the announcement lands on the new front door. Course production is decoupled: the
redesign can ship with JBCT course only (or even landing-first if the course slips —
but the JBCT web edition cutover then waits for the course, since removal without
replacement breaks the free-education promise).
