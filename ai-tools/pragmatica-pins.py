#!/usr/bin/env python3
"""pragmatica-pins.py — one derived declaration of the pinned Pragmatica version, and a
check that every surface in this repository agrees with it (issue #60).

WHAT THE CHECK IT REPLACES COULD NOT DO. check-drift.sh compared a hard-coded constant
against `grep -rn -E '1\\.0\\.0-rc[0-9]+' skills agents ../book/*.md | grep -v -F "$V"`.
That is blind four ways, and each is a direction in which it reports green over a wholly
stale repository:

  (a) the constant was compared against nothing external, so the declaration and every
      surface could be stale together and the check stayed green;
  (b) the space was three paths, so website/, README.md, ai-tools/README.md,
      training/pom.xml, examples/, proposals/ and articles/ were never looked at;
  (c) the pattern matched only `1.0.0-rcN`, so at `1.0.0` GA or `1.0.1` it matched
      nothing at all and reported green over every stale pin in the repository;
  (d) `grep -v` filters by LINE, so a line carrying both the pinned version and a stale
      one was dropped on the pinned match and its stale occurrence never reported.

Each is closed below, and each has a positive control recorded in the pull request: a
check that has never been shown to fail in a given direction is not evidence about that
direction.

THE SPACE. Every file `git ls-files` reports, minus EXCLUDE_GLOBS (dated records whose job
is to name old versions: changelogs, handovers, `*-meta/` working notes), minus the two
self-exclusions below, minus symlinks (three point back into ai-tools/ and would
double-count), minus anything that does not decode as UTF-8. All five counts print on
every run, so the space is checkable by a reader rather than asserted here.

SELF-EXCLUSION, AND WHY IT IS TWO EXACT PATHS AND NEVER A DIRECTORY. This script and
pragmatica-version.json quote version literals in prose ABOUT pins — "Central published
rc3", "the plugin is at 0.4.6", the four blindnesses above — and the scan reads them back
as pins. The instrument sees itself. Both files are therefore matched by STRING EQUALITY,
never a glob, and their names print on the space line. Excluding `ai-tools/` would be the
easy fix and the wrong one: `ai-tools/skills/` and `ai-tools/agents/` carry real pins and
are exactly what defect (b) was about, and a broadened exclusion would still exit 0, so
nothing would report the loss.

This bug shipped once. The check was verified green while both files were still
UNTRACKED, so `git ls-files` could not see them; committing them enlarged the space and
turned the same tree red. A check whose space is defined by tracked files must be re-run
AFTER the commit that adds it.

ATTRIBUTION. A version literal is a Pragmatica pin only when something on the page says
so. Three rules, deliberately different in strength:

  strong  a line containing `org.pragmatica-lite`, a `pragmatica*.version` property, the
          shell constant or a `release-<version>` ref attributes every literal on it;
  block   a bare `<version>X</version>` is attributed when `org.pragmatica-lite` appears
          within MAVEN_WINDOW lines above it, which is how every snippet here is shaped;
  prose   a weak anchor (`Pragmatica Core`, `pragmatica core`, `core`) attributes only a
          literal that IMMEDIATELY follows it, across at most PROSE_WINDOW lines.

The prose rule is deliberately not same-line: `book/introduction.md:3` reads
`**Based on:** JBCT v5.0.0 | **Pragmatica Core:** 1.0.0-rc1`, and a same-line anchor would
attribute the BOOK's 5.0.0 to Pragmatica. Coordinates under `org.example:` are the sample
group used by the articles and the Aether book and are never attributed.

ARTIFACTS DO NOT SHARE A VERSION, which the issue does not consider and the widened space
found: `org.pragmatica-lite:jbct-maven-plugin` is at 0.4.6 in MAVEN-PLUGIN.md and
README.md while core is at 1.0.0-rc1. Attribution therefore carries the artifact id, and
only `governed_artifacts` from the declaration are compared against the pin. Anything else
in the group needs its own inventory entry, so a second pin cannot hide inside the first
one's check.

ACCOUNTING. Every occurrence ends in exactly one bucket and every bucket is counted, so
"all accounted for" is computed here rather than asserted:

  agrees      attributed to a governed artifact and equal to the pin, or an org.example
              sample coordinate;
  finding     attributed, not equal to the pin, not excepted — FAILS;
  needs-class an UNATTRIBUTED literal that is nonetheless a version Pragmatica has really
              published (`known_versions`) — FAILS. This is the net under the attribution
              rules, and it earned its place immediately: it caught
              `examples/pom.xml:15  <pragmatica.version>0.9.0</pragmatica.version>`, a
              real stale pin that names the group in a property spelled differently from
              every other one and that no rule here recognises.
  out-of-scope an unattributed literal that Pragmatica has never published — a book
              version, a POM model version, a URL fragment. Counted, never listed unless
              --list, never failing. Bounding this bucket by `known_versions` instead of
              demanding an entry for all 111 of them is the difference between an
              inventory a human maintains and one they route around.
  excepted    carries an inventory entry, printed with its class, justification and date.

WHY AN INVENTORY EXISTS AT ALL. Widening the space surfaces disagreements this repository
already has, and which value is correct is an editorial claim belonging to the owner. The
inventory lets the mechanism ship while every disagreement stays NAMED. Its classes are
the classification issue #60 asks for:

  mechanical-deferred  a real pin whose value awaits the owner's ruling (class i);
  editorial            a claim a human must re-assert, not a value to sed (class ii);
  historical           "when this capability appeared" — MUST NOT MOVE (class iii);
  not-core             a different artifact in the group, with its own release line;
  not-pragmatica       a literal that is not a Pragmatica version at all.

The script cannot infer class iii from class i: nothing in the text distinguishes "pinned
at rc1" from "arrived in rc1". So classification is declared, and the declaration is made
to decay LOUDLY rather than silently — every entry is anchored to a substring of the line
AND to the NUMBER of occurrences it covers, and an entry matching nothing, or a different
number than it claims, FAILS. An exception cannot rot green, and clearing one is how the
owner's ruling gets applied.

HOW A DEFERRAL IS KEPT FROM BECOMING A HISTORICAL ENTRY. The two classes need opposite
lifetimes: `historical` must survive every future bump, because "arrived in rc1" stays
true forever, while `mechanical-deferred` exists only until the owner rules. So each
deferral records `deferred_at_pin`, and the moment `pinned` differs from it the check
FAILS and names the file. A deferral therefore cannot outlive the decision it is waiting
for, and a bump PR is told exactly which files it still owes an edit — which is the
difference between an inventory and a list of suppressions.

WHAT A GREEN RESULT DOES NOT MEAN. Not that the repository is current with Pragmatica:
only that every surface agrees with the declared pin and every disagreement is excepted in
writing. The exception count prints on the summary line for exactly that reason. Nor does
it mean anything at all about upstream, which --check no longer looks at.

WHY THE UPSTREAM AXIS LEFT --check, AND WHERE IT WENT. Every other axis here is hermetic: it
asks whether this repository's own surfaces agree with this repository's own declaration,
and it is decidable from the checkout. The declaration-versus-upstream axis is the one that
reaches the network, and a network axis inside a BLOCKING pull-request check has only two
available behaviours when Central is unreachable, both bad. Failing turns an outage at
repo1.maven.org into a merge block on work that has nothing to do with pins. Not failing —
what this printed before — is a gate reporting SUCCESS while examining NOTHING, and it said
so in the words "axis NOT checked" on a line inside an otherwise-green run, which is exactly
where such a line goes unread.

So the axis MOVED; it did not disappear. It runs under --upstream from
.github/workflows/upstream-pin.yml on a daily schedule, and THERE an unreachable or
malformed probe FAILS the job rather than skipping: a scheduled job blocks no pull request,
so strictness costs a notification instead of a merge, and that asymmetry is the whole
argument for the move.

The pointer is VERIFIED, NOT ASSERTED. --check reads that workflow file on every run and
FAILS if it has gone missing or has stopped invoking --upstream, because a comment naming
where an axis went is precisely the kind of claim that rots green while the axis it names
has been deleted.

  --check      classify the whole space; exit 1 on findings (default). Hermetic: no network
  --list       print every occurrence with its bucket, out-of-scope ones included
  --pinned     print the declared version and exit, for shell and build consumption
  --upstream   ONLY the declaration-vs-upstream axis, strict: unreachable or malformed is a
               FAILURE here, never a skip. This is what the scheduled workflow runs
"""

