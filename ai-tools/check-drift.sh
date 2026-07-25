#!/usr/bin/env bash
# check-drift.sh — guards the AI tooling in ./skills and ./agents against silent
# staleness. Skills are installed away from this repo (~/.claude/skills), so a stale
# reference here becomes an invisible wrong answer there. Checks: retired-document
# mentions, unresolvable links, links that cannot survive installation, version pins
# that disagree with the declared canonical, and divergence from an installed copy.
# Exit 0 = all green; non-zero = findings printed.
set -u
cd "$(dirname "$0")" || exit 2
FAIL=0

# Canonical Pragmatica Core version. Bump HERE when the library releases; the checker
# then names every file still carrying the old pin.
PRAGMATICA_VERSION='1.0.0-rc1'

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

# --- 4. Pragmatica Core pin agrees with the declared canonical ---
stale_pin=$(grep -rn -E '1\.0\.0-rc[0-9]+' skills agents ../book/*.md 2>/dev/null \
            | grep -v -F "$PRAGMATICA_VERSION")
if [ -n "$stale_pin" ]; then
  fail "Pragmatica Core pin disagrees with declared $PRAGMATICA_VERSION:"
  printf '%s\n' "$stale_pin"
fi

# --- 5. Book version headers agree with the book's own CHANGELOG ---
stale_hdr=$(grep -rn -E '\*\*Based on:\*\* JBCT v[0-9.]+' ../book/*.md 2>/dev/null \
            | grep -v -F "JBCT v$JBCT_VERSION")
if [ -n "$stale_hdr" ]; then
  fail "book version header disagrees with book/CHANGELOG.md ($JBCT_VERSION):"
  printf '%s\n' "$stale_hdr"
fi

# --- 6. Installed copy matches this repo (local only; absent in CI) ---
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

[ "$FAIL" -eq 0 ] && note "ai-tools drift checks: all green" || note "ai-tools drift checks: FINDINGS ABOVE"
exit "$FAIL"
