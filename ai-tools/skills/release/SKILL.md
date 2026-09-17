---
name: release
description: Full release workflow for the coding-technology repo — validate, wrap up, PR, merge, tag, build the book, publish to Leanpub. Four books, each versioned and tagged independently.
---

# Release

Execute the full release workflow for one book in the `coding-technology` repo.

**This repo holds four independently-versioned books.** A release is always *for one
book*. Never tag the repo as a whole, and never assume "the book" means JBCT.

| Book | Source | Meta dir | Tag prefix | Leanpub slug |
|------|--------|----------|------------|--------------|
| Java Backend Coding Technology | `book/` | — | `jbct-v` | `jbct-book` |
| Process-First Design | `book-pfd/` | `book-pfd-meta/` | `pfd-v` | `process-first-design` |
| Architecture Synthesis | `book-arch/` | `book-arch-meta/` | `arch-v` | `architecture-synthesis-the-next-correct-step` |
| Aether | `book-aether/` | `book-aether-meta/` | `aether-v` | *(not on Leanpub — draft)* |

**The version is single-sourced from the book's own `CHANGELOG.md` top entry.** The
build script reads it to stamp the title page. Never pass a version by hand; fix the
changelog instead. The root `CHANGELOG.md` covers the repo and shared assets (tooling,
skills, build scripts) and does **not** version any book.

## Arguments

Take the book and version from the invocation (e.g. `/release PFD 2.4.0`). If the book
is ambiguous, **stop and ask** — "the book" is ambiguous by design here.

## Steps

### 1. Identify the book and confirm the version

```bash
head -20 <book>/CHANGELOG.md      # top entry is the version being released
git tag -l '<prefix>-v*' | tail -3
```

The top changelog entry must match the version being released and must be dated today.
If the entry is dated earlier and content has landed since, **update the date** — the
title page carries it.

### 2. Branch

Release work happens on a branch; `main` is protected.

```bash
git checkout -b release-<book>-X.Y.Z
```

Use the book in the branch name (`release-pfd-2.4.0`), not a bare `release-X.Y.Z` —
four books share this repo.

### 3. Pre-release check

Run `/pre-release-check`. Additionally, for this repo:

```bash
cd website && npm run build          # site; the only link/orphan check
node --test website/next-step/*.test.js
./ai-tools/check-drift.sh
python3 ai-tools/sync-book-blocks.py --check
```

These four run in CI (`.github/workflows/checks.yml`). Fix failures before continuing.

### 4. Wrap up

Run `/wrap-up`: commit remaining changes in cohesive batches, push the branch.

Commits are **single-line conventional** (`feat:`, `fix:`, `docs:`, …) with **no
trailers and no attribution**.

**PDF and EPUB outputs are never committed** — they are gitignored build artifacts.
Verify with `git status` before committing that no `*.pdf` / `*.epub` is staged.

### 5. PR

```bash
gh pr list --head release-<book>-X.Y.Z
gh pr create --title "Release <BOOK> X.Y.Z" --body "..."
```

### 6. Merge

```bash
gh pr merge <N> --merge
git checkout main && git pull
```

`--admin` is **not** needed and has not been since 2026-09-12: the ruleset is scoped to
`refs/heads/main` with `required_approving_review_count: 0`. A 1-approval rule on a solo repo was
what forced it, never a tooling limitation.

The site deploys from `.github/workflows/deploy.yml` on merge to `main`, which builds with pinned
pandoc and uploads a prebuilt `dist/`. Netlify's own Git integration was disconnected 2026-09-12;
`dist/` is gitignored and built at deploy time.

### 7. Tag

Per-book prefix, never a bare `vX.Y.Z`:

```bash
git tag <prefix>-vX.Y.Z          # e.g. pfd-v2.4.0
git push origin <prefix>-vX.Y.Z
```

### 8. Build the book

Each book builds differently, **and the interfaces are not the same**. Check the script's
usage header before invoking it; do not assume a flag exists because a sibling script has
it.