import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DECLARATION = os.path.join(HERE, 'pragmatica-version.json')

# How far above a bare <version> tag the owning <groupId> may sit. Every dependency
# snippet here puts it exactly two lines up; six leaves room for a reordered or commented
# block without reaching into a neighbouring one.
MAVEN_WINDOW = 6

# How many lines a prose anchor may be separated from the literal it attributes. Two,
# because ai-tools/agents/jbct-coder.md:304 ends a line with "(core" and starts the next
# with "1.0.0-rc1+)".
PROSE_WINDOW = 2

# A version literal: three dotted numbers with an optional qualifier, optional leading v.
# The qualifier may not end in a dot, or "Core 1.0.0-rc1." captures the sentence period.
# Deliberately NOT restricted to -rc, which is defect (c): at 1.0.0 GA or 1.0.1 the old
# pattern matched nothing and reported green over every stale pin in the repository.
VERSION_RE = re.compile(
    r'(?<![\d.])v?(\d+\.\d+\.\d+(?:-[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*)?)(?![\w-])')

GROUP = r'org\.pragmatica-lite(?:\.[A-Za-z0-9_-]+)*'

# A full coordinate names its artifact, which is how a second release line is kept out of
# core's check.
COORD_RE = re.compile(GROUP + r':([A-Za-z0-9_*.-]+):')

