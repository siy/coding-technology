#!/usr/bin/env python3
"""De-spine a PFD chapter for the full-book build.

The spine (bold full-sentences) is internal markup: it drives the condensed
edition via extract-spine.py, but the full book renders it as ordinary prose so
the deep read stays clean. This strips the ** from spine sentences while leaving
bold *labels* (list run-ins, short term emphasis) intact. Source files are never
modified; this runs on build-time copies. Prints the de-spined markdown to stdout.

The spine test is identical to extract-spine.py, so a sentence is stripped here
iff it is harvested there — the two stay in lockstep off one source.
"""
import re
import sys

BOLD = re.compile(r'\*\*(.+?)\*\*')


def clean(span: str) -> str:
    return ' '.join(span.replace('*', '').replace('`', '').split())


def is_spine(span: str, on_list_line: bool) -> bool:
    text = clean(span)
    if not text:
        return False
    words = len(text.split())
    if on_list_line:
        return words >= 5
    if text[-1] in '.?!':
        return True
    return words >= 5


def despine(content: str) -> str:
    out = []
    in_fence = False
    for line in content.split('\n'):
        stripped = line.lstrip()
        if stripped.startswith('```') or stripped.startswith('~~~'):
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence or stripped.startswith('|') or stripped.startswith('#'):
            out.append(line)
            continue
        on_list = bool(re.match(r'[-*+]\s', stripped) or re.match(r'\d+[.)]\s', stripped))

        def repl(m):
            inner = m.group(1)
            return inner if is_spine(inner, on_list) else m.group(0)

        out.append(BOLD.sub(repl, line))
    return '\n'.join(out)


if __name__ == '__main__':
    with open(sys.argv[1], encoding='utf-8') as fh:
        sys.stdout.write(despine(fh.read()))
