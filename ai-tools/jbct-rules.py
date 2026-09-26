#!/usr/bin/env python3
"""jbct-rules.py — extract the JBCT lint rule list from Pragmatica source at a release tag.

The site's rules page (/java/jbct/rules/) renders website/data/jbct-rules.json. That file is
build output of THIS script, committed because the tag it reads is immutable: CI needs no
network and no Pragmatica checkout, and a regenerate at the same tag must be byte-identical.

Three sources, each the authority for one field, and every one must list the SAME rule IDs:

  RULE_ID constants in jbct-lint's rule classes    -> id, and the class's summary line
  LintConfig.DEFAULT (jbct-core)                   -> defaultSeverity
  RuleCategoryMapping.MAPPING (jbct-core)          -> category (STYLE is advisory)

plus two facts that decide whether a listed rule runs at all: its class must be instantiated in
CstLinter.defaultRules() (a RULE_ID in an unregistered class is not a rule), and the Set.of(...)
that follows LintConfig.DEFAULT's severity map names the rules that are DEFAULT-DISABLED
(`enabledByDefault: false` — they run only when jbct.toml enables them).

A rule present in one and missing from another fails extraction. So does a rule class whose
header carries no `/// JBCT-XXX-NN...` summary line. Two header forms exist at rc3 —
`/// JBCT-RET-03: Never return null.` and `/// JBCT-TOT-01 (R-A): ...` — and a parser keyed
on the first alone reports the second as missing (it did, once, while this was scoped).

TEMPORARY BY DESIGN. It parses comment conventions, not a contract. pragmatica #1539 asks for
`jbct lint --list-rules --format json`; once a release ships it, the site reads that output
and this script is deleted.

  --pragmatica PATH   a pragmatica clone that has the tag (read via git; the working tree is
                      never looked at, so a checkout on another branch is harmless)
  --tag TAG           e.g. v1.0.0-rc3
  --check             exit non-zero if website/data/jbct-rules.json differs (writes nothing)
"""

import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'website', 'data', 'jbct-rules.json')

RULES_DIR = 'jbct/jbct-lint/src/main/java/org/pragmatica/jbct/lint/cst/rules/'
LINT_CONFIG = 'jbct/jbct-core/src/main/java/org/pragmatica/jbct/lint/LintConfig.java'
CATEGORIES = 'jbct/jbct-core/src/main/java/org/pragmatica/jbct/score/RuleCategoryMapping.java'
SCORE_CATEGORY = 'jbct/jbct-core/src/main/java/org/pragmatica/jbct/score/ScoreCategory.java'
LINTER = 'jbct/jbct-lint/src/main/java/org/pragmatica/jbct/lint/cst/CstLinter.java'

RULE_ID = re.compile(r'RULE_ID\s*=\s*"(JBCT-[A-Z0-9]+-[0-9]+)"')
SEVERITY = re.compile(r'Map\.entry\("(JBCT-[A-Z0-9]+-[0-9]+)",\s*DiagnosticSeverity\.([A-Z]+)\)')
CATEGORY = re.compile(r'Map\.entry\("(JBCT-[A-Z0-9]+-[0-9]+)",\s*ScoreCategory\.([A-Z_]+)\)')
ADVISORY = re.compile(r'^\s*([A-Z_]+)\((true|false)\)', re.M)
REGISTERED = re.compile(r'new (Cst[A-Za-z0-9]+)\(')
DISABLED = re.compile(r'DEFAULT\s*=\s*lintConfig\(.*?\)\),\s*(?://[^\n]*\s*)*Set\.of\(([^)]*)\)', re.S)


def git(repo, *args):
    return subprocess.run(['git', '-C', repo, *args], check=True,
                          capture_output=True, text=True).stdout


def header_summary(source, rule_id, path):
    # The paragraph opened by `/// <ID>:` or `/// <ID> (<ref>):`, cut at its first sentence.
    lines = source.splitlines()
    opener = re.compile(r'^///\s*' + re.escape(rule_id) + r'(?:\s*\([^)]*\))?\s*:\s*(.*)$')
    for i, line in enumerate(lines):
        m = opener.match(line)
        if not m:
            continue
        para = [m.group(1).strip()]
        for nxt in lines[i + 1:]:
            if not nxt.startswith('///') or not nxt[3:].strip():
                break
            para.append(nxt[3:].strip())
        text = ' '.join(para)
        sentence = re.match(r'(.+?\.)(?:\s|$)', text)
        return (sentence.group(1) if sentence else text).strip()
    sys.exit('FAIL: %s declares %s but carries no `/// %s...:` summary line' % (path, rule_id, rule_id))


