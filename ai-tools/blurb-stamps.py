#!/usr/bin/env python3
"""blurb-stamps.py — tripwire against a course blurb outliving its book chapter.

Each website/course/<course>/<slug>.md is a hand-written lesson blurb shadowing the book
chapter at <book>/<slug>.md. Nothing related the two, so PR #70 could take
book/comparison.md from 470 lines to 218 while the blurb went on describing three deleted
sections, and no check could see it (issue #69).

The mechanism is deliberately weak and must stay weak. A blurb is prose: it cannot be
generated from its chapter, and comparing the two by meaning is not available. What IS
checkable is whether anyone has looked since the chapter last moved. Each blurb carries

    ---
    reviewed-at: <40 hex>
    ---

holding the chapter's git blob id at the moment an author last asserted "I read this blurb
against that chapter and it still holds". Change the chapter's bytes and its blob id
changes, the stamp no longer matches, and the check fails until someone re-asserts.

WHAT A GREEN RESULT DOES NOT MEAN. A matching stamp is not evidence that the blurb is
accurate, and nothing here reads either text. It carries exactly one claim: a human
asserted this blurb against this byte-identical chapter. Anyone can clear the tripwire by
running --update without reading anything, and the check cannot tell the difference. So a
stale stamp proves an unreviewed change; a current stamp is only an unfalsified assertion.
The failure direction is the load-bearing one.

The same caveat applies with full force to the 47 stamps seeded when this landed. Seeding
asserted nothing about those blurbs; it recorded the chapter state each one was already
sitting beside, so that movement FROM here is caught. It did not review them, and none of
them became verified by acquiring a stamp.

The blob id is git's own (sha1 of b"blob <len>\\0" + bytes), computed here rather than
shelled out to git so the check runs with no repository present. Using git's id instead of
a bare digest buys traceability: `git log --raw -- <chapter>` prints blob ids, so an author
holding a stale stamp can find the revision last reviewed and diff forward from it.

  --check          exit non-zero if any blurb is unstamped, stale, or has no chapter
  --update [path]  (re)stamp the named blurbs, or every blurb when none are named
"""

import argparse
import hashlib
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Course layer directory -> the book whose chapters it shadows. Mirrors the layerDir /
# bookDir pairing in website/build.js's COURSES table. The join is filename equality;
# verified 2026-09-09 in both directions across all 47 blurbs, no exceptions, no blurb
# without a chapter and no course lesson without a blurb.
COURSES = [
    ('website/course/jbct', 'book'),
    ('website/course/pfd', 'book-pfd'),
    ('website/course/architecture-synthesis', 'book-arch'),
]

FRONT_MATTER_RE = re.compile(r'^---\r?\n(.*?)\r?\n---\r?\n?', re.S)
STAMP_RE = re.compile(r'^reviewed-at:\s*([0-9a-f]{40})\s*$', re.M)


def blob_id(path):
    """git's object id for a file's contents, without invoking git."""
    with open(path, 'rb') as fh:
        data = fh.read()
    return hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest()


def rel(path):
    return os.path.relpath(path, ROOT)


def pairs():
    """Every blurb paired with the chapter it shadows, plus the missing course dirs.

    A course directory that has gone missing is reported rather than skipped: silently
    examining two courses instead of three is the failure this check exists to prevent.
    """
    found, missing_dirs = [], []
    for layer, book in COURSES:
        ldir = os.path.join(ROOT, layer)
        if not os.path.isdir(ldir):
            missing_dirs.append(layer)
            continue
        for fn in sorted(os.listdir(ldir)):
            if fn.endswith('.md'):
                found.append((os.path.join(ldir, fn), os.path.join(ROOT, book, fn)))
    return found, missing_dirs


def read_stamp(text):
    m = FRONT_MATTER_RE.match(text)
    if not m:
        return None
    found = STAMP_RE.search(m.group(1))
    return found.group(1) if found else None


