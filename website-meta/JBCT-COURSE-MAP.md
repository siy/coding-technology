# JBCT Course — Chunking Map & Rename Plan (v1, 2026-07-13)

*The URL contract for the site rework. Lesson = chapter (1:1, single-source chunking
at chapter granularity). Course layer sources: retired series framings (`03c6ba4^:series/`,
reading times + topics + takeaways + Try-It-Now), `appendix-b-exercises.md` (per-chapter
exercises), `chapter-summaries.md` (TOC blurbs). AWAITING USER SIGN-OFF before renames.*

## Course structure — 6 parts, 22 lessons

| # | Lesson slug (= new filename, = URL) | Current file | Book ch. |
|---|---|---|---|
| **Part I — Foundations** ||||
| 1 | `introduction` | ch01-introduction.md | 1 |
| 2 | `from-process-to-patterns` | ch02-design-methodology.md | 2 |
| 3 | `four-return-types` | ch02-four-return-types.md | 3 |
| 4 | `pragmatica-core-essentials` | ch03-pragmatica-lite-essentials.md | 4 |
| **Part II — The Type Discipline** ||||
| 5 | `parse-dont-validate` | ch04-parse-dont-validate.md | 5 |
| 6 | `error-handling` | ch05-error-handling.md | 6 |
| 7 | `null-policy-recovery` | ch06-null-policy-recovery.md | 7 |
| **Part III — Patterns** ||||
| 8 | `basic-patterns` | ch07-basic-patterns.md | 8 |
| 9 | `advanced-patterns` | ch08-advanced-patterns.md | 9 |
| 10 | `knowledge-gathering-pipelines` | ch08b-knowledge-gathering-pipelines.md | 9b |
| 11 | `thread-safety` | ch09-thread-safety.md | 10 |
| **Part IV — Testing** ||||
| 12 | `testing-philosophy` | ch10-testing-philosophy.md | 11 |
| 13 | `testing-practice` | ch11-testing-practice.md | 12 |
| **Part V — Worked Examples** ||||
| 14 | `registeruser-example` | ch12-registeruser-example.md | 13 |
| 15 | `placeorder-example` | ch13-placeorder-example.md | 14 |
| 16 | `publisharticle-example` | ch14a-publisharticle-example.md | 15a |
| 17 | `transferfunds-example` | ch14b-transferfunds-example.md | 15b |
| **Part VI — In Production** ||||
| 18 | `project-structure` | ch15-project-structure.md | 16 |
| 19 | `systematic-application` | ch16-systematic-application.md | 17 |
| 20 | `migration-strategies` | ch17-migration-strategies.md | 18 |
| 21 | `comparison` | ch18-comparison.md | 19 |
| 22 | `troubleshooting-faq` | ch19-troubleshooting-faq.md | 20 |

**Non-lesson files:** `appendix-a-api-reference.md` → stays, published as course
reference page (`/java/jbct/reference/`); `appendix-b-exercises.md` → stays as book
appendix; its exercises are MINED into lesson exercise blocks (course layer);
`appendix-c-glossary.md` → folds into the canonical site glossary (`/method/glossary/`),
stays in the book; `chapter-summaries.md` → raw material for course-TOC lesson blurbs
(book keeps it or drops it at next book revision — book decision, not site).

## Spine

New `book/root.md` (PFD/AS pattern): ordered slug list with part groupings. All
builds (site course, PDF, EPUB) consume the spine; order and numbering live ONLY here.

## Numbering (phase 2 — now IN scope, forced by the course)

In-prose "Chapter N" references (104 sites) are meaningless inside course lessons
(lessons renumber). Therefore:
- H1s lose "Chapter N:" → plain titles ("Parse, Don't Validate").
- Prose cross-refs become title links: "see Chapter 9" → "see [Advanced Patterns](advanced-patterns.md)".
  Scripted via the table above (current H1s carry true numbers → deterministic map),
  then hand-checked. 83 existing filename links remapped by the same table.
- Book PDF/EPUB builds inject "Chapter N" numbering from spine position; the site
  renders lesson numbers from the same spine. Nothing hand-numbered survives.

## URLs & redirects (site cutover)

- Course TOC: `/java/jbct/course/` · lessons: `/java/jbct/course/<slug>/`
- Redirects: `/book/chXX-*.html → /java/jbct/course/<slug>/` (22, per table);
  `/book/appendix-a-*.html → /java/jbct/reference/`;
  `/book/appendix-c-*.html → /method/glossary/`;
  `/book/index.html → /java/jbct/course/`; dropped pages (CONTACT,
  MANAGEMENT_PERSPECTIVE) → 410 or redirect to front door. Mechanism per host
  (check DEPLOYMENT.md at implementation).

## Progress model

Two levels: course lattice on the TOC (22 nodes, 6 part groups); per-part lattice on
lesson pages (the mock's row, sized to the part). localStorage keys per lesson slug.

## Touch points (implementation checklist)

1. ~~`git mv` renames per table~~ DONE (commit `bfa8a2e` on `site-redesign`; git tracked all as renames).
2. ~~`book/root.md` spine created~~ DONE.
3. ~~H1 number strip + prose cross-ref conversion~~ DONE (scripted 2-pass; 0 residuals in
   live files; CHANGELOG/restructuring-map left historical; TABLE_OF_CONTENTS retired;
   book is now chapters 1–22, letter suffixes absorbed — noted in book CHANGELOG [Unreleased],
   next book release is 5.0.0).
4. ~~build scripts consume spine, inject numbering~~ DONE (both PDF+EPUB verified: full 1–22
   sequence, sample carries true numbers 1/3/5/8/14).
5. ~~`website/build.js` rework~~ DONE (commit `2d9f83d`: fresh build.js + lib/highlight.js;
   templates front-door/landing/course-toc/lesson; restyled page.html for the 7 legacy
   tooling docs kept at their old root URLs; style.css = mock system; content-hash
   preserved; dist wiped per build; 41 pages, link check green; `dist/_redirects`
   complete with catchall last; CONTACT/MANAGEMENT_PERSPECTIVE dropped → 301 to labs).
6. ~~Course layer authoring~~ DONE (22 files, 2,458 words, iron-rule self-audit passed;
   15 exercises from appendix-b, 1 from mock, 6 original).
7. ~~Verify~~ DONE 2026-07-13 (independent build + link check + page-anatomy spot-checks;
   glossary 126 entries/unique anchors; AS landing claims the title).
   REMAINING before ship: user visual review (`python3 -m http.server -d website/dist`),
   PFD/AS landing course-link wording final pass at AS release, RCT demo pass (separate),
   Netlify deploy rides the AS-release PR.
