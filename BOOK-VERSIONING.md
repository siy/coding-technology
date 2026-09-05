# Book Versioning

How the books in this repository are versioned and how readers track changes
between editions. The same scheme applies to every book:

- **Process-First Design** — `book-pfd/` (built from `book-pfd-meta/`)
- **Architecture Synthesis** — `book-arch/`
- **Java Backend Coding Technology** — `book/`
- **Aether** — `book-aether/` (draft in progress)

## One version line per book

Each book versions independently with [Semantic Versioning](https://semver.org/)
and owns a `CHANGELOG.md` in its source directory. That changelog is the **single
source of truth**: the build script reads its top entry to stamp the title page and
renders the whole file as the book's **Revision History** appendix. The version a
book builds as cannot drift from its history, because both come from one file.

The repository-wide root `CHANGELOG.md` covers tooling and shared assets (skills,
build scripts, Pragmatica Core version bumps), not book content.

## What the numbers mean

For a book, SemVer reads as:

- **MAJOR** — a new edition: restructure, renumbering, or content readers relied on
  being removed or replaced.
- **MINOR** — substantial additive change: a new chapter, section, or concept.
- **PATCH** — corrections: typos, clarifications, fixes that add no new concept.

**Correcting a defect is a PATCH, even when the defect was a prescription.** MAJOR's "content
readers relied on" means content the book still stands behind and chose to replace, which is why
that line is scoped to a new edition. Removing a claim the book had already contradicted
elsewhere, or that was never true, changes no teaching and introduces no concept. The precedent is
in *PFD*'s own history: the locking → guarded-field correction replaced a prescription readers had
followed and shipped as **2.4.2**. It was cited later among the changes that made 3.0.0 an edition,
but on its own it was a patch, and the edition's majorness came from the accumulation and the new
module. (Owner ruling, 2026-09-05, after a session read that citation backwards and classified a
set of pure corrections as majors.)

## Release status is the major version

- `0.x` — pre-GA: draft / preview, not yet released to readers as a finished
  edition. Draft builds carry the watermark.
- `1.0.0` — GA: the first edition released to readers.
- `>= 1.0.0` — subsequent released editions.

Current state:

| Book | Version | Status |
|------|---------|--------|
| JBCT | 5.0.0 | released; continues its existing history |
| PFD  | 3.0.0 | released |
| AS   | 1.1.2 | released |
| Aether | 0.1.0 | draft (pre-GA); manuscript in progress, not yet tagged |

> The books use plain SemVer, not an `rc` suffix. The `1.0.0-rc1` in the text
> refers to the Pragmatica Core *library*, not to any book.

## CHANGELOG.md format

[Keep a Changelog](https://keepachangelog.com/), newest version on top:

```
## [X.Y.Z] - YYYY-MM-DD
### Added / Changed / Fixed
- reader-facing, one line each
```

The build script extracts `X.Y.Z` and the date from the first heading matching
`## [<digit>...] - <date>`. Keep entries reader-facing (what changed for someone
reading the book), not authoring/tooling detail.

## Tagging

Each book is tagged independently with an **annotated** tag named
`<book>-v<X.Y.Z>` — `jbct-v3.2.0`, `pfd-v0.9.0`, `arch-v1.0.0`, `aether-v0.1.0`. The tag points at
the commit the book builds as that version (the commit whose `CHANGELOG.md` top
entry is that version).

The pre-3.x repository-wide tags (`v1.0.0`..`v3.0.0`) are kept as frozen history of
the unified-repo era; they are not deleted or re-attributed to a single book.

Tags are created only on explicit command. Writing a CHANGELOG entry records the
version a book builds as; it does not create the tag.