STRONG_RE = re.compile(
    GROUP + r'|pragmatica[\w.-]*\.version|PRAGMATICA_VERSION'
    r'|release-\d+\.\d+\.\d+|pragmaticalabs/pragmatica')

PROSE_RE = re.compile(r'(?:pragmatica(?:[\s-]+core)?|core)[\s:,*`()\[\]v_-]*$', re.I)

ARTIFACT_TAG_RE = re.compile(r'<artifactId>([^<]+)</artifactId>')

# The sample group used by the articles and the Aether book for example coordinates.
SAMPLE_RE = re.compile(r'org\.example:')

CLASSES = ('mechanical-deferred', 'editorial', 'historical', 'not-core', 'not-pragmatica')

# Where the upstream axis went, and the flag it must still be invoked with. Read on every
# --check run rather than trusted; see the docstring.
UPSTREAM_WORKFLOW = os.path.join('.github', 'workflows', 'upstream-pin.yml')
UPSTREAM_FLAG = '--upstream'


def load_declaration():
    with open(DECLARATION, encoding='utf-8') as fh:
        return json.load(fh)


def tracked_files(decl):
    """The space: tracked, non-self, non-symlink, not excluded, UTF-8 decodable. Returns
    the files plus the four skip counts, so a run prints what it did not look at."""
    out = subprocess.run(['git', '-C', ROOT, 'ls-files', '-z'],
                         capture_output=True, check=True).stdout
    names = [n for n in out.decode('utf-8').split('\0') if n]
    globs = decl['space']['exclude_globs']
    # Exact paths, never globs, and never a directory. This file and its inventory quote
    # version literals in prose ABOUT pins — "Central published rc3", "the plugin is at
    # 0.4.6" — which the scan otherwise reads back as pins, and the instrument sees
    # itself. Excluding `ai-tools/` instead would silence skills/ and agents/, which
    # carry REAL pins and are exactly what defect (b) was about; that would still exit 0,
    # so nothing would report the loss. Membership is string equality for that reason,
    # and the names are printed on the space line so over-exclusion is visible.
    selves = set(decl['space']['self_exclude'])
    kept, skipped_glob, skipped_self, skipped_link, skipped_binary = [], 0, 0, 0, 0
    for name in names:
        if name in selves:
            skipped_self += 1
            continue
        if any(fnmatch.fnmatch(name, g) for g in globs):
            skipped_glob += 1
            continue
        full = os.path.join(ROOT, name)
        if os.path.islink(full):
            skipped_link += 1
            continue
        try:
            with open(full, encoding='utf-8') as fh:
                kept.append((name, fh.read().splitlines()))
        except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError):
            skipped_binary += 1
    return kept, len(names), skipped_glob, skipped_self, skipped_link, skipped_binary


