#!/usr/bin/env bash
# check-drift.sh — guards the AI tooling in ./skills and ./agents against silent
# staleness. Skills are installed away from this repo (~/.claude/skills), so a stale
# reference here becomes an invisible wrong answer there. Checks: retired-document
# mentions, unresolvable links, links that cannot survive installation, version pins
# that disagree with the field that governs them, and divergence from an installed copy.
# Exit 0 = all green; non-zero = findings printed.
set -u
cd "$(dirname "$0")" || exit 2
FAIL=0

# Pragmatica Core versions: derived, not declared here. ai-tools/pragmatica-version.json is
# the single source (issue #60) and pragmatica-pins.py compares every surface in the
# repository against it. It carries TWO fields since 2026-09-11, because one could answer
# only one question at a time: `depends_on` is the coordinate a reader's build should use
# and tracks Maven Central mechanically, while `verified_against` is what a human actually
# re-read the API at and is per documentation scope. The hard-coded constant they replace
# was compared against nothing external, over three paths, with a pattern that matched only
# `-rcN` — it could not fail in any of the directions that mattered.
#
# What this script no longer runs is the declaration-VS-UPSTREAM axis. It is the only one
# that needs the network, and inside a blocking check an unreachable Maven Central left it
# printing `axis NOT checked` while the run went green — a gate reporting success while
# examining nothing. It moved to .github/workflows/upstream-pin.yml, on a schedule, where
# unreachable FAILS because a scheduled job blocks no merge. Everything invoked here is
# hermetic and decidable from the checkout, which is what makes it fit to gate a PR.

# Book version is derived, not declared: BOOK-VERSIONING.md makes each book's
# CHANGELOG.md the single source of truth.
JBCT_VERSION="$(sed -n 's/^## \[\([0-9][0-9.]*\)\].*/\1/p' ../book/CHANGELOG.md | head -1)"

note() { printf '%s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*"; FAIL=1; }

[ -n "$JBCT_VERSION" ] || fail "could not derive JBCT version from ../book/CHANGELOG.md"

# --- 1-3. Retired documents, dead links, links that break on install ---
python3 - <<'EOF' || FAIL=1
import os, re, sys

# Retired documents: name -> what replaced it.
DENY = {
    'CODING_GUIDE.md': 'retired 2026-06-22 — cite the JBCT book instead',
}

# Book directory -> published web-edition URL prefix. Skills are installed outside this
# repo, so book citations must be URLs; no relative path reaches the book from
# ~/.claude/skills/<name>/.
WEB = {
    'book':      'https://pragmatica.dev/java/jbct/course/',
    'book-pfd':  'https://pragmatica.dev/method/pfd/course/',
    'book-arch': 'https://pragmatica.dev/method/architecture-synthesis/course/',
}

link_re = re.compile(r'\[[^\]]*\]\(([^)\s]+)\)')
denied, dead, escaping = [], [], []

for base in ('skills', 'agents'):
    for dirpath, _, files in os.walk(base):
        for fn in sorted(files):
            if not fn.endswith('.md'):
                continue
            path = os.path.join(dirpath, fn)
            # A skill's root is skills/<name>/; agents are single files.
            parts = path.split(os.sep)
            root = os.sep.join(parts[:2]) if parts[0] == 'skills' else parts[0]
            with open(path, encoding='utf-8') as fh:
                for lineno, line in enumerate(fh, 1):
                    for name, why in DENY.items():
                        if name in line:
                            denied.append((path, lineno, name, why))
                    for target in link_re.findall(line):
                        if target.startswith(('http://', 'https://', 'mailto:', '#')):
                            continue
                        target = target.split('#', 1)[0]
                        if not target:
                            continue
                        resolved = os.path.normpath(os.path.join(dirpath, target))
                        if not resolved.startswith(root + os.sep):
                            book = resolved.split(os.sep)[0]
                            slug = os.path.basename(resolved)[:-3]
                            hint = WEB.get(book, '') + (slug + '/' if book in WEB else '')
                            escaping.append((path, lineno, target, hint))
                        elif not os.path.exists(resolved):
                            dead.append((path, lineno, target))

if denied:
    print('FAIL: reference to a retired document (%d):' % len(denied))
    for p, n, name, why in denied:
        print('  %s:%d  %s  — %s' % (p, n, name, why))
if dead:
    print('FAIL: link does not resolve (%d):' % len(dead))
    for p, n, t in dead:
        print('  %s:%d  %s' % (p, n, t))
if escaping:
    print('FAIL: link escapes its skill and breaks once installed (%d):' % len(escaping))
    for p, n, t, hint in escaping:
        print('  %s:%d  %s%s' % (p, n, t, ('  — use ' + hint) if hint else ''))

sys.exit(1 if (denied or dead or escaping) else 0)
EOF

# --- 4. Pragmatica Core versions agree with the field that governs them ---
# pragmatica-pins.py carries the mechanism, the space it searches, the four blindnesses of
# the grep it replaces, and what a green result does NOT mean. It prints its own counts;
# never add -q, and read the occurrence, field and exception counts rather than the exit
# status. The `fields:` line is the one to read after a bump: it says how many occurrences
# each of depends_on and verified_against governs, so a stamp that has quietly been
# reclassified as a coordinate shows up as a moved count rather than as silence.
# --check is hermetic and says so on its `upstream:` line, which also names the scheduled
# workflow that owns that axis and FAILS here if that workflow has gone missing.
python3 pragmatica-pins.py --check || FAIL=1

# --- 5. Book version headers agree with the book's own CHANGELOG ---
stale_hdr=$(grep -rn -E '\*\*Based on:\*\* JBCT v[0-9.]+' ../book/*.md 2>/dev/null \
            | grep -v -F "JBCT v$JBCT_VERSION")
if [ -n "$stale_hdr" ]; then
  fail "book version header disagrees with book/CHANGELOG.md ($JBCT_VERSION):"
  printf '%s\n' "$stale_hdr"
fi

# --- 5b. CLAUDE.md's version table agrees with each book's CHANGELOG ---
# CLAUDE.md is loaded into every session, so a stale version there is an invisible wrong
# answer, exactly like a stale skill. The table drifted two releases before this existed.
for entry in "book:jbct-v" "book-pfd:pfd-v" "book-arch:arch-v" "book-aether:aether-v"; do
  dir="${entry%%:*}"; prefix="${entry##*:}"
  [ -f "../$dir/CHANGELOG.md" ] || continue
  real=$(sed -n 's/^## \[\([0-9][0-9.]*\)\].*/\1/p' "../$dir/CHANGELOG.md" | head -1)
  [ -n "$real" ] || continue
  row=$(grep -F "\`$dir/\`" ../CLAUDE.md | grep -F "\`$prefix\`") || true
  [ -n "$row" ] || continue
  case "$row" in
    *"| $real "*|*"| $real ("*) ;;
    *) fail "CLAUDE.md version table disagrees with $dir/CHANGELOG.md ($real):"
       printf '%s\n' "$row" ;;
  esac
