# Pre-registered predictions — the regeneration test

**Registered 2026-09-05, BEFORE any builder was launched and before any comparison was made.**
Owner's instruction: run it. Owner's design constraint, which shapes everything below: *the input is a
PFD process and it is identical in all arms.*

## The question this run exists to answer

The postponed structure article's thesis is **path-independence**: that a JBCT codebase's structure is a
function of its current requirements, not of the history by which it reached them. Debt, on that thesis, is a
flow rather than a stock — it appears when requirements change and drains when the structure is brought back
to them.

Nothing measured so far speaks to it. Run 1 was contaminated. Run 1b's instrument was wrong. **Run 1c held the
input identical across ten builders and measured convergence — every builder built from scratch, so no path
varied.** The residue count run today (zero hand-written Reaction constructs in 5,009 lines) describes the
present state of compliant code and says nothing about how it got there. Path-independence needs two *paths*
to one set of requirements, and this run supplies them.

## The two arms

| Arm | Path | Input |
|---|---|---|
| **A — evolved** | built once, then maintained through 5 commits including a domain-model change | the process spec |
| **B — fresh** | built once, from scratch, by a builder with no access to A | the same process spec |

**Subject: B3 "Buy ticket"** from `docs/spec/02-processes-booking.md` in `ticketing`. Chosen because it is
the only use case whose history contains a genuine model change rather than formatting: `5b685a4` — *"seat is
the reservation identity, unblocking resale and hold-to-purchase"* — surrounded by a reformat, a suppression
cleanup and a cause-grouping refactor. It is also the richest process in the spec: a compensating saga with a
three-way concurrent gate, a binding write order, and a per-stage compensation table.

**Input pinned:** `02-processes-booking.md`, sha256 `617d32cd3e3c570eba9760d393a3dc2468896e8375114a7f7e5a1ee70aaaa4b6`, 237 lines.
**Arm A pinned:** `ticketing` at `0c61d81`.
Note for the record: the spec is **untracked** in `ticketing`, so the sha256 above is the only pin that exists.

## Isolation protocol

Arm B's builder receives: the process spec, the JBCT book or skill, and the Pragmatica Core API reference.
It does **not** receive: the `ticketing` repository, its git history, or any description of arm A's shape.
This is the boundary Run 1 failed to hold; Run 1b established that it must be enforced rather than requested.

## The metric, defined before looking

Compared on the Run 1c instrument (data-dependency graph), plus the structural facts JBCT claims are
determined:

1. **Concurrency structure** — which steps are independent and therefore composed as Fork-Join.
2. **Step count and boundaries** — how the process is cut into steps.
3. **Write ordering** — the sequence of the three writes.
4. **Return types per step** and the typed-error catalogue.
5. **Placement** — package path under the telescope rule.

## Predictions

- **P1.** Arm B composes the three gate checks concurrently, as arm A does. *Falsified if B serialises them.*
- **P2.** Arm B's step count is within ±1 of arm A's.
- **P3.** Arm B preserves the binding write order (ticket, payment, booking last).
- **P4 — the path-independence prediction, and the one that matters.** **No structural element of arm A is
  attributable only to its history.** Concretely: nothing present in A and absent from B traces to the
  superseded pre-`5b685a4` model in which the seat was not the reservation identity.
  *Falsified if such an element exists* — that would be structural residue, i.e. debt as a stock.

**Publication commitment, as in every prior run: the result is reported whichever way it falls, and P4's
falsification is the headline if it triggers.**

## What this run cannot license, stated in advance

- **n = 1 use case, 1 builder.** It cannot estimate a rate; it can only fail to falsify, or falsify.
- **The spec numbers its steps in execution order.** Run 1c disclosed the same limitation and it bit there,
  because ordering was the thing under test. Here both arms read the same numbered spec, so ordering is
  *given to both* rather than derived by either — the run is about the path, not about discovery.
- **Requirements did not change between the arms.** A stronger test would evolve the requirements and
  re-derive; this one asks the narrower question of whether maintenance leaves residue.
- A match supports path-independence **on this instance**; it does not establish it as a property.