def extract(repo, tag):
    commit = git(repo, 'rev-list', '-n', '1', tag).strip()
    files = [f for f in git(repo, 'ls-tree', '--name-only', tag, RULES_DIR).split() if f.endswith('.java')]

    summaries = {}
    for path in files:
        source = git(repo, 'show', '%s:%s' % (tag, path))
        for rule_id in RULE_ID.findall(source):
            if rule_id in summaries:
                sys.exit('FAIL: %s is declared twice (%s)' % (rule_id, path))
            summaries[rule_id] = (header_summary(source, rule_id, path), os.path.basename(path))

    lint_config = git(repo, 'show', '%s:%s' % (tag, LINT_CONFIG))
    severities = dict(SEVERITY.findall(lint_config))
    disabled_m = DISABLED.search(lint_config)
    if not disabled_m:
        sys.exit('FAIL: cannot find the default-disabled Set.of(...) after LintConfig.DEFAULT')
    disabled = set(re.findall(r'"(JBCT-[A-Z0-9]+-[0-9]+)"', disabled_m.group(1)))
    linter = git(repo, 'show', '%s:%s' % (tag, LINTER))
    body = linter[linter.index('List<CstLintRule> defaultRules()'):]
    registered = set(REGISTERED.findall(body[:body.index('\n    }')]))
    categories = dict(CATEGORY.findall(git(repo, 'show', '%s:%s' % (tag, CATEGORIES))))
    advisory = {name: flag == 'true'
                for name, flag in ADVISORY.findall(git(repo, 'show', '%s:%s' % (tag, SCORE_CATEGORY)))}

    sets = {'rule classes': set(summaries), 'LintConfig.DEFAULT': set(severities),
            'RuleCategoryMapping': set(categories)}
    union = set().union(*sets.values())
    gaps = ['%s missing from %s' % (r, name) for name, s in sets.items() for r in sorted(union - s)]
    if gaps:
        sys.exit('FAIL: the three rule sources disagree:\n  ' + '\n  '.join(gaps))
    unregistered = sorted('%s (%s)' % (r, src) for r, (_, src) in summaries.items()
                          if src[:-len('.java')] not in registered)
    if unregistered:
        sys.exit('FAIL: rule classes absent from CstLinter.defaultRules(): ' + ', '.join(unregistered))
    if disabled - union:
        sys.exit('FAIL: default-disabled IDs that are not rules: ' + ', '.join(sorted(disabled - union)))
    unknown = sorted(c for c in set(categories.values()) if c not in advisory)
    if unknown:
        sys.exit('FAIL: categories absent from ScoreCategory: %s' % ', '.join(unknown))

    rules = [{'id': r,
              'summary': summaries[r][0],
              'defaultSeverity': severities[r],
              'category': categories[r],
              'advisory': advisory[categories[r]],
              'enabledByDefault': r not in disabled,
              'source': summaries[r][1]}
             for r in sorted(union, key=rule_sort_key)]
    return {'_': 'GENERATED by ai-tools/jbct-rules.py from Pragmatica source at the tag below. '
                 'Do not edit; regenerate. Read the script header for what each field is taken from.',
            'tag': tag, 'commit': commit, 'count': len(rules), 'rules': rules}


def rule_sort_key(rule_id):
    _, family, number = rule_id.split('-')
    return family, int(number)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pragmatica', required=True)
    ap.add_argument('--tag', required=True)
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    rendered = json.dumps(extract(args.pragmatica, args.tag), indent=2, ensure_ascii=False) + '\n'
    if args.check:
        current = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if current != rendered:
            sys.exit('FAIL: %s is stale against %s; rerun without --check' % (OUT, args.tag))
        print('jbct-rules: %s matches %s' % (os.path.relpath(OUT), args.tag))
        return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(rendered)
    print('jbct-rules: wrote %d rules from %s' % (json.loads(rendered)['count'], args.tag))


if __name__ == '__main__':
    main()