def write_stamp(path, sha):
    """Set reviewed-at, preserving any other front-matter keys the file carries."""
    with open(path, encoding='utf-8') as fh:
        text = fh.read()
    m = FRONT_MATTER_RE.match(text)
    keys = m.group(1).split('\n') if m else []
    body = (text[m.end():] if m else text).lstrip('\n')
    keys = [k for k in keys if not k.startswith('reviewed-at:') and k.strip()]
    keys.insert(0, 'reviewed-at: %s' % sha)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write('---\n%s\n---\n\n%s' % ('\n'.join(keys), body))


def check():
    found, missing_dirs = pairs()
    unresolved, unstamped, stale = [], [], []

    for blurb, chapter in found:
        if not os.path.isfile(chapter):
            unresolved.append((blurb, chapter))
            continue
        with open(blurb, encoding='utf-8') as fh:
            recorded = read_stamp(fh.read())
        current = blob_id(chapter)
        if recorded is None:
            unstamped.append((blurb, chapter))
        elif recorded != current:
            stale.append((blurb, chapter, recorded, current))

    for layer in missing_dirs:
        print('FAIL: course directory is missing, so its blurbs were not examined: %s' % layer)

    if unresolved:
        print('FAIL: course blurb has no chapter to check against (%d):' % len(unresolved))
        for blurb, chapter in unresolved:
            print('  %s  — expected %s' % (rel(blurb), rel(chapter)))

    if unstamped:
        print('FAIL: course blurb carries no reviewed-at stamp, so nothing can detect it '
              'going stale (%d):' % len(unstamped))
        for blurb, chapter in unstamped:
            print('  %s  — read it against %s, then run:' % (rel(blurb), rel(chapter)))
            print('      ai-tools/blurb-stamps.py --update %s' % rel(blurb))

    if stale:
        print('FAIL: course blurb is stale — its chapter changed after the blurb was last '
              'asserted against it (%d):' % len(stale))
        for blurb, chapter, recorded, current in stale:
            print('  %s' % rel(blurb))
            print('      chapter      %s' % rel(chapter))
            print('      reviewed-at  %s' % recorded)
            print('      now          %s' % current)
            print('      what changed  git cat-file -p %s | diff -u - %s' % (recorded, rel(chapter)))
            print('      still holds?  ai-tools/blurb-stamps.py --update %s' % rel(blurb))

    findings = len(missing_dirs) + len(unresolved) + len(unstamped) + len(stale)

    # A check that examined nothing exits green unless it says so out loud.
    if not found:
        print('FAIL: course blurb staleness examined NOTHING — no .md files found under %s'
              % ', '.join(layer for layer, _ in COURSES))
        return 1

    print('course blurb staleness: examined %d blurb(s) against %d book(s) — %s'
          % (len(found), len(COURSES),
             'all current' if not findings else '%d finding(s) above' % findings))
    return 1 if findings else 0


def update(targets):
    found, missing_dirs = pairs()
    for layer in missing_dirs:
        print('ERROR: course directory is missing: %s' % layer)
    if missing_dirs:
        return 2

    by_path = {os.path.normpath(b): c for b, c in found}
    if targets:
        selected = []
        for t in targets:
            key = os.path.normpath(os.path.abspath(t))
            if key not in by_path:
                print('ERROR: not a course blurb: %s' % t)
                return 2
            selected.append((key, by_path[key]))
    else:
        selected = [(b, c) for b, c in found]

    changed = 0
    for blurb, chapter in selected:
        if not os.path.isfile(chapter):
            print('ERROR: %s has no chapter at %s' % (rel(blurb), rel(chapter)))
            return 2
        sha = blob_id(chapter)
        with open(blurb, encoding='utf-8') as fh:
            before = read_stamp(fh.read())
        write_stamp(blurb, sha)
        if before != sha:
            changed += 1
            print('stamped: %s  reviewed-at %s (%s)' % (rel(blurb), sha, rel(chapter)))

    print('course blurb stamps: %d blurb(s) selected, %d updated' % (len(selected), changed))
    return 0


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--check', action='store_true',
                   help='fail if any blurb is unstamped, stale, or has no chapter')
    g.add_argument('--update', nargs='*', metavar='BLURB',
                   help='(re)stamp the named blurbs, or every blurb when none are named')
    args = ap.parse_args()
    return check() if args.check else update(args.update)


if __name__ == '__main__':
    sys.exit(main())
