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
SHA, or fall back to a timestamp, which is portable at the cost of precision. Carry both
where you can: the timestamp is what lets a later reader notice that a verification
predates something the SHA cannot express.

**A stamp asserts "verified against source at this SHA", never "verified against a build
of it."** Two verifications at the same SHA can legitimately disagree if one ran against
stale build artifacts — a class present at HEAD and absent from a cached jar produces a
failure the source cannot explain. Do not try to encode build provenance in the stamp;
just know that the stamp's guarantee stops at source, and say so where the distinction
could bite.

**A stamp covers one item's claim and does not transfer to its neighbours.** Two items
sharing a subsystem do not share a verification, however similar they look and however
recently the other one was checked. Confidence inherited from a neighbour's stamp is the
quietest way a stamped backlog goes wrong, because every stamp in sight is real.

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

## Choosing an instrument when you have to ask the system

The two queries tell you whether to look, not what is true. When the code has moved and you
must actually determine whether a premise survived, you pick an instrument — and instruments
are not equal in what they can observe.

**Prefer the ones where the system describes its own state.** A registry listing what is
actually registered. A status endpoint reporting what actually applied. A history table
recording what actually ran. A journal of requests actually received. A checksum of what
actually shipped. These are the system testifying about itself, and they can say something
you did not expect.

**Distrust the ones that infer state from side effects.** A grep for an expected log line
cannot distinguish "no error occurred" from "that code never ran". A test count measures the
suite, not the product. A health endpoint reports liveness, not correctness. A harness you
wrote yourself tests your model of the system, which is the thing in question. Each of these
reports success identically whether the system works or was never reached.

**The diagnostic question is one line:** does this instrument report the system's state, or my
expectation of it?

**The strongest move available is to run the thing from empty and read what it says about
itself.** A clean start forces the system to describe its actual configuration rather than
inherit assumptions from a warm one, which is how a defect that strands every component, or a
migration that could never apply to a fresh install, becomes visible at all. Field evidence:
in one evening a suite of 12,676 tests stayed green while four such defects were found this
way, and five separate instruments — log greps, test counts, health endpoints, and two
bespoke harnesses — reported success throughout while structurally unable to observe the
failures.

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

**Watch for the instrument shape that reports success while structurally unable to see
failure.** Four shapes, all observed:

- **A field that looks like evidence and measures activity** — the edit-reset freshness field.
- **A verification run against stale build artifacts** — source-identical, behaviour-different.
- **A document written alongside a change that describes the delta rather than the system.**
- **An instrument validated for one question, then cited for its neighbour** — the validation
  is real, the claim attached to it is not, and the gap is invisible because everything that
  was checked did pass. *Validation licenses the specific claim the probe exercised, never the
  question next to it; before citing a validated instrument, ask whether the validation run
  demonstrated that capability or merely that the instrument runs.*

Before believing any check, ask what would make it fail and confirm that it can.

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
second, independent pass re-verifies before anything closes. The second pass must **re-derive**
rather than confirm — a closer that never disagrees is an instrument that cannot fail.

**Prove the layers work; do not reason that they do.** Seed the sweep with one item whose
premise is known to be dead, tell neither layer which it is, and give it to the second pass
carrying a proposed verdict of "still real" — otherwise the first pass may catch it and the
re-derivation you actually depend on is never exercised. If the seed comes back challenged, the
sweep's numbers are credible. If it comes back confirmed, the sweep is blind and its
disagreement rate means nothing at any value: report it as unvalidated. Make the seed typical
rather than obvious, since an easy seed licenses nothing about subtle rot, and exclude it from
the reported counts.

**The seed must not be discoverable except by re-deriving it.** If any artifact the runners can
read identifies it — a prior sweep report, a recorded list of known-fixed items, the data handed
over for the baseline — the blind is not blind, and the failure is invisible: the seed is
caught, the sweep declares itself validated, and the layer you meant to test never ran. Keep the
seed's identity in a record the runners do not hold. Note the residual honestly: the practice of
seeding is itself documented, so what the probe measures is sensitivity *under awareness*, an
upper bound rather than an estimate.

