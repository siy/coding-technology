# Run 5 — crossings completeness: results

**Executed 2026-08-22** against `CROSSINGS-COMPLETENESS-PREDICTIONS.md`, with the candidate list frozen
in `CROSSINGS-FROZEN-CANDIDATES.md` at commit `6a246b4` **before** the repository was cloned. The commit
ordering is checkable in git history, which is the only thing that makes this run worth reading.

Target: Mastodon. Actual operations enumerated mechanically — public controller actions (Rails
`app/controllers`, methods above the first `private`/`protected`, `concerns/` excluded) plus worker
classes (`app/workers`).

---

## Numbers

| | Count | Share |
|---|---|---|
| Actual operations | **734** | 618 controller actions + 116 workers |
| Traced to a frozen crossing | **459** | **62.5%** |
| Not traced | 268 | 36.5% |
| Traced to a crossing I failed to enumerate | 7 | 1.0% |

Residual composition: **administration 192 (71.6%)** — 185 controller actions plus 7 workers —
**settings 58 (21.6%)**, **scheduled maintenance 18 (6.7%)**.

Traced composition: REST client API 282 · delivery/push/email workers 59 · public web and syndication 54
· ActivityPub 37 · registration and email 19 · WebFinger and NodeInfo 5 · OAuth 3.

## Grading

> **P1.** At least **two thirds** of actual operations trace to a crossing.

**MISS, narrowly.** 62.5% against a 66.7% threshold — 4.2 points short. The threshold was registered as
a guess with no pilot, and this is close enough that it would be dishonest to read much into the sign.
The honest statement is that the lever reaches roughly **three fifths** of a federated social server.

> **P2 — the real test.** The residual is **dominated by scheduled, internal and maintenance
> operations** rather than by externally-triggered ones.

**MISS, and not narrowly.** Scheduled maintenance is **6.7%** of the residual. Administration is
**71.6%**.

This is the failure mode recorded in the frozen list before enumeration: *"If most of the residual is
admin, that is a partial result for P2 rather than a hit: admin is externally triggered, just not by a
machine protocol."* Having written that down in advance, the grade is a miss and the interpretation is
the one already on record.

**What it means for item 17.4:** crossings enumerate the operations that face a *protocol*. Moderation,
policy and instance administration face a *person*, and they are a third of this system. A completeness
lever built on protocol crossings is blind to them by construction. Either the crossing definition
widens to include human-facing boundaries — at which point "finite and given by the input contract"
weakens considerably, because the set of things an administrator might need is not bounded by a
specification — or the lever is honestly described as covering the machine-facing subset only.

> **P3.** The frozen candidate list has a **low false-positive rate**.

**HIT, spot-checked rather than measured.** The least obvious candidates all correspond to real
subsystems: `Move` (57 files), pinning (14), RSS (11), Web Push (4), polls (15), bookmarks (9), backups
(8). No candidate was found to be invented. This was not measured exhaustively and is graded as a
spot-check.

> **P4 (registered prior).** The lever works better for federation than for the client API.

**NOT EVALUABLE.** The prediction compares two rates and I never defined their denominators — there is no
principled count of "operations that ought to trace to ActivityPub". Comparing 37 against 282 compares
system size, not lever quality. **A design defect in the registration, of the same family as Run 2's:
a comparison registered without an operationalization.**

## The finding I did not predict

**Seven workers trace to a crossing that is not on the frozen list.** Mastodon integrates FASP —
Fediverse Auxiliary Service Provider — a provider protocol for search, follow recommendations, trends
and content lifecycle events, with its own admin surface (`app/controllers/admin/fasp/`).

I enumerated the crossings from public protocol documentation, believing that to be the bounded set, and
missed one that is present in the codebase and has its own specification.

**That is the sharpest result in this run**, and it cuts at the premise rather than the threshold. Item
17.4's claim is that crossings give a *completeness lever* because they are "finite and given by the
input contract". They are finite. They are given by the input contract only if you already know every
integration the system has — and the failure mode of the lever is exactly the failure mode it was
supposed to cure. A crossing you have not heard of generates no candidate operations, and nothing in the
procedure tells you it is missing.

## Standing

**Item 17.4's crossings clause is weakened, not killed.** It reaches ~62% of a system chosen because
federation should favour it, it is blind to human-facing administration by construction, and its
completeness depends on an enumeration that was itself incomplete on the first attempt.

It remains the only non-circular part of the proposed procedure, and 62% from public documentation
alone is not nothing — as a *starting* set it beats a blank page. It should be described as a generator
with a known blind spot, never as a completeness criterion.

Claims-ledger row: *claim — context-map crossings give a completeness lever over the operation set;
instrument — frozen candidate list vs mechanically enumerated operations, one system; result —
**62.5% coverage, residual dominated by administration, and the crossing enumeration was itself
incomplete**; caveat — one system, favourable-case selection, coarse controller-action proxy.*