done

# --- 6. Chapter cross-references resolve to a numbered chapter ---
# The AS manuscript cites chapters by number ("Chapter 8's subject"). Both renderers
# print those numbers over the twelve chapters below; front matter, the closing, the
# appendices and the references are unnumbered and consume no number. A reference past
# the end, or a reordering that changes which file is which number, silently breaks
# every citation, so the order is pinned here.
AS_CHAPTERS=(two-teams answer-sheet axes-and-ledger derivation verification
             three-profiles derived-blind when-derivation-says-no
             derivative pathfinding brownfield judgment)
if [ -d ../book-arch ]; then
  for i in "${!AS_CHAPTERS[@]}"; do
    f="../book-arch/${AS_CHAPTERS[$i]}.md"
    [ -f "$f" ] || fail "AS chapter $((i + 1)) is missing: ${AS_CHAPTERS[$i]}.md"
  done
  max=${#AS_CHAPTERS[@]}
  bad=$(grep -ho 'Chapter [0-9]\+' ../book-arch/*.md 2>/dev/null \
        | awk -v m="$max" '{ if ($2 < 1 || $2 > m) print }' | sort -u)
  if [ -n "$bad" ]; then
    fail "AS prose cites a chapter number outside 1..$max:"
    printf '%s\n' "$bad"
  fi
  # The web renderer must number the same set.
  if [ -f ../website/build.js ] && ! grep -q "chapterNumbers: true" ../website/build.js; then
    fail "the AS course no longer prints chapter numbers, so its prose citations resolve to nothing"
  fi
fi

# --- 7. Course lesson blurbs still assert against their book chapters ---
# Each website/course/<course>/<slug>.md shadows <book>/<slug>.md and nothing related the
# two, so #70 took book/comparison.md from 470 lines to 218 while its blurb went on
# describing three deleted sections and every check here stayed green. A blurb is prose:
# it cannot be generated from its chapter or compared to it by meaning. What is checkable
# is whether anyone has looked since the chapter last moved. blurb-stamps.py carries the
# mechanism and, more importantly, what a green result does NOT claim.
python3 blurb-stamps.py --check || FAIL=1

# --- 8. Installed copy matches this repo (local only; absent in CI) ---
INSTALLED="${CLAUDE_HOME:-$HOME/.claude}"
if [ -d "$INSTALLED/skills" ]; then
  for src in skills/*/; do
    name=$(basename "$src")
    dst="$INSTALLED/skills/$name"
    [ -d "$dst" ] || { note "note: skill '$name' is not installed"; continue; }
    if ! diff -rq "$src" "$dst" >/dev/null 2>&1; then
      fail "installed skill '$name' diverges from this repo:"
      diff -rq "$src" "$dst" 2>&1 | sed 's/^/  /'
    fi
  done
  for src in agents/*.md; do
    name=$(basename "$src")
    dst="$INSTALLED/agents/$name"
    [ -f "$dst" ] || { note "note: agent '$name' is not installed"; continue; }
    if ! diff -q "$src" "$dst" >/dev/null 2>&1; then
      fail "installed agent '$name' diverges from this repo"
    fi
  done
else
  note "note: no installed copy at $INSTALLED — skipping install-drift check"
fi

# --- 9. Installed skills this repo does NOT track ---
# Section 8 walks repo -> installed, so anything installed WITHOUT a counterpart here is
# invisible to it BY CONSTRUCTION -- the check cannot report on what it never enumerates.
# That blind spot shipped a false instruction: /release told every reader "Branch protection
# requires admin" for days after the ruleset changed, and no check could see it because the
# skill lived only in ~/.claude. Being untracked is not automatically wrong -- general-purpose
# skills legitimately live outside this repo -- so this NAMES them instead of failing, and the
# naming is the whole point: an uncovered set you can read is not the same as one you cannot.
if [ -d "$INSTALLED/skills" ]; then
  uncovered=""
  for dst in "$INSTALLED"/skills/*/; do
    [ -d "$dst" ] || continue
    name=$(basename "$dst")
    [ -d "skills/$name" ] || uncovered="$uncovered $name"
  done
  if [ -n "$uncovered" ]; then
    note "note: installed skills outside the drift net (not tracked here):$uncovered"
  else
    note "every installed skill is tracked here"
  fi
fi

[ "$FAIL" -eq 0 ] && note "ai-tools drift checks: all green" || note "ai-tools drift checks: FINDINGS ABOVE"
exit "$FAIL"
