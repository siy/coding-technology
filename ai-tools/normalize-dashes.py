#!/usr/bin/env python3
"""Normalize dash punctuation in the JBCT book's PROSE to the unspaced em-dash.

Targets: ' - ' (spaced hyphen) and ' -- ' / 'word--word' (double hyphen) between words.
Never touched: fenced/indented code, inline code spans, YAML front matter, HTML
comments/tags, URLs and link text and targets (they quote chapter headings), headings (anchors are URLs; the slug drops
the em-dash and would fuse the words), table cells containing code, list markers,
numeric/math operands, CLI flags, compound words.
Scope: book/*.md minus changelog/working documents (published history, not chapters).
Idempotent. `--check` exits 1 if any target remains.
Usage: normalize-dashes.py [--check] [files...]   (default: book/*.md beside this script's repo)
"""
import re, sys, glob, os

EXCLUDE = {"CHANGELOG.md", "LEANPUB_SETUP.md", "PLANNED-CHANGES.md",
           "restructuring-map.md", "jbct-book-feedback-java25.md"}
FENCE = re.compile(r'^\s*(```|~~~)')
MASK = re.compile(r'`[^`\n]*`|<!--.*?-->|<[^>\n]+>|\[[^\]\n]*\]\([^)\n]*\)|https?://[^\s)>\]]+')
SPACED = re.compile(r'(?<=\S) +(?:--|-) +(?=\S)')
TIGHT = re.compile(r'(?<=[A-Za-z"\'”’)\]*_])--(?=[A-Za-z"\'“‘(\[*_])')
NUMERIC = re.compile(r'\$?\d[\w.,%]*$')


def fix_text(text):
    saved = []

    def hide(m):
        saved.append(m.group(0))
        return '\x00%d\x00' % (len(saved) - 1)
    t = MASK.sub(hide, text)

    def spaced(m):
        left = re.search(r'(\S+)$', t[:m.start()])
        right = re.match(r'\S+', t[m.end():])
        l = left.group(1) if left else ''
        r = right.group(0) if right else ''
        if NUMERIC.match(l) and re.match(r'\$?\d', r):  # numeric operands: minus/range
            return m.group(0)
        return '—'
    t = SPACED.sub(spaced, t)
    t = TIGHT.sub('—', t)
    return re.sub('\x00(\\d+)\x00', lambda m: saved[int(m.group(1))], t)


def fix_line(line):
    if re.match(r'^\s{0,3}#{1,6}\s', line):            # heading
        return line
    if re.match(r'^\s*([-*_]\s*){3,}$', line):         # horizontal rule
        return line
    if re.match(r'^\s*\|?[\s:|-]+\|[\s:|-]*$', line) and '-' in line:  # table separator
        return line
    if re.match(r'^\s*\|.*\|\s*$', line):              # table row: skip cells with code
        return '|'.join(c if '`' in c else fix_text(c) for c in line.split('|'))
    q = re.match(r'^((?:\s*>)+\s*)(.*)$', line)          # blockquote prefix
    if q:
        return q.group(1) + fix_line(q.group(2))
    m = re.match(r'^(\s*(?:[-*+]|\d+\.)\s+)(.*)$', line)  # keep the list marker
    if m:
        return m.group(1) + fix_text(m.group(2))
    return fix_text(line)


def process(src):
    out, fence, i = [], None, 0
    lines = src.split('\n')
    if lines and lines[0].strip() == '---':            # YAML front matter
        j = next((k for k in range(1, len(lines)) if lines[k].strip() in ('---', '...')), None)
        if j is not None:
            out.extend(lines[:j + 1])
            i = j + 1
    in_comment = False
    for line in lines[i:]:
        if fence:
            out.append(line)
            if FENCE.match(line) and line.strip().startswith(fence):
                fence = None
            continue
        if FENCE.match(line):
            fence = FENCE.match(line).group(1)
            out.append(line)
            continue
        if in_comment:
            out.append(line)
            if '-->' in line:
                in_comment = False
            continue
        if '<!--' in line and '-->' not in line.split('<!--', 1)[1]:
            in_comment = True
            out.append(line)
            continue
        out.append(fix_line(line))
    return '\n'.join(out)


def main(argv):
    check = '--check' in argv
    files = [a for a in argv if not a.startswith('--')]
    if not files:
        root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'book')
        files = sorted(glob.glob(os.path.join(root, '*.md')))
    files = [f for f in files if os.path.basename(f) not in EXCLUDE]
    total_lines = total_files = 0
    for f in files:
        src = open(f, encoding='utf-8').read()
        new = process(src)
        n = sum(1 for a, b in zip(src.split('\n'), new.split('\n')) if a != b)
        if n:
            total_files += 1
            total_lines += n
            print('%5d  %s' % (n, os.path.relpath(f)))
            if not check:
                open(f, 'w', encoding='utf-8').write(new)
    print('%s: %d line(s) across %d file(s)' % ('REMAINING' if check else 'changed', total_lines, total_files))
    return 1 if (check and total_lines) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
