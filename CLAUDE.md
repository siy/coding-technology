## Governing Documents

RFCs: https://github.com/pragmaticalabs/pragmatica/tree/master/docs/rfc

- RFC-0000: Ecosystem Foundation
- RFC-0001..0006: slice contract, dependency protocol, HTTP layer, slice packaging,
  blueprint format, slice runtime config — the substrate the Aether book documents.

---

## What this repository is

Four books, a website that renders them as free web editions, and the AI tooling. No
Java sources and no `pom.xml` — the only build here is the website.

| Book | Source | Version | Tag prefix |
|------|--------|---------|------------|
| Java Backend Coding Technology | `book/` | 4.4.0 | `jbct-v` |
| Process-First Design | `book-pfd/` | 2.5.0 | `pfd-v` |
| Architecture Synthesis | `book-arch/` | 1.1.2 | `arch-v` |
| Aether | `book-aether/` | 0.1.0 (draft) | `aether-v` |

Each book's own `CHANGELOG.md` is the **single source of truth** for its version: the
build script reads the top entry to stamp the title page. The versions above are a
convenience copy, and `check-drift.sh` fails if one disagrees with its changelog — it
drifted two releases before that check existed. The root `CHANGELOG.md` covers
the repository and shared assets — tooling, skills, build scripts. See
`BOOK-VERSIONING.md`.

Each book has a `<book>-meta/` directory (plans, handovers, specs, build scripts). These
are tracked; they were untracked until 2026-07-29.

`ai-tools/{skills,agents}` is the source for the Claude Code skills and agents; they are
installed by copying to `~/.claude/`, so a copy on this machine can diverge from the
repo in both directions. `check-drift.sh` reports that.

---

## Build and check

```bash
cd website && npm run build          # the site; also the only link/orphan check
node --test website/next-step/*.test.js   # the next_step derivation engine
./ai-tools/check-drift.sh            # tooling staleness + AS chapter citations
python3 ai-tools/sync-book-blocks.py --check   # book-owned blocks still in sync
```

The first three plus the block check run in CI (`.github/workflows/checks.yml`).
`deploy.yml` publishes the site to Netlify on merge to `main`; `dist/` is gitignored and
built at deploy time.

Books build to PDF/EPUB via `book/build-pdf.sh`, `book/build-epub.sh`, and
`<book>-meta/build-pdf.sh` for the others. **PDF and EPUB outputs are never committed** —
they are gitignored build artifacts.

`sync-book-blocks.py` copies enumerable rules from the books into the skills between
`<!-- book:<id> -->` markers. Those regions are build output: edit the book, then
regenerate. A renamed book heading fails extraction rather than leaving a stale copy.

---

## Java & Pragmatica Core

**The book is authoritative, not the skill.** `book/` is the single source for JBCT
rules; `/jbct` and `jbct-coder` are derived artifacts and have drifted from it before.
Where they disagree with the book, the book wins.

**For API signatures, read the Pragmatica source** — `~/IdeaProjects/pragmatica/core/src/main/java/org/pragmatica/lang/`.
Specs and docs have encoded antipatterns that the source does not (`Promise<Result<T>>`
is forbidden; `Fn1<ReturnType, ParamType>` puts the return type first). Never reproduce a
signature from memory or from a summary.

---

## Progress tracking

Use `TaskCreate`/`TaskUpdate` for work of three or more steps, and keep the list current:
mark a task `in_progress` before starting it and `completed` when it is genuinely done —
not when it is nearly done. The list is how the work stays visible, so prefer a few
meaningful tasks over many trivial ones.

---

## Project Notes

- **"The book"** is ambiguous now that there are four — say which, or take it from
  context. Bare "the document" historically meant the JBCT book (`book/`); the retired
  `CODING_GUIDE.md` and learning series were folded into it.
- **Tag versions** only after an explicit command. Several changes may precede a tag.
- **Releases**: branch → PR → `gh pr merge --admin` (branch protection) → per-book tag →
  rebuild books → Leanpub. `./publish-leanpub.sh <slug> <pdf> [epub] [--sample]
  [--publish]`, key in `../.env-pub`. The publish call prints a harmless "Unexpected
  Server Error" even on success — always verify `last_published_at` moved. The `/release`
  skill carries the full workflow.
- **Publishing is not notifying.** `--publish` makes a new version live and emails
  nobody: Leanpub's `publish[email_readers]` defaults to `false` for books, and the
  script sends no parameters. Notifying readers is a separate, irreversible call that
  needs an explicit ask — `curl -d "api_key=$LEANPUB_API_KEY" -d
  "publish[email_readers]=true" -d "publish[release_notes]=..."
  https://leanpub.com/<slug>/publish.json`, confirmed by `job_status.json` reporting
  `EmailReadersJob`. A moved `last_published_at` proves a version went live, never that
  a reader was told. (Courses default the flag to *true*; books do not.)
- **PR merged** → check the current branch; if it is not `main`, switch and pull.
- **`jbct-coder.md` header**: preserve during edits. Update the description if needed;
  ask before changing other fields.
- **Voice documents** live in the private `../oss/content/` repo — a shared
  `book-voice.md` plus per-book overlays. Never copy them into this public repo.
