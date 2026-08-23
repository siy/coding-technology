# Handover — 2026-08-17, session 2 (plan execution: JBCT 4.8.0)

Continues `HANDOVER-2026-08-17.md`, which covers session 1 of the same day (mutation research,
JBCT 4.7.0, articles published, plan approved). Separate file rather than an appended section, so
the prior session's committed record is not rewritten.

**The approved plan at `~/.claude/plans/compressed-puzzling-stream.md` is executed in full for
Part 1.** Part 2 is a spec handoff and stays unstarted by design.

Versions: JBCT **4.8.0**, PFD 2.5.0, AS 1.1.2, Aether 0.1.0 (draft).
**4.7.0 and 4.8.0 are both committed, untagged, and unpublished.**

---

## What shipped

| Plan item | Result |
|---|---|
| 1.1 lint-count drift | counts removed from three files, installed copies re-synced |
| 1.2 predicate preference | `book/parse-dont-validate.md` |
| 1.3 decomposition evidence | `book/basic-patterns.md`, **framework not named** — see below |
| 1.4 JBCT worksheet | `book/appendix-d-worksheet.md`, wired into spine, index, and site |
| 1.5 release | 4.8.0 in `book/CHANGELOG.md`, `CLAUDE.md`, both `Based on:` headers |
| 1.6 handover | this file |

## The two places the plan could not be followed literally

**1. The lint-count replacement text does not exist.** The plan specified removing the count and
referring readers to `jbct lint --help` for the rule set. That help output lists flags only, and
the CLI has no rule-listing subcommand — `jbct rules` is not a command. Writing the plan's
sentence would have shipped a false instruction to three installed artifacts.

Substituted the rule-ID families, which the reviewer agent already documented and which every
finding is reported under: `JBCT-RET-*`, `JBCT-VO-*`, `JBCT-EX-*`, `JBCT-NAM-*`, `JBCT-LAM-*`,
`JBCT-STY-*`, `JBCT-LOG-*`, `JBCT-MIX-*`. Families are stable in a way a count is not, which is
the property the plan was after.

For the record, since the plan and the skills disagreed three ways: skill said 37, `aether-coder`
said 41, and the CLI ships **69 rule classes** (`find ~/IdeaProjects/pragmatica/jbct -name
'*Rule*.java' -path '*/main/*'`). The plan's own figure of "66 files / 68 registrations" is also
now stale. That is the argument for the removal, made three times over.

**2. Item 1.3 contradicted session 1's handover, and the user resolved it.** The plan said to add
the Spring-versus-JBCT branch comparison to `basic-patterns.md`. `HANDOVER-2026-08-17.md` says
**"Anything about Spring"** must not go into the book without new evidence, because the control was
built by JBCT's author.

The conflict is narrower than it reads. The "control built to lose" objection bites on *test-suite
quality* comparisons — mutation scores — and a branch count is a property of the implementation,
not of its tests. `../oss/internal/mutation-findings.md:143` makes exactly that argument: *"A reader who
rewrote the Spring version idiomatically would still find a 37-branch adjustment function, because
that is the domain talking, not the framework."* The same file recommends *Basic Patterns* carry it.

Surfaced rather than resolved unilaterally, since it decides what a paid book claims about a
competitor. **User chose: keep the number, drop the framework attribution.** The paragraph states
the one-method form against the six-method form and names the six methods; it never says Spring.
The claim's force was never in the framework, so nothing was lost.

**Rule this confirms: when the plan and the handover disagree, the handover is the constraint and
the plan is the intent.** Serve the intent, honour the constraint, and surface the gap rather than
picking a side quietly.

## The worksheet

`book/appendix-d-worksheet.md`, 144 lines, modelled on `book-pfd/appendix-worksheet.md` — Part A
filled per use case, Part B consulted while filling. Seven steps: the six properties, input parsing
to value objects, typed failures as `Cause`, return kind per step, zone and pattern per step,
recovery response per state-changing step, and the four composition obligations.

Step 7 is the reason the appendix was worth writing. It is the 4.6.0 rule at operating altitude —
the four obligations as a checklist with the two per-each rows called out, plus what is explicitly
*not* on the list.

Its governing line is **every row you fill is a claim the type system has to carry**, which is the
JBCT counterpart to PFD's *nothing about the business without the business*.

Wiring: `book/root.md` (the spine, single source for PDF and EPUB chapter order), `book/index.md`
(appendix table), and `website/build.js` — a `LANDING_PAGES` entry at `/java/jbct/worksheet/`, the
slug registered in `nonLessonSlugs` so it stays out of the course spine, and a footer link mirroring
PFD and AS. No `.md` cross-links inside it, per the known combined-build link defect.

## Verification

All four checkers green, run after the final edit:

- `./ai-tools/check-drift.sh` — all green (installed copies re-synced first)
- `python3 ai-tools/sync-book-blocks.py --check` — all in sync
- `node --test website/next-step/*.test.js` — 134/134
- `cd website && npm run build` — all internal links resolve, **85 → 86 pages**, exactly the +1 the
  plan predicted
- Changelog integrity — `diff` of everything from `## [4.7.0]` down against `HEAD` is empty, so the
  4.4.0-style anchor corruption did not recur

Not run: the PDF and EPUB builds. Rebuilding books belongs to the release, which is out of scope.
The spine regex was checked directly and does extract `appendix-d-worksheet.md`.

## Part 2 — unstarted, and correctly so

`../oss/internal/jbct-cli-analysis-spec.md` is complete: the "almost everything already exists"
inventory, the four deliverables in order (`shape-census`, Rule A, Rule C, obligation gap-list), a
calibration set, and a scope caveat. It also records that Rule A and Rule C pull opposite ways — a
`.recover(...)`-terminated method is still fallible upstream of the absorption — which is the
subtlety a naive implementation will get wrong.

The plan forbids editing `~/IdeaProjects/pragmatica` from this repo's session. It stays that way.

## Open

**Ready to act on:**
- **JBCT 4.7.0 and 4.8.0 are both untagged and unpublished.** Readers not emailed for 4.6.0, 4.7.0,
  or 4.8.0. Tagging and publishing both wait for an explicit command.
- **Part 2** — hand `../oss/internal/jbct-cli-analysis-spec.md` to a session working in the pragmatica
  repo.
- `../oss/internal/jbct-loan-defect-report.md` §3 and §4 — two missing tests in `ProcessLoanApplication`.
- **The convergence experiment** — one design, several implementers, compare mutation fingerprints.
  Still the highest-value unmeasured claim; `book/from-process-to-patterns.md:251` asserts
  deterministic structure and nothing measures it. `shape-census` (Part 2, item 1) is the
  instrument.
- **A reply to conceptual-space discussion #16 may land.** Assessment in the
  `reference_conceptual_space_paper` memory; decision remains do-not-cite.

**Standing gaps, none started:** only AS implements the refusal clause; no register of what the
methodology deliberately leaves open; evidence standards differ per book and are never stated;
**every corpus is still the author's** — shipping the instrument is the only route out that does not
need a volunteer and months.

**Carried, none started:** "executable falsification" chapter; seven AS questions audit; corpus
sheets six and seven; article cover SVG dark-mode audit; `/articles/` canonicals on articles #8 and
#11 still 404 on **Medium** only.

**Dirty elsewhere:** `../oss` untracked — config snapshots and `tmp/` research files. Two commits
unpushed in the private cdm repo. Nothing pushed from this session either; commits are local.