```bash
# JBCT -- takes an OPTIONAL OUTPUT NAME, not a flag. There is no --final here.
# `./build-pdf.sh --final` silently produces files literally named "--final.pdf"
# and then dies on `rm -f --final-content.pdf`.
cd book && ./build-pdf.sh && ./build-epub.sh

# PFD -- `--final` drops the DRAFT watermark. build-pdf.sh emits the full book AND a
# -sample.pdf; the Leanpub *sample* is the condensed edition, built separately.
cd book-pfd-meta && ./build-pdf.sh --final && ./build-condensed.sh

# Architecture Synthesis -- `--final`; full + sample excerpt in one run, no condensed edition
cd book-arch-meta && ./build-pdf.sh --final

# Aether -- `--final`
cd book-aether-meta && ./build-pdf.sh --final
```

If a script prompts, feed it: `./build-pdf.sh </dev/null`.

**Verify the artifact before publishing** — the title page version and the new content:

```bash
pdftotext -f 1 -l 3 <book>.pdf - | grep -i version    # must show the release version
pdftotext <book>.pdf - | grep -ci "<a phrase new in this release>"
```

Note for PFD: the condensed edition is harvested from the manuscript's **bold spine**,
so it carries only bold *sentences*. A term bolded inline mid-sentence will not appear
there. That is the mechanism working correctly — never re-bold manuscript prose to get
something into the condensed edition.

### 9. Publish to Leanpub

Books ship in Leanpub **upload mode** — our pandoc/xelatex build makes the files,
Leanpub is only the storefront. The API needs a Pro plan.

```bash
set -a && . ../.env-pub && set +a          # LEANPUB_API_KEY; never echo it
./publish-leanpub.sh <slug> <pdf> [epub] [--sample] [--publish] [--dry-run]
```

- The script has **two interactive y/N confirms** (upload, then publish). Drive them
  with `printf 'y\ny\n' | ./publish-leanpub.sh ...`.
- `--publish` releases a new **live** version. It does **not** notify readers: Leanpub's
  `publish[email_readers]` defaults to `false` for books, and the script sends no
  parameters, so its call is exactly Leanpub's "publish without notifying readers" form.
  The new version is available to anyone who downloads; nobody is told it exists.
- **Notifying readers is a separate, deliberate act** — and it is outward-facing and
  irreversible, so never do it without the user asking. It needs its own call:

```bash
curl -d "api_key=$LEANPUB_API_KEY" \
     -d "publish[email_readers]=true" \
     -d "publish[release_notes]=<what changed>" \
     https://leanpub.com/<slug>/publish.json
```

  (Courses are the opposite — `POST /c/<slug>/publish.json` defaults `email_readers` to
  *true*. Do not carry the book default across.)
- `--dry-run` first if anything about the invocation is uncertain.
- Full edition and sample are **separate calls**. For PFD the sample is the condensed
  PDF:

```bash
printf 'y\ny\n' | ./publish-leanpub.sh process-first-design book-pfd-meta/process-first-design.pdf --publish
printf 'y\ny\n' | ./publish-leanpub.sh process-first-design book-pfd-meta/process-first-design-condensed.pdf --sample --publish
```

- Rate limit is roughly 3 operations per minute.

**The publish step prints `Unexpected Server Error` even on success.** It is benign and
expected. Never report a publish as failed on the strength of it — **always verify that
`last_published_at` actually moved**:

```bash
curl -s "https://leanpub.com/<slug>.json?api_key=$LEANPUB_API_KEY" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('last_published_at'), d.get('page_count'))"
```

Cross-check `page_count` against the PDF you just built.

### 10. Cleanup

```bash
git branch -d release-<book>-X.Y.Z
git push origin --delete release-<book>-X.Y.Z
```

## Output

Report each step's result, then a final summary:

- Book and version released
- Tag pushed (with its per-book prefix)
- Artifacts built, and the version verified inside the PDF
- Leanpub: published or upload-only, and the **verified** `last_published_at`
- **Whether readers were notified** — state this explicitly either way. "Published" alone
  is ambiguous and has been reported as if it meant readers knew, when it did not. If no
  notification was sent, say so, because it is usually the thing the user cares about.
- Branch cleaned up

Report failures with their output. If a step was skipped, say so.