def attribute(lines, idx, match):
    """(rule, artifact) for this literal, or (None, None). Strongest rule wins, so the
    reason printed is the strongest available one."""
    line = lines[idx]
    if SAMPLE_RE.search(line[:match.start()]):
        return None, None                             # org.example: sample coordinate
    coord = COORD_RE.search(line)
    if coord:
        return 'strong', coord.group(1)
    if STRONG_RE.search(line):
        return 'strong', 'core'
    if '<version>' in line:
        above = lines[max(0, idx - MAVEN_WINDOW):idx]
        if any(re.search(GROUP, a) for a in above):
            artifact = 'core'
            for a in reversed(above):
                tag = ARTIFACT_TAG_RE.search(a)
                if tag:
                    artifact = tag.group(1)
                    break
            return 'block', artifact
    window = lines[max(0, idx - PROSE_WINDOW + 1):idx] + [line[:match.start()]]
    if PROSE_RE.search(' '.join(window)[-80:]):
        return 'prose', 'core'
    return None, None


def scan(decl):
    files, total, sk_glob, sk_self, sk_link, sk_bin = tracked_files(decl)
    occurrences = []
    for name, lines in files:
        for idx, line in enumerate(lines):
            for m in VERSION_RE.finditer(line):
                rule, artifact = attribute(lines, idx, m)
                occurrences.append({
                    'path': name, 'line': idx + 1, 'version': m.group(1),
                    'text': line.strip(), 'rule': rule, 'artifact': artifact,
                })
    return occurrences, {'files_tracked': total, 'files_scanned': len(files),
                         'skipped_excluded': sk_glob, 'skipped_self': sk_self,
                         'skipped_symlink': sk_link, 'skipped_undecodable': sk_bin}


def apply_inventory(occurrences, inventory):
    """Attach entries to occurrences; return per-entry hit counts so an entry matching
    nothing, or a different number than it claims, can be failed."""
    hits = [0] * len(inventory)
    for occ in occurrences:
        for i, entry in enumerate(inventory):
            if entry['path'] != occ['path'] or entry['match'] not in occ['text']:
                continue
            if entry.get('version') not in (None, occ['version']):
                continue
            occ['exception'] = entry
            hits[i] += 1
            break
    return hits


def probe_upstream(decl):
    """The external fact defect (a) needs. An unreachable probe is an instrument failure,
    not a finding: it returns None and says so, because a run that could not check the
    axis must not read like a run that checked it. What that costs is the CALLER's ruling,
    and there is now exactly one caller — upstream_axis(), running on a schedule where
    nothing is blocked, so it costs the job."""
    import urllib.request
    url = decl['upstream']['maven_metadata']
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            body = resp.read().decode('utf-8')
    except Exception as exc:                                   # noqa: BLE001
        return None, 'UNREACHABLE (%s): declaration-vs-upstream axis NOT checked' % exc
    m = re.search(r'<release>([^<]+)</release>', body)
    if not m:
        return None, 'MALFORMED (no <release> in %s): axis NOT checked' % url
    return m.group(1), 'read <release> from %s' % url


