---
name: read-point-planning
description: Read-Point Planning (RPP) — keep a plan true where it is read. Use when picking up a ticket or batch (verify its premise before working), filing a ticket, recording a decision or ruling, running a staleness sweep across a backlog, or whenever a plan artifact (backlog, dependency graph, roadmap, TODO list) may have gone stale under a moving codebase. Also use when asked about premise rot, stale tickets, verified_at stamps, blast radius, or `know:` commits.
---

# Read-Point Planning (RPP)

A plan is a cache of beliefs about a world that changes independently. Tickets, edges
between them, and priorities all record what somebody believed on the day they wrote it,
about a codebase that moved the next day. Plans therefore do not fail by tangling, they
fail by rotting.

RPP is the maintenance discipline: **guarantee the plan is true where it is read, and
nowhere else.** Cheap writes when knowledge is created, real verification only at the few
moments the plan is actually consulted.

Measured on a 139-item graph in one day: ~24% of premises stale or partially wrong, twelve
items already done, three real blockers hidden behind expired beliefs, and roughly 80% of
all the value came from refreshing premises rather than fixing topology. Assume the same
proportions until you have measured your own.

## The two things a plan item carries

```
verified_at: <commit SHA>   # what you checked against, plus a timestamp if multi-repo
subsystems:  <paths>        # the code this item's premise stands on
```

`verified_at` means **last verified**, never *last edited*. Ordinary edits — a comment, a
relabel, a reassignment — must not touch it. A freshness field that any activity resets is
an inactivity timer, which is the failure mode of every stale bot and the thing RPP exists
to replace.

A SHA is repo-scoped. When an item's premise spans repositories, carry a map of repo to
SHA, or fall back to a timestamp, which is portable at the cost of precision.

## The four read points

Verification happens here and nowhere else. Between them the plan is knowingly stale, and
that is correct, because nothing is reading it.

1. **Batch pickup** — before working an item or a cohesive batch.
2. **Anchor acknowledgement** — before gating a stabilization round.
3. **Ruling time** — when a decision is made whose blast radius must be enumerated.
4. **Release stamp** — when a stabilized state is labeled publicly.

## At a read point: two histories, two queries

Rot arrives through two channels and only one of them is written by your own process.

```bash
# 1. What the world did — silent rot. Path-filtered, or the check is too expensive to run.
git log --oneline <verified_at>..HEAD -- <subsystems>

# 2. What we decided — loud rot.
git log --oneline --grep='^know' <verified_at>..HEAD
```

Three outcomes:

- **Both empty** — nothing moved, nothing was decided. Trust the item and start work. This
  is the common case, it costs about a second, and it is what makes the discipline affordable.
- **Code moved** — re-check the premise. Does the problem still exist, is it smaller, or is
  it already fixed? Adjust the item, including its edges.
- **A ruling names you** — re-scope. A decision was made that you were not in the room for.

Never skip query 1 in favour of query 2. A belief log only knows what your process wrote;
the dominant decay comes from ordinary code landing, often untracked, usually with no edge
to the item it invalidates. A loop closed over its own events is consistent and confidently
wrong.

Then write back: stamp `verified_at` with current HEAD, and if the check produced a
decision, record it (below). Verification is itself knowledge creation.

## At write time: record, do not act

Whoever creates knowledge writes the mark, at the moment it is cheapest.

- **Filing an item** — answer two one-line questions: *what existing knowledge does this
  invalidate?* and *what does this genuinely depend on?* A new item is new information, and
  new information is what expires old notes. Unanswered, the item is unintegrated and does
  not join the frontier.
- **Making a ruling** — name its blast radius. At the moment of decision this is usually one
  sentence ("everything citing bare `/api/` paths"); a week later it is archaeology. A
  decision not yet made is itself a blocker and belongs in the plan as one.
- **An incident** — challenge the premises of items whose evidence it contaminates. This
  changes no edges at all.

**Marks lower confidence. Nothing acts on a mark automatically.** The detector can itself be
wrong — in the pilot it was, on day one, and a second independent check falsified it. A human
or an executing agent verifies at the read point before anything is closed or rewired. Trust
the smoke detector to wake you, not to put out the fire.

## Propagation: one hop, marks only

Three different things get called propagation and they have opposite economics. Propagate a
**mark** eagerly; it is cheap and needs no judgment. Never automatically propagate a
**re-verification** (costs attention per item) or a **rewrite** (corrupts the graph when the
mark was wrong).

Stop at one hop. Transitive closure arrives free through the read points: mark B when A
changes; when B is picked up its own check runs, and if B's premise really changed it writes
its own mark, which reaches C. The ripple travels the full depth of the graph one hop at a
time, arriving exactly when someone is about to act and not before. Marking transitively
instead dilutes confidence with distance, compounds false positives, and spends effort on
items that will never be picked up.

**One exception, where you must push:** a mark landing on something already in flight is a
mark against a read that already happened. Interrupt for that small set; stay quiet for the
rest.

Keep writes O(1): append one event that *names* its radius rather than editing N items.
One write per change however many nodes it touches, no merge conflicts between parallel
streams, and an audit trail of who suspected what and when.

## Commit convention

Knowledge events change nothing about the product; they change what is believed about it.
That earns its own conventional-commit type rather than a scope on `feat`/`fix`/`docs`.

```
know(ruling):  <one line — what was decided>
know(premise): <one line — what was verified or challenged>
know(split):   <one line — how an item decomposed>
```

The commit is the pointer; the payload is the diff (blast radius, evidence, verdicts). This
keeps single-line commit discipline intact while `--grep='^know'` stays a useful index. A
useful side effect: the convention makes its own adoption auditable — a ruling with no
`know:` commit is a greppable gap.

If prefix discipline slips, the design degrades gracefully: query 1 is prefix-independent, so
a forgotten prefix costs the loud-rot signal while silent-rot detection keeps working.

## Sweeps

Routine maintenance is not a sweep — that is grooming, whose cost scales with backlog size
rather than change rate, which is why it gets skipped exactly when it is needed. A full sweep
is a **release-boundary event**: re-verify every item, stamp every `verified_at`, and record
the decay rate you observe.

Sweep discipline: two layers, because the instrument errs. One pass proposes staleness, a
second, independent pass re-verifies before anything closes. Report the decay rate as a
number; it is the only way to know whether the practice is working.

## What RPP is not

Not a planning system, and not a replacement for a tracker. The tracker owns content; RPP
owns freshness metadata and the discipline around it. No automatic edge inference — edges
need stated evidence, since plausibility is not provenance. No continuous global coherence:
between read points the plan is stale on purpose.

## Lineage

Truth maintenance systems (Doyle 1979) for justified beliefs and invalidation; Lehman (1980)
for assumptions the changing world silently invalidates; RAND's Assumption-Based Planning
(Dewar) for load-bearing assumptions and signposts; PLANEX (Fikes, Hart & Nilsson 1972) for
verifying preconditions at execution and skipping work the world already did; build systems'
verifying traces for `verified_at`. What is new is the mechanical part: a signpost that reads
itself, keyed to observed motion in version control, and a measured price for the rot.
