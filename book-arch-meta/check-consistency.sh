#!/usr/bin/env bash
# check-consistency.sh — pre-release regression checks for the Architecture Synthesis
# manuscript (../book-arch). Grep-level guards from the series-review production
# checklist: instrument-name consistency, disclosure-count regression, forbidden
# vocabulary, em-dash budget. Exit 0 = all green; non-zero = findings printed.
set -u
cd "$(dirname "$0")/../book-arch" || exit 2
FAIL=0

note() { printf '%s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*"; FAIL=1; }

# --- 1. Author-runtime disclosure regression (decision G, as drafted: anonymous) ---
if [ "$(grep -r -c -i 'aether' -- *.md | awk -F: '{s+=$2} END{print s}')" -ne 0 ]; then
  fail "'Aether' appears by name (the disclosure is anonymous by design)"
fi
for phrase in 'one such runtime' 'runtime class Chapter 3 disclosed' 'third and final appearance'; do
  n=$(grep -l -F "$phrase" -- *.md | wc -l | tr -d ' ')
  [ "$n" -eq 1 ] || fail "disclosure phrase '$phrase' found in $n files (expected exactly 1)"
done

# --- 2. Forbidden vocabulary (house-wide) ---
for term in 'non-functional requirement' 'NFR'; do
  hits=$(grep -rn -e "$term" -- *.md 2>/dev/null | grep -v 'CHANGELOG')
  [ -z "$hits" ] || { fail "forbidden term '$term':"; printf '%s\n' "$hits"; }
done

# --- 3. Canonical instrument names present (spot the accidental rename) ---
for name in 'scope test' 'null vector' 'pressure matrix' 'entry gate' 'recovery triple' 'decision record' 'revisit when'; do
  grep -rql -F "$name" -- *.md >/dev/null || fail "canonical instrument name missing: '$name'"
done

# --- 4. Known drift variants (must not appear) ---
for variant in 'scope rule' 'scoping test' 'answer gate'; do
  hits=$(grep -rn -F "$variant" -- *.md 2>/dev/null)
  [ -z "$hits" ] || { fail "drift variant '$variant' (canonical name exists — cite it):"; printf '%s\n' "$hits"; }
done

# --- 5. Em-dash budget (voice §5): no prose unit over 2, structural leads excluded roughly ---
python3 - <<'EOF' || FAIL=1
import glob, re, sys
bad = []
for f in sorted(glob.glob('*.md')):
    if f == 'CHANGELOG.md': continue
    units, in_code, para = [], False, []
    for line in open(f):
        line = line.rstrip('\n')
        if line.strip().startswith('```'): in_code = not in_code; continue
        if in_code or line.strip().startswith('|'): continue
        if not line.strip():
            if para: units.append(' '.join(para)); para = []
            continue
        if re.match(r'\s*([-*+]|\d+\.)\s', line):
            if para: units.append(' '.join(para)); para = []
            units.append(line)
        else: para.append(line)
    if para: units.append(' '.join(para))
    for u in units:
        # quoted spans are verbatim source material — exempt their dashes
        u_counted = re.sub(r'"[^"]*"|“[^”]*”', '', u)
        n = u_counted.count('—')
        # exempt structural lead dashes: '**Term** — *values* — prose' has two, plain bold lead has one
        if re.match(r'\s*(\d+\.\s+)?\*\*[^*]+\*\*\s+—\s+\*[^*]+\*\s+—', u): n -= 2
        elif re.match(r'\s*(\*\*|\d+\.\s+\*\*)', u): n -= 1
        if n > 2: bad.append((f, u.strip()[:70]))
if bad:
    print('FAIL: em-dash budget exceeded in %d unit(s):' % len(bad))
    for f, s in bad: print('  %s: %s...' % (f, s))
    sys.exit(1)
EOF

[ "$FAIL" -eq 0 ] && note "consistency checks: all green" || note "consistency checks: FINDINGS ABOVE"
exit "$FAIL"