def upstream_axis(decl):
    """The declaration-vs-upstream axis, lifted out of --check unchanged in what it
    COMPARES and changed in exactly one thing: an instrument failure now fails the run.

    That inversion is the entire point of the move. The same strictness inside a PR check
    would block merges on somebody else's outage, so the axis was reduced to printing
    'NOT checked' and passing. Here it blocks nothing, so it can afford to be honest, and
    silence about upstream costs a red scheduled run instead of hiding inside a green PR.
    Note what did NOT change: a known_behind exception still passes, because it is anchored
    to one exact upstream value and stops matching the day Central moves."""
    pinned = decl['pinned']
    print('pragmatica pin check — upstream axis ONLY (hermetic axes run in check-drift.sh)')
    print('  declared: %s for %s'
          % (pinned, '/'.join(sorted(decl['governed_artifacts']))))
    upstream, note = probe_upstream(decl)
    if upstream is None:
        print('FAIL: %s' % note)
        print('  this job blocks no pull request, so an unreachable or malformed Central '
              'is a FAILURE here rather than a skip — that is why the axis was moved')
        print('upstream axis: FAILURE ABOVE')
        return 1
    if upstream == pinned:
        print('  upstream: %s — agrees with the declared pin (%s)' % (upstream, note))
        print('upstream axis: all green')
        return 0
    allowed = decl.get('upstream', {}).get('known_behind')
    if allowed and allowed.get('upstream') == upstream:
        print('  upstream: %s — DISAGREES with declared %s; excepted %s: %s'
              % (upstream, pinned, allowed['since'], allowed['why']))
        print('upstream axis: all green (disagreement excepted, not absent)')
        return 0
    print('FAIL: upstream Maven Central publishes %s, this repository declares %s'
          % (upstream, pinned))
    print('  issue #60 item 6 is one PR moving the pin and every quoted block '
          'together; clear upstream.known_behind when it lands')
    print('upstream axis: FAILURE ABOVE')
    return 1


