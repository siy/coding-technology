# The regeneration test — results

Registered in `REGENERATION-PREDICTIONS.md` at `d07f42d`, **before any builder was launched**. Arm A's
structure was extracted and written down **before arm B reported**. Scored 2026-09-05.

# Headline: P1, P2, P3 hit. P4 is not falsified, and the structure the model change produced regenerates from the current specification alone.

## Isolation held

Arm B's builder disclosed its sources unprompted: the eleven spec files, the JBCT skill, and Pragmatica
Core's `lang` package. It ran `jbct lint` against Core's own `vo` package as an instrument check. It read
nothing under `ticketing` and ran no search across `~/IdeaProjects`. Run 1's failure mode did not recur.

Arm B's artifact is real, not a sketch: 16 files, 973 lines, compiling under `javac -Xlint:all` against
`core-1.0.0-rc4.jar` with no warnings, a 26-check behavioural harness passing, and `jbct lint` reporting
0 errors and 24 warnings. Its author mutation-probed its own harness twice — writing the booking row first
turns the ordering check red, and dropping compensation turns five checks red — so the harness can fail.

## Scoring

| Prediction | Arm A (evolved) | Arm B (fresh) | Verdict |
|---|---|---|---|
| **P1** three gate checks concurrent | `Promise.all(readSaleStatus, countActiveBookings, readSeatSellability)` | `Promise.all(gateSale, gateSeat, gateCustomer)` | **HIT** |
| **P2** step count within ±1 | 5 stage records | 4 stage records | **HIT** |
| **P3** write order preserved | insertTicket → insertPayment → insertBooking | saveTicket → savePayment → saveBooking | **HIT** |
| **P4** nothing traces only to history | — | — | **NOT FALSIFIED** (below) |

Neither arm was told to parallelise validation, and both did: `Result.all` over the four field parses,
independently, in addition to the gate.

## P4 in detail — the prediction the run existed for

The model change under test is `5b685a4`, *"seat is the reservation identity, unblocking resale and
hold-to-purchase"*. Before it, the reservation was not keyed by seat. The candidate residue surfaces were
named in advance: `ReservedBuy.claimId`, the `confirmReservation` keying, and the `claimSeat` guarded claim.

**Arm B produced all three, from the current specification, with no access to that history.** It declares
`ClaimId` as a value type, wins it in `ClaimSeat`, carries it in a `Claimed` stage record, and keys
`ConfirmClaim` and `ReleaseClaim` by it. That is arm A's post-change shape, regenerated.

So the structure the model change produced is a function of the requirements as they now stand, not a
trace of the change that introduced it. On this instance, **debt did not accumulate as a stock: the
evolved code is what a fresh build produces.**

## The three divergences, reported because they are the interesting part

**1. Error grouping — and arm A's own comment names arm B's answer.** Both arms produced *the same ten
failure values*, including two records with identical names and identical two-field shapes
(`InvalidRequest`, `UnacceptableValue`). Arm A splits the eight fixed-message causes into four enums by
HTTP status; arm B puts all eight into one enum named **`General`**. Arm A's javadoc explains why it does
not: *"which is why the group is named for that routing rule rather than `General`"* — route error-mapping
targets a whole status class by the enum's simple name, via `routes.toml`.

Arm B **had the status mapping** (`08-failure-catalog.md` carries a Status column; `07-http-api.md` lists
400, 402, 409, 422, 503 for this endpoint) and still did not group by it. What arm B did not have is the
*mechanism that makes the grouping pay* — `routes.toml` pattern-matching on an enum's simple name is an
Aether deployment artifact, absent from the process specification. The divergence is a response to a
constraint outside the input, not residue from arm A's path. Arm A reached this form in `7122341`, a
refactor **after** the model change.

**2. Dependency granularity.** Arm B declared fourteen single-method step interfaces. Arm A uses one
shared `BookingStore` port of seven methods plus cross-slice use case calls. Arm A is one use case among
several sharing that store; arm B built one use case alone and had nothing to share with. Again an input
difference, not a path difference.

**3. Placement — a misclassification by arm B, not an indeterminacy.** Arm A places the use case at
`...booking.purchase.buyticket`: subsystem, **workflow**, use case, as the telescope rule requires. Arm B
placed it at `...booking.usecase.buyticket`, dropping the workflow level and inserting a literal `usecase`
segment.

**CORRECTED TWICE, 2026-09-06. The second correction reverses the first, and both reversals are recorded
because the sequence is the finding.**

