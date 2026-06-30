#!/usr/bin/env python3
"""Extract the spine layer (bold full-sentence spans) from PFD chapter markdown.

The two-layer convention: **bold** marks load-bearing spine sentences; short
**bold** labels (list markers like **Trigger**, **Leaf**, **BER**) and inline
*italic* term introductions are not spine. A bold span is spine when it reads as
a sentence: it ends with terminal punctuation, or it runs to >= 5 words.

Fenced code blocks, tables, and headings are skipped so code and column labels
never leak into the spine.

Usage: extract-spine.py chapter1.md [chapter2.md ...]
Prints the spine sentences in document order, one per line.
"""
import re
import sys

BOLD = re.compile(r'\*\*(.+?)\*\*')


def clean(span: str) -> str:
    # drop inner emphasis/code markers, collapse whitespace
    return ' '.join(span.replace('*', '').replace('`', '').split())


def is_spine(span: str, on_list_line: bool = False) -> bool:
    text = clean(span)
    if not text:
        return False
    words = len(text.split())
    # On a list line the bold run-in is usually an enumeration label; require a
    # full sentence (>= 5 words) so real claims (e.g. the numbered predictions)
    # stay while short labels ("Latency.", "Validation fails.") drop out.
    if on_list_line:
        return words >= 5
    if text[-1] in '.?!':
        return True
    return words >= 5


def spine_sentences(content: str):
    in_fence = False
    for line in content.splitlines():
        stripped = line.lstrip()
        if stripped.startswith('```') or stripped.startswith('~~~'):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if stripped.startswith('|') or stripped.startswith('#'):
            continue
        on_list = bool(re.match(r'[-*+]\s', stripped) or re.match(r'\d+[.)]\s', stripped))
        for match in BOLD.finditer(line):
            if is_spine(match.group(1), on_list):
                yield clean(match.group(1))


def main(paths):
    for path in paths:
        with open(path, encoding='utf-8') as fh:
            for sentence in spine_sentences(fh.read()):
                print(sentence)


if __name__ == '__main__':
    main(sys.argv[1:])
