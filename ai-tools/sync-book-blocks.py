#!/usr/bin/env python3
"""sync-book-blocks.py — copy canonical blocks from the books into the AI tooling.

Skills duplicate enumerable rules the books own: naming vocabularies, ordering rules,
predicate catalogs. Hand-copying them is how they drift, and the drift is invisible
because both copies read fine on their own. Each block below names a book section by
its heading; this script extracts that section and writes it between markers in the
destination file, so the book stays the single source and the skill is a build output.

A renamed or deleted book heading fails extraction rather than silently producing a
stale copy — that failure is the point.

  --check   exit non-zero if any destination is out of date (CI mode; writes nothing)
  --write   update destinations in place
"""

import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# id -> where the canonical text lives, and which tooling file mirrors it.
# Destinations must contain matching <!-- book:<id> --> / <!-- /book:<id> --> markers.
BLOCKS = [
    {
        'id': 'import-ordering',
        'source': '../book/project-structure.md',
        'heading': '### Import Ordering',
        'dest': 'skills/jbct/project-structure/organization.md',
    },
    {
        'id': 'member-ordering',
        'source': '../book/project-structure.md',
        'heading': '### Member Ordering by File Type',
        'dest': 'skills/jbct/project-structure/organization.md',
    },
    {
        'id': 'zone-verbs',
        'source': '../book/basic-patterns.md',
        'heading': '### Zone-Based Naming Vocabulary',
        'dest': 'skills/jbct/SKILL.md',
    },
    {
        'id': 'predicate-naming',
        'source': '../book/basic-patterns.md',
        'heading': '### Predicate Naming',
        'dest': 'skills/jbct/SKILL.md',
    },
    {
        'id': 'test-naming',
        'source': '../book/basic-patterns.md',
        'heading': '### Test Naming',
        'dest': 'skills/jbct/testing/patterns.md',
    },
]


def extract(source_path, heading):
    """Return the body of `heading` — everything up to the next heading of the same
    or higher level, minus trailing rules and blank lines."""
    with open(source_path, encoding='utf-8') as fh:
        lines = fh.read().split('\n')

    level = len(heading) - len(heading.lstrip('#'))
    start = None
    for i, line in enumerate(lines):
        if line.strip() == heading:
            start = i + 1
            break
    if start is None:
        raise LookupError('heading %r not found in %s' % (heading, source_path))

    body, in_code = [], False
    for line in lines[start:]:
        if line.lstrip().startswith('```'):
            in_code = not in_code
        elif not in_code and line.startswith('#'):
            if len(line) - len(line.lstrip('#')) <= level:
                break
        body.append(line)

    while body and (not body[-1].strip() or body[-1].strip() == '---'):
        body.pop()
    while body and not body[0].strip():
        body.pop(0)
    return '\n'.join(body)


def apply_block(dest_path, block_id, body, write):
    """Replace the marked region in dest with body. Returns True if it was current."""
    open_m = '<!-- book:%s -->' % block_id
    close_m = '<!-- /book:%s -->' % block_id
    with open(dest_path, encoding='utf-8') as fh:
        text = fh.read()

    if open_m not in text or close_m not in text:
        raise LookupError('markers for %r missing in %s — add:\n%s\n%s'
                          % (block_id, dest_path, open_m, close_m))

    pattern = re.compile(re.escape(open_m) + r'.*?' + re.escape(close_m), re.DOTALL)
    replacement = '%s\n%s\n%s' % (open_m, body, close_m)
    updated = pattern.sub(lambda _: replacement, text, count=1)

    if updated == text:
        return True
    if write:
        with open(dest_path, 'w', encoding='utf-8') as fh:
            fh.write(updated)
    return False


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--check', action='store_true', help='fail if any block is stale')
    g.add_argument('--write', action='store_true', help='update destinations in place')
    args = ap.parse_args()

    stale, errors = [], []
    for block in BLOCKS:
        source = os.path.join(HERE, block['source'])
        dest = os.path.join(HERE, block['dest'])
        try:
            body = extract(source, block['heading'])
            if not body.strip():
                raise LookupError('section %r in %s is empty'
                                  % (block['heading'], block['source']))
            current = apply_block(dest, block['id'], body, args.write)
        except (LookupError, OSError) as exc:
            errors.append('%s: %s' % (block['id'], exc))
            continue
        if not current:
            stale.append('%s -> %s' % (block['id'], block['dest']))

    for err in errors:
        print('ERROR: %s' % err)
    if stale:
        verb = 'updated' if args.write else 'STALE (run --write)'
        for item in stale:
            print('%s: %s' % (verb, item))

    if errors:
        return 2
    if stale and args.check:
        return 1
    if not stale and not errors:
        print('book blocks: all in sync')
    return 0


if __name__ == '__main__':
    sys.exit(main())
