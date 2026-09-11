#!/usr/bin/env python3
"""pragmatica-pins.py — the derived declaration of this repository's Pragmatica versions,
and a check that every surface agrees with it (issue #60).

TWO FIELDS, NOT ONE, by the owner's ruling of 2026-09-11. The single `pinned` value this
replaces was answering two questions at once, which is why it could never move:

  depends_on        the version a reader's build should use. A dependency coordinate and
                    nothing more. It tracks Maven Central mechanically — a coordinate is
                    right when it resolves and names what Central last published — so no
                    human judgement is needed to advance it.
  verified_against  the version at which a human actually re-read the API surfaces a
                    document describes. It moves only when a person does that work.

Bumping the old single field re-asserted every verification nobody had performed; holding
it still left every dependency snippet stale. Split apart, each axis moves on its own
evidence: Central for the first, a person for the second.

verified_against IS NOT ONE VALUE, and that was determined from the repository rather than
assumed. Two coexist today — book/introduction.md:3 says 1.0.0-rc1 while
book-aether/appendix-a-api-reference.md:4 says 1.0.0-rc3 — and they are not a
disagreement: the Aether appendix's own text disclaims covering Pragmatica Core at all
('the core types … are the JBCT book's territory'), so the two stamps speak about
DIFFERENT API surfaces read at different times. Per-book undercounts as well, because the
installed skill and agents carry their own 'with Pragmatica Core <version>' claims beside
their own last-modified dates and are not books. So the field is PER SCOPE, where a scope
is a documentation surface someone re-reads as a unit; the scopes, their evidence and the
one judgement call among them are recorded in pragmatica-version.json.

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
README.md while core is at 1.0.0-rc3. Attribution therefore carries the artifact id, and
only `depends_on.artifacts` from the declaration are compared against depends_on. Anything
else in the group needs its own inventory entry, so a second pin cannot hide inside the
first one's check.

FIELD ASSIGNMENT — WHICH OF THE TWO FIELDS AN OCCURRENCE ANSWERS TO. Attribution says a
literal IS a Pragmatica version; assignment says which question it answers. Two mechanical
rules cover the unambiguous forms:

  coordinate   a <version> reached by the block rule, a literal that is the version
               segment of a full `org.pragmatica-lite:<artifact>:<version>`, or the value
               of a `<pragmatica*.version>` property  ->  depends_on
  provenance   a literal written as `release-<version>`, or one on a `**Based on:**`
               header line                             ->  verified_against

Everything else is DECLARED in `field_assignment`, for the same reason the inventory's
classes are declared: nothing in the text distinguishes "the build uses rc1" from
"somebody read rc1". An attributed, non-excepted occurrence that neither rule nor
declaration reaches FAILS as UNASSIGNED. It is never defaulted either way, and the
asymmetry is why — defaulting a coordinate into verified_against leaves a stale snippet,
while defaulting a verification stamp into depends_on gets it sed'd forward at the next
bump and FABRICATES A VERIFICATION NOBODY PERFORMED. A silent default in the second
direction is the exact failure this split exists to prevent, so there is no default.

Assignment is PER OCCURRENCE, never per file, and ai-tools/agents/jbct-reviewer.md is why:
line 11 states what the agent was written against (verified_against) and line 185 states
the dependency to declare (depends_on). One file, both fields, two different values the
moment the coordinate moves.

A verified_against occurrence is then resolved to exactly one scope by the scopes' path
globs. Zero scopes or more than one is a FAILURE, not a default: a document asserting a
verification that no declared scope owns is a claim with nobody behind it.

ACCOUNTING. Every occurrence ends in exactly one bucket and every bucket is counted, so
"all accounted for" is computed here rather than asserted:

  agrees      assigned to a field and equal to that field's value — depends_on for a
              coordinate, the owning scope's version for a verification — or an
              org.example sample coordinate;
  finding     assigned and NOT equal, or assigned to depends_on under an ungoverned
              artifact, or a verification no scope owns — FAILS;
  unassigned  attributed, not excepted, and reached by no assignment rule or declaration —
              FAILS, because there is no safe default. See FIELD ASSIGNMENT above.
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
              These are the occurrences NEITHER field governs, and the entry says why.

WHY AN INVENTORY EXISTS AT ALL. Widening the space surfaces disagreements this repository
already has, and which value is correct is an editorial claim belonging to the owner. The
inventory lets the mechanism ship while every disagreement stays NAMED. Its classes are
the classification issue #60 asks for:

  historical           "when this capability appeared" — MUST NOT MOVE (class iii);
  dated-publication    a version literal inside a PUBLISHED article. The convener ruled on
                       #60 (2026-09-05) that "docs make a standing claim, where green
                       today is the point; an article makes a dated claim, and gating one
                       forever means either freezing the product or rewriting history".
                       Distinct from `historical`, which is a claim ABOUT a release;
  not-core             a different artifact in the group, with its own release line;
  not-pragmatica       a literal that is not a Pragmatica version at all.

`mechanical-deferred` and `editorial` are RETIRED, and their retirement is the ruling
landing rather than a simplification. Both existed because one field could not carry two
answers: a coordinate whose value awaited a decision, and a claim a human had to re-assert
rather than sed. Splitting the declaration gives each of them a real home — the first is
depends_on, the second is verified_against — so an entry in either class is now a bug
rather than a deferral, and the classes are gone so one cannot be written by habit.

The script cannot infer class iii from a pin: nothing in the text distinguishes "pinned at
rc1" from "arrived in rc1". So classification is declared, and the declaration is made
to decay LOUDLY rather than silently — every entry is anchored to a substring of the line
AND to the NUMBER of occurrences it covers, and an entry matching nothing, or a different
number than it claims, FAILS. An exception cannot rot green, and clearing one is how the
owner's ruling gets applied.

WHAT A GREEN RESULT DOES NOT MEAN, AND THE TWO FIELDS FAIL DIFFERENTLY HERE. For
depends_on it means every coordinate equals the declared value; it does NOT mean that
value is current with Central, which is a separate axis this run does not touch. For
verified_against it means every document states its scope's declared version — and that
is ALL it means. It is not evidence that the re-read happened, that it was thorough, or
that the API did not change underneath it afterwards. Green on this axis says the
paperwork agrees with itself; only a person reading source can say more. The exception
count prints on the summary line for the same reason.

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
  --list       print every occurrence with its FIELD and bucket, out-of-scope ones included
  --pinned     print depends_on.version and exit, for shell and build consumption. The name
               is kept for callers; there is no value called "the pin" any more, and
               verified_against is deliberately NOT reachable this way — nothing should be
               able to sed a verification stamp from a shell pipeline
  --upstream   ONLY the depends_on-vs-upstream axis, strict: unreachable or malformed is a
               FAILURE here, never a skip. This is what the scheduled workflow runs. It has
               nothing to say about verified_against, and cannot: an upstream release does
               not re-read anything
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

# --- field-assignment forms. Each is matched against the text BEFORE the literal, so it
# --- speaks about that one occurrence and never about its neighbours on the same line.

# The literal is the version segment of a full coordinate: `org.pragmatica-lite:core:1.2.3`.
COORD_SEGMENT_RE = re.compile(GROUP + r':[A-Za-z0-9_*.-]+:$')

# The literal is the value of a `<pragmatica*.version>` property.
VERSION_PROPERTY_RE = re.compile(r'<pragmatica[\w.-]*\.version>$')

# The literal is a source ref — `release-1.0.0-rc3` — which names a tag somebody read AT,
# not an artifact anybody depends on.
RELEASE_REF_RE = re.compile(r'release-$')

# A chapter header stating what the text was written against. check-drift.sh greps the
# same form for the BOOK's version, which is why it is a safe marker: it already has a
# second reader.
BASED_ON_RE = re.compile(r'^\s*\*\*Based on:\*\*')

DEPENDS_ON, VERIFIED_AGAINST = 'depends_on', 'verified_against'

# `mechanical-deferred` and `editorial` are deliberately absent: the split gave both a real
# field, so writing one now is a bug rather than a deferral. An unknown class fails.
CLASSES = ('historical', 'dated-publication', 'not-core', 'not-pragmatica')

# The sample group used by the articles and the Aether book for example coordinates.
SAMPLE_RE = re.compile(r'org\.example:')

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
                    # The text preceding THIS literal, so a field rule speaks about one
                    # occurrence and not about its neighbours: website/content/aether.md:5
                    # carries four, of which two are coordinates and two are not.
                    'before': line[:m.start()], 'raw': line,
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


def mechanical_field(occ):
    """depends_on / verified_against / None, from the FORM of this one occurrence.

    None is not a default, it is a question handed to a human: see FIELD ASSIGNMENT in the
    docstring for why there is no safe fallback in either direction."""
    before = occ['before']
    if RELEASE_REF_RE.search(before):
        return VERIFIED_AGAINST                       # `release-1.0.0-rc3` — a source ref
    if BASED_ON_RE.search(occ['raw']):
        return VERIFIED_AGAINST                       # a chapter's "written against" header
    if COORD_SEGMENT_RE.search(before):
        return DEPENDS_ON                             # org.pragmatica-lite:core:<here>
    if VERSION_PROPERTY_RE.search(before):
        return DEPENDS_ON                             # <pragmatica.version><here>
    if occ['rule'] == 'block':
        return DEPENDS_ON                             # <version> under a pragmatica group
    return None


def apply_field_assignment(occurrences, assignments):
    """Declared field for the occurrences no form rule reaches. Consulted ONLY for those,
    so an entry's `count` measures what a human still had to decide — which is why adding a
    mechanical rule later shrinks these counts loudly instead of leaving dead entries."""
    hits = [0] * len(assignments)
    for occ in occurrences:
        if occ.get('exception') or not occ['rule'] or occ.get('field'):
            continue
        for i, entry in enumerate(assignments):
            if entry['path'] != occ['path'] or entry['match'] not in occ['text']:
                continue
            occ['field'] = entry['field']
            occ['field_source'] = 'declared'
            hits[i] += 1
            break
    return hits


def scope_for(occ, scopes):
    """The scopes whose path globs own this verified_against occurrence. Returned as a
    LIST rather than a scope-or-None, because zero and two are different failures and the
    caller has to be able to say which."""
    return [s for s in scopes
            if any(fnmatch.fnmatch(occ['path'], p) for p in s['paths'])]


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
    """The depends_on-vs-upstream axis, lifted out of --check unchanged in what it
    COMPARES and changed in exactly one thing: an instrument failure now fails the run.

    That inversion is the entire point of the move. The same strictness inside a PR check
    would block merges on somebody else's outage, so the axis was reduced to printing
    'NOT checked' and passing. Here it blocks nothing, so it can afford to be honest, and
    silence about upstream costs a red scheduled run instead of hiding inside a green PR.

    IT COMPARES CENTRAL AGAINST depends_on, AND AGAINST NOTHING ELSE. Under the single
    declaration this was "the pin", which is exactly why the pin could not move: a red here
    demanded an edit that would also have advanced every verification stamp. depends_on is
    the only field a repository probe can speak about — Central publishing a release is not
    a person re-reading an API, and verified_against is unreachable from here on purpose.
    A known_behind exception still passes if one is declared, because it is anchored to one
    exact upstream value and stops matching the day Central moves."""
    declared = decl['depends_on']['version']
    print('pragmatica pin check — upstream axis ONLY (hermetic axes run in check-drift.sh)')
    print('  declared depends_on: %s for %s'
          % (declared, '/'.join(sorted(decl['depends_on']['artifacts']))))
    print('  verified_against: NOT compared here and never can be — an upstream release '
          'does not re-read an API')
    upstream, note = probe_upstream(decl)
    if upstream is None:
        print('FAIL: %s' % note)
        print('  this job blocks no pull request, so an unreachable or malformed Central '
              'is a FAILURE here rather than a skip — that is why the axis was moved')
        print('upstream axis: FAILURE ABOVE')
        return 1
    if upstream == declared:
        print('  upstream: %s — agrees with declared depends_on (%s)' % (upstream, note))
        print('upstream axis: all green')
        return 0
    allowed = decl.get('upstream', {}).get('known_behind')
    if allowed and allowed.get('upstream') == upstream:
        print('  upstream: %s — DISAGREES with declared depends_on %s; excepted %s: %s'
              % (upstream, declared, allowed['since'], allowed['why']))
        print('upstream axis: all green (disagreement excepted, not absent)')
        return 0
    print('FAIL: upstream Maven Central publishes %s, this repository declares '
          'depends_on %s' % (upstream, declared))
    print('  moving depends_on is mechanical and needs no ruling: bump it, re-read '
          'known_versions, and leave every verified_against scope alone')
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
    depends_on = decl['depends_on']['version']
    if args.pinned:
        print(depends_on)
        return 0
    if args.upstream:
        return upstream_axis(decl)

    inventory = decl['inventory']
    assignments = decl['field_assignment']
    scopes = decl['verified_against']['scopes']
    governed = set(decl['depends_on']['artifacts'])
    known = set(decl['known_versions']['versions'])
    occurrences, space = scan(decl)
    hits = apply_inventory(occurrences, inventory)

    for occ in occurrences:
        if not occ.get('exception') and occ['rule']:
            field = mechanical_field(occ)
            if field:
                occ['field'] = field
                occ['field_source'] = 'form'
    assign_hits = apply_field_assignment(occurrences, assignments)

    agrees, findings, needs_class, out_of_scope, excepted, unassigned = \
        [], [], [], [], [], []
    for occ in occurrences:
        if occ.get('exception'):
            occ['bucket_field'] = 'n/a (excepted)'
            excepted.append(occ)
        elif not occ['rule']:
            occ['bucket_field'] = 'n/a (unattributed)'
            if SAMPLE_RE.search(occ['text']):
                agrees.append(occ)
            elif occ['version'] in known:
                needs_class.append(occ)
            else:
                out_of_scope.append(occ)
        elif not occ.get('field'):
            occ['bucket_field'] = 'UNASSIGNED'
            unassigned.append(occ)
        elif occ['field'] == DEPENDS_ON:
            occ['bucket_field'] = DEPENDS_ON
            if occ['artifact'] not in governed:
                occ['reason'] = ('artifact %r is not governed by depends_on — it releases '
                                 'on its own line and needs its own inventory entry'
                                 % occ['artifact'])
                findings.append(occ)
            elif occ['version'] == depends_on:
                agrees.append(occ)
            else:
                occ['reason'] = 'depends_on declares %s' % depends_on
                findings.append(occ)
        else:
            owners = scope_for(occ, scopes)
            occ['bucket_field'] = '%s:%s' % (
                VERIFIED_AGAINST, owners[0]['name'] if len(owners) == 1 else '?')
            if len(owners) != 1:
                occ['reason'] = ('%d verified_against scopes own this path — a verification '
                                 'claim must have exactly one owner, or nobody is behind it'
                                 % len(owners))
                findings.append(occ)
            elif occ['version'] == owners[0]['version']:
                agrees.append(occ)
            else:
                occ['reason'] = ('scope %r was verified at %s; moving this literal without '
                                 'a re-read fabricates a verification'
                                 % (owners[0]['name'], owners[0]['version']))
                findings.append(occ)

    fail = 0
    print('pragmatica pin check: depends_on %s for %s'
          % (depends_on, '/'.join(sorted(governed))))
    print('  verified_against: %s'
          % ', '.join('%s=%s' % (s['name'], s['version']) for s in scopes))
    print('  space: %d tracked, %d scanned, %d excluded by glob, %d self-excluded (%s), '
          '%d symlink, %d undecodable'
          % (space['files_tracked'], space['files_scanned'], space['skipped_excluded'],
             space['skipped_self'], ', '.join(sorted(decl['space']['self_exclude'])),
             space['skipped_symlink'], space['skipped_undecodable']))
    print('  occurrences: %d total — %d agree, %d excepted, %d findings, %d unassigned, '
          '%d need classification, %d out of scope'
          % (len(occurrences), len(agrees), len(excepted), len(findings), len(unassigned),
             len(needs_class), len(out_of_scope)))
    fields = [o for o in occurrences if o.get('field')]
    print('  fields: %d assigned — %d depends_on, %d verified_against '
          '(%d by form, %d declared); %d excepted, governed by NEITHER field'
          % (len(fields),
             sum(1 for o in fields if o['field'] == DEPENDS_ON),
             sum(1 for o in fields if o['field'] == VERIFIED_AGAINST),
             sum(1 for o in fields if o['field_source'] == 'form'),
             sum(1 for o in fields if o['field_source'] == 'declared'),
             len(excepted)))

    pointer_fail, pointer_line = upstream_pointer()
    print(pointer_line)
    fail = fail or pointer_fail

    # Two keys holding one value is the defect this split removes, one level down. The
    # alias exists only because website/build.js reads `pinned` and belongs to an open PR.
    if decl.get('pinned') != depends_on:
        print('FAIL: the `pinned` compatibility alias reads %r but depends_on.version is '
              '%r — website/build.js:55 renders the alias, so the site would publish a '
              'version this check never examined' % (decl.get('pinned'), depends_on))
        fail = 1

    if findings:
        print('FAIL: a surface disagrees with the field that governs it (%d):'
              % len(findings))
        for o in findings:
            print('  %s:%d  %s  [%s; %s, artifact %s]  %s'
                  % (o['path'], o['line'], o['version'], o['bucket_field'], o['rule'],
                     o['artifact'], o['text'][:72]))
            print('      %s' % o['reason'])
        fail = 1

    if unassigned:
        print('FAIL: attributed but assigned to NEITHER field (%d) — no rule reached it '
              'and no field_assignment entry claims it. Decide in '
              'ai-tools/pragmatica-version.json; it is never defaulted, because '
              'defaulting a verification stamp into depends_on fabricates a '
              'verification at the next bump:' % len(unassigned))
        for o in unassigned:
            print('  %s:%d  %s  [%s]  %s'
                  % (o['path'], o['line'], o['version'], o['rule'], o['text'][:88]))
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

    stale_fa = [(i, e) for i, e in enumerate(assignments) if assign_hits[i] != e['count']]
    if stale_fa:
        print('FAIL: field_assignment entry no longer describes the file (%d) — either '
              'the text moved, or a form rule now reaches the occurrence and the entry '
              'is dead:' % len(stale_fa))
        for i, e in stale_fa:
            print('  %s  expected %d occurrence(s), matched %d  [%s]  — %s'
                  % (e['path'], e['count'], assign_hits[i], e['field'], e['match'][:60]))
        fail = 1

    unknown = [e for e in inventory if e['class'] not in CLASSES]
    if unknown:
        print('FAIL: inventory entry carries a class this check does not know (%d) — '
              '`mechanical-deferred` and `editorial` were retired when the declaration '
              'split, because each now has a real field:' % len(unknown))
        for e in unknown:
            print('  %s  class %r  — %s' % (e['path'], e['class'], e['match'][:60]))
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
        print('  --- every occurrence: path:line, version, attribution rule, FIELD, '
              'bucket ---')
        buckets = [(excepted, 'excepted'), (findings, 'FINDING'),
                   (unassigned, 'UNASSIGNED'),
                   (needs_class, 'NEEDS-CLASS'), (out_of_scope, 'out-of-scope'),
                   (agrees, 'agrees')]
        label = {}
        for group, name in buckets:
            for o in group:
                label[id(o)] = name if name != 'excepted' else \
                    'excepted:' + o['exception']['class']
        for o in sorted(occurrences, key=lambda x: (x['path'], x['line'])):
            print('    %-56s %-12s %-14s %-28s %s'
                  % ('%s:%d' % (o['path'], o['line']), o['version'],
                     o['rule'] or 'unattributed', o['bucket_field'], label[id(o)]))

    print('pragmatica pin check: %s' % ('FINDINGS ABOVE' if fail else 'all green'))
    return fail


if __name__ == '__main__':
    sys.exit(main())
