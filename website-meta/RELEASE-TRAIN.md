# Release Train — PFD 2.1.0 · JBCT 4.3.0 · AS 1.0 · site redesign (one consistent release)

**STATUS: FIRED 2026-07-19.** User AS verdict "book looks fine" → wording gaps fixed (ch. 7
kit disclosure + references brought current with live repo) → AS 1.0.0 final build (86 pp,
no Draft) → gates closed (Leanpub slug created; book-arch JOINED repo, meta stays private;
JBCT stamps bumped 4.1.1→4.3.0 both files + rebuilt 302 pp PDF/EPUB; acknowledgments
cleared) → site swaps applied + 41 pages link-check green → six-batch wrap-up → PR #35
merged --admin → tags arch-v1.0.0 / pfd-v2.1.0 / jbct-v4.3.0 pushed → PFD final rebuild
(157/50/24, no Draft) → Leanpub publish sequence (AS new; PFD full + **condensed as the
sample edition** — user ruling; JBCT PDF+EPUB) run with rate-limit spacing. **ALL THREE
LIVE ON LEANPUB 2026-07-19:** PFD 157 pp (published 15:26Z), JBCT 302 pp (15:30Z),
AS 86 pp (18:56Z). AS slug = **architecture-synthesis-the-next-correct-step** (the short
`architecture-synthesis` book was browser-mode, not API-uploadable; final book is
upload-mode; site links fixed via PR #36). pragmatica.dev deploy verified (new front door,
AS Book button, nine-questions copy). **DONE except user-side announce** (review copies
Poltorak+Yannick, Max Grom pointer, article-2/LinkedIn vehicle).

*Working doc, never committed. Created 2026-07-15. Trigger: the user's AS read verdict.
Everything above the "Release day" line is prepared NOW; everything below runs on approval.*

## State (2026-07-15)

| Piece | Version | State |
|---|---|---|
| PFD manuscript | **2.1.0** (unreleased) | READY — nine-question convergence + changelog transition story + series note + module→AS pointer + recovery long names |
| JBCT manuscript | **4.3.0** (unreleased) | READY — Phases→stages, recovery long names, About-the-Series intro block, spine-numbering refactor (was [Unreleased]) |
| AS manuscript | 0.3.10 → **1.0.0 at ship** | AWAITING USER READ VERDICT — the train's gate |
| Site (site-redesign branch) | 2 commits + working tree | READY pending: course-fidelity verdict, release-day swaps below |
| PFD condensed | rebuilt | ships to Leanpub with 2.1.0 |

**Scope addition 2026-07-17 (user):** the undersold JBCT property named and landed across the
train — **"Hide the machinery, keep the meaning"** (business facts preserved in types and
combinators; code reads twice). JBCT 4.3.0: capstone section + inventory table in *From
Process to Patterns*, Introduction positioning + takeaway, appendix-c + series-glossary
entries, course lesson bullet. PFD 2.1.0: shapes/semantic-potential loop-close paragraph
(non-spine — condensed unchanged). Site: jbct landing paragraph, front-door JBCT card line.
All rebuilt.

## Gates (must clear before release day)

1. **AS read verdict** (user) — THE gate. On approval: CHANGELOG entry `[1.0.0]`, build `--final`.
2. **JBCT course fidelity check** — DONE: verdict **ship-with-fixes**
   (`COURSE-FIDELITY-CHECK.md`). Course layer clean (all 22 lessons thin, 1:1 spine map,
   exercise citations correct). Course-side fixes APPLIED (intro "three problems" bullet,
   "re-throw"→"conditional recovery"). Book-side code defects (compile-breaking `.recover`
   misuse incl. the retry aspect, `Unit.INSTANCE`, `.orElse(null)`-as-canon, null param,
   exercise-footer drift) being fixed by jbct-coder → `BOOK-CODE-FIXES.md`; API claims
   verified first-hand against the 1.0.0-rc1 sources jar. AFTER fixes: rebuild JBCT
   PDFs + site (lessons render book content). Cutover unblocked once fixes land.
3. **AS Leanpub book created** (user action; slug `architecture-synthesis`, unpublished OK) —
   fixes the URL for the site links below.
4. **book-arch tracking decision** (user): book-arch/ is in the never-commit set. At ship,
   does the AS manuscript join the repo like book-pfd/, or stay private (only Leanpub
   artifacts released)? Affects the wrap-up commit scope.

## AS ship-time checklist (from BOOK-PLAN, folded in)

- [x] D vocab sync — done via 11→9 convergence + series glossary
- [x] H intake destination — counterexamples page + derivation-artifacts issue template live
- [x] Cover — real cover since 0.3.3 ("the vector")
- [x] Veyssière ch. 10 epigraph permission — granted 2026-07-12
- [x] Em-dash budget + repetition passes — done 0.3.1
- [ ] Acknowledgments permissions pass (all named people)
- [ ] Review copies: Poltorak + Yannick (send at/just before release)
- [ ] Max Grom: nine-questions pointer (send at announce)
- [ ] Article-2 ("Three Famous Architectures, Derived Blind", publication-ready, parked) —
      candidate announce vehicle; user decides use/timing

## Release-day site swaps (prepared, apply on the day)

1. `templates/front-door.html` AS card:
   `<a class="btn book" href="/method/architecture-synthesis/">Book &mdash; soon</a>`
   → `<a class="btn book" href="https://leanpub.com/architecture-synthesis" target="_blank" rel="noopener">Book</a>`
   ("Course planned" button stays — AS course is post-ship by ruling.)
2. `content/architecture-synthesis.md` last line:
   `The book is releasing soon on Leanpub. A course edition follows.`
   → `The book — [*Architecture Synthesis: The Next Correct Step*](https://leanpub.com/architecture-synthesis) — is on Leanpub. A course edition follows.`
3. Rebuild site (`node build.js`), verify link check passes.

## Release-day order

1. **AS finalize**: CHANGELOG `[1.0.0]` entry → `build-pdf.sh --final` (+ sample). EPUB if the
   script supports it; else Leanpub generates.
2. **Leanpub syncs**: AS 1.0.0 (new book, publish), PFD 2.1.0 (+ condensed), JBCT 4.3.0.
3. **Site swaps** (above) + full rebuild.
4. **Repo**: /wrap-up (cohesive commit batches on site-redesign: site, book-pfd, book/,
   scripts, meta-index files per never-commit rules) → PR to main → merge --admin → tags
   (per release workflow; site deploys from main per DEPLOYMENT.md — verify CDN cache-bust:
   CSS is content-hashed since PR #34, HTML short-cached).
5. **Post-merge**: switch to main, pull (standing rule).
6. **Announce**: new front door live → announcement (vehicle: article-2 or LinkedIn post —
   user's call); Max Grom pointer; review copies out.
7. **Fast-follows** (explicitly NOT in the train): RCT demo (after honesty/fidelity/
   attribution pass); AS course production; PFD course later; remaining item-12 deferreds
   (driver-modes-as-canonical taxonomy in PFD).

## Notes

- JBCT `introduction.md` header says "Based on: JBCT v4.1.1" — looks stale vs book 4.3.0;
  may be the method-spec version, not the book version. VERIFY with user before release
  (one-word fix if stale).
- Site verification before PR: `node build.js` clean + internal-link check (build has one
  built in) + spot-render front door, glossary anchors, one course lesson, AS landing.
- Glossary is series-canonical: post-train, books' next revisions may point at it (item 12's
  shared-spine idea) — not this train.