**Correction 2 (final): arm B applied the rule correctly, and its placement is what the book prescribes for
what it was asked to build.** The telescope rule in `book/project-structure.md` is explicit that structure
*appears* with growth: *"A new app is flat. Every use case is a package directly under `usecase`"*, and its
worked example shows `searchevents/  # still flat - in no workflow yet`. A workflow package appears only
*"when several use cases cohere under one change driver"*. **Arm B built exactly one use case.** With no
siblings, no workflow has appeared, so the use case belongs flat under `usecase` — which is precisely
`...booking.usecase.buyticket`. Arm B kept the subsystem because the specification names three authoritative
subsystems, and omitted the workflow because on its input there is none to name.

Arm A carries `purchase` because arm A has the siblings — acquire hold, cancel ticket, sweep holds — that
cohere into it. **So the placement difference is derived from the scope difference, exactly as the method
says structure should be.** It is not indeterminacy and it is not an error. It is the rule working.

**Consequence for the run: after this correction there is no divergence attributable to the method, and none
attributable to a mistake.** All three trace to inputs arm B did not have — the routing mechanism, the
sibling use cases, and the scope. The run's structural agreement is therefore stronger than first scored.

**Correction 1 (superseded, kept for the record).** This file first called that "a genuine miss ... neither
an outside constraint nor the history explains it", and framed it as the boundary of the determinism claim.
That framing was wrong, and the correction matters more than the original reading.

Both inputs the derivation needs were present. **The workflow is named in the specification**: the README's
index says `02-processes-booking.md` contains "Holds, **purchase**, cancellation, hold expiry", and B3 *Buy
ticket* is the purchase process — `purchase` is exactly the segment arm A used. **The rule was also
present**: the telescope is JBCT's, and arm B had the skill. An applier holding both the fact and the rule
and still producing the wrong path has *misapplied a determinate rule*. That is an error, not evidence that
the method permits a choice. A determinate method can be misapplied; the two are different claims and this
file conflated them.

**What survives from correction 1 — and the owner sharpened it further.** No lint rule checks telescope
placement, and **it cannot**: the package path is the only record in the codebase of which use cases cohere
under which change driver. A checker compares two things, and here there is only one. Placement encodes
business context for which the code holds no second source of truth, so this is not a gap the toolchain can
close — it is outside the checkable fraction by construction. The only place both sides exist is authoring
time, where the specification and the code are in hand together, which makes it a skill obligation rather
than a gate rule.

Recorded as a real gap regardless: the JBCT skill does **not** carry the telescope rule at all — zero hits
for it across `ai-tools/skills/jbct/`, and `sync-book-blocks.py` syncs import ordering and member ordering
from `book/project-structure.md` while leaving *The Telescope Rule* unsynced. Arm B reached the right
placement without ever being given the rule. Note for decision 5's fidelity check: counting gate rejects
would not have detected this, because the gate cannot see placement.

For the record, the ARCH family in full: no rule in any of the 77 knows what package a use case belongs in. The ARCH family covers dependency direction
(`JBCT-ARCH-01`), the lift zone (`-02`), use-case coupling (`-03`) and slice internals (`-04`); no rule in
any of the 77 knows what package a use case belongs in. So the one structural error in the run is precisely
the class `jbct check` cannot see — which is why it survived into an artifact that passes the gate with 0
errors. The telescope is prescribed in the book and unenforced in the toolchain.

## What this licenses, and what it does not

**Licensed.** On this use case, a fresh build from the current process specification reproduces the
evolved code's concurrency structure, its write ordering, its stage decomposition within one record, its
complete failure catalogue, and — the point of the run — the structure introduced by a domain-model change,
without access to that change. Path-independence is **supported on this instance**.

**Not licensed.** n = 1 use case and n = 1 builder; this can falsify, it cannot estimate a rate.
Note that after the placement correction above, **the run contains no divergence attributable to the method
itself**: two trace to inputs arm B lacked, and the third to an applier error the gate does not catch.
Requirements did not change *between* the arms, so the run asks whether maintenance leaves residue, not
whether a re-derivation after changed requirements converges. The specification numbers its steps in
execution order, which was disclosed in advance and matters less here than in Run 1c because both arms read
the same numbering. And the two structures were compared by one reader — me — who wrote arm A's description
before seeing arm B's, but who is not blind to the thesis.

**The honest caveat the run itself produced:** two of the three divergences trace to inputs arm A had and
arm B did not. "The input is the PFD process" is the design's assumption, and arm A was in fact also shaped
by a routing configuration and by sibling use cases. A stronger successor gives both arms the whole input,
or states the boundary of "the process" more narrowly than a repository does.