**Vary the seed's difficulty across sweeps, never within one, and record the level.** One seed
is a smoke test; one seed per sweep at a deliberately chosen difficulty accumulates a
sensitivity curve over successive sweeps at no extra cost per run.

Report the decay rate as a number; it is the only way to know whether the practice is working,
and the only way the next sweep has something to compare against.

## Applying this to claims, not only to plans

A stated guarantee is a belief about code exactly as a plan item is. "Delivery is at-most-once"
rots when the code moves, the same way "the retry path drops errors" rots, and it rots silently
because a document has no way to notice. The mechanism transfers — with one structural
difference that changes the economics.

**Documentation has no pickup.** Three of the four read points assume a reader who can verify:
an agent taking an item, a ruling being made, a gate being acknowledged. A document's readers
are users who cannot verify and who arrive continuously, so "someone read it" is a read with no
verification capability attached and does not count. **Of the four read points, documentation
has exactly one usable one: the release stamp.**

That is the design consequence rather than a defect. Claims cannot rely on lazy
verification-at-use, so they must be swept on a schedule, and the release boundary is that
schedule — the same release-boundary event a plan sweep already is. **One pass, both
artifacts.**

Everything else transfers unchanged: `verified_at` with the no-touch-on-ordinary-edit rule,
`subsystems` making the range query cheap, and all four hazard shapes — including the one that
produces most doc defects, a section reporting a guarantee while structurally unable to observe
whether the code still provides it.

Three scoping rules:

- **The unit is the claim, not the section.** One section carries several claims and they rot at
  different rates, so they carry different stamps.
- **Each claim is recorded with its boundary.** What a claim does *not* guarantee is exactly
  what a reader cannot obtain by failing to find a statement, so the two belong in one record
  rather than in one section and one silence.
- **An unstamped guarantee is not trusted**, exactly as an unstamped item is not — never
  silently assumed fresh.

**The test is one line:** *what would have to happen for this claim to become false without
anyone noticing?* If the answer is "nothing, it was never checked," the claim is already in the
failure state rather than at risk of entering one.

**The family runs in two directions, and from outside they are indistinguishable.** A claim that
was true and stopped being so, and a claim that was never verified at all. The second is the more
dangerous, because nothing about it will ever change to trigger a re-read — there is no motion to
detect, and a stamp-based check looking for staleness will find none.

**There is a third direction, and it punishes repair.** Sometimes a check's ability to fail
depends on a defect continuing to exist. A dead-code gate demonstrates that it can detect
anything by pointing at one method known to have no callers; wire that method up, and the gate
still passes while quietly losing its demonstration. The claim being relied on is "this check
works", it was verified once, and the next repair removes the condition that verified it. **Before
fixing something a check depends on, ask what the check was using it for, and land the
replacement in the same change.** This is the seeded probe's logic inverted: a sweep plants a
known-bad case deliberately because an instrument that cannot fail is not evidence, and here the
known-bad case arrived by accident and is about to be taken away by someone doing good work.

**Observed instances, all the same object — a claim whose verification and whose statement have
come apart:**

- a mutation probe reporting a matching checksum for a restore that never happened, after which
  every run measured mutated code and reported green;
- a code comment asserting the opposite of its own file months after the gap it describes was
  closed, with a ticket's gating depending on it;
- work items citing files and symbols absent at HEAD — 9 of 265 in one sweep, and **mechanically
  detectable in seconds** by diffing cited source names against `git ls-files`;
- a commit cited as doing work it did not do, caught only because someone re-ran the sweep it
  was credited with;
- a relayed claim about who holds a role, improved from unattributed to attributed but never to
  verified, because a relay cannot get there.

The third is worth copying: where claims cite identifiers, existence-checking them against the
repository is close to free and finds the decayed ones without reading anything.

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