def upstream_pointer():
    """(fail, line) for --check. Says out loud that this run did not look upstream, and
    where the axis that does lives — then proves that claim against the file, so the axis
    cannot be deleted while a line here goes on saying it runs somewhere."""
    full = os.path.join(ROOT, UPSTREAM_WORKFLOW)
    try:
        with open(full, encoding='utf-8') as fh:
            body = fh.read()
    except OSError as exc:                                     # noqa: BLE001
        return 1, ('FAIL: this run does not check upstream and %s, which is supposed to, '
                   'cannot be read (%s) — the axis has no home' % (UPSTREAM_WORKFLOW, exc))
    if UPSTREAM_FLAG not in body:
        return 1, ('FAIL: this run does not check upstream and %s no longer invokes %s — '
                   'the axis has been silently disarmed'
                   % (UPSTREAM_WORKFLOW, UPSTREAM_FLAG))
    return 0, ('  upstream: NOT part of this run, by construction — the '
               'declaration-vs-upstream axis runs %s from %s on a schedule, where an '
               'unreachable Central FAILS (verified: that file exists and invokes %s)'
               % (UPSTREAM_FLAG, UPSTREAM_WORKFLOW, UPSTREAM_FLAG))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--pinned', action='store_true')
    ap.add_argument('--upstream', action='store_true')
    args = ap.parse_args()

    decl = load_declaration()
    pinned = decl['pinned']
    if args.pinned:
        print(pinned)
        return 0
    if args.upstream:
        return upstream_axis(decl)

    inventory = decl['inventory']
    governed = set(decl['governed_artifacts'])
    known = set(decl['known_versions']['versions'])
    occurrences, space = scan(decl)
    hits = apply_inventory(occurrences, inventory)

    agrees, findings, needs_class, out_of_scope, excepted = [], [], [], [], []
    for occ in occurrences:
        if occ.get('exception'):
            excepted.append(occ)
        elif occ['rule'] and occ['artifact'] in governed:
            (agrees if occ['version'] == pinned else findings).append(occ)
        elif occ['rule']:
            findings.append(occ)          # group-mate artifact, needs its own entry
        elif SAMPLE_RE.search(occ['text']):
            agrees.append(occ)
        elif occ['version'] in known:
            needs_class.append(occ)
        else:
            out_of_scope.append(occ)

    fail = 0
    print('pragmatica pin check: declared %s for %s'
          % (pinned, '/'.join(sorted(governed))))
    print('  space: %d tracked, %d scanned, %d excluded by glob, %d self-excluded (%s), '
          '%d symlink, %d undecodable'
          % (space['files_tracked'], space['files_scanned'], space['skipped_excluded'],
             space['skipped_self'], ', '.join(sorted(decl['space']['self_exclude'])),
             space['skipped_symlink'], space['skipped_undecodable']))
    print('  occurrences: %d total — %d agree, %d excepted, %d findings, '
          '%d need classification, %d out of scope'
          % (len(occurrences), len(agrees), len(excepted), len(findings),
             len(needs_class), len(out_of_scope)))

    pointer_fail, pointer_line = upstream_pointer()
    print(pointer_line)
    fail = fail or pointer_fail

    if findings:
        print('FAIL: version pin disagrees with the declared %s (%d):'
              % (pinned, len(findings)))
        for o in findings:
            print('  %s:%d  %s  [%s, artifact %s]  %s'
                  % (o['path'], o['line'], o['version'], o['rule'], o['artifact'],
                     o['text'][:88]))
        fail = 1

    if needs_class:
        print('FAIL: unattributed literal that Pragmatica has really published (%d) — '
              'classify it in ai-tools/pragmatica-version.json:' % len(needs_class))
        for o in needs_class:
            print('  %s:%d  %s  %s' % (o['path'], o['line'], o['version'], o['text'][:88]))
        fail = 1

    stale = [(i, e) for i, e in enumerate(inventory) if hits[i] != e['count']]
    if stale:
        print('FAIL: inventory entry no longer describes the file — the text moved, so '
              're-anchor it or delete it (%d):' % len(stale))
        for i, e in stale:
            print('  %s  expected %d occurrence(s), matched %d  — %s'
                  % (e['path'], e['count'], hits[i], e['match'][:60]))
        fail = 1

    # A deferral is temporary by construction and a historical entry is permanent, and
    # nothing else in this file tells the two apart. Every mechanical-deferred entry
    # records the pin it was written against; the moment the pin moves, the deferral has
    # been overtaken by the owner's ruling and must be resolved rather than carried.
    overtaken = [e for e in inventory if e['class'] == 'mechanical-deferred'
                 and e.get('deferred_at_pin') != pinned]
    if overtaken:
        print('FAIL: the pin moved to %s, so these deferrals are overtaken — apply the '
              'ruling to each file and delete the entry (%d):' % (pinned, len(overtaken)))
        for e in overtaken:
            print('  %s  deferred at pin %s  — %s'
                  % (e['path'], e.get('deferred_at_pin'), e['match'][:60]))
        fail = 1

    by_class = {c: [e for e in inventory if e['class'] == c] for c in CLASSES}
    print('  inventory: %d entr%s active — %s'
          % (len(inventory), 'y' if len(inventory) == 1 else 'ies',
             ', '.join('%d %s' % (len(by_class[c]), c) for c in CLASSES)))
    for c in CLASSES:
        for e in by_class[c]:
            print('    [%s] %s:%s (%d occ) since %s — %s'
                  % (c, e['path'], e.get('version', '*'), e['count'], e['since'],
                     e['why']))

    if args.list:
        print('  --- every occurrence ---')
        buckets = [(excepted, 'excepted'), (findings, 'FINDING'),
                   (needs_class, 'NEEDS-CLASS'), (out_of_scope, 'out-of-scope'),
                   (agrees, 'agrees')]
        label = {}
        for group, name in buckets:
            for o in group:
                label[id(o)] = name if name != 'excepted' else \
                    'excepted:' + o['exception']['class']
        for o in sorted(occurrences, key=lambda x: (x['path'], x['line'])):
            print('    %-56s %-12s %-14s %s'
                  % ('%s:%d' % (o['path'], o['line']), o['version'],
                     o['rule'] or 'unattributed', label[id(o)]))

    print('pragmatica pin check: %s' % ('FINDINGS ABOVE' if fail else 'all green'))
    return fail


if __name__ == '__main__':
    sys.exit(main())
