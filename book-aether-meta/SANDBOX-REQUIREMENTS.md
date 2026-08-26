# Sandbox requirements — prototyping the durable-entity reliability patterns on Forge

Status: requirements draft, 2026-08-26. Written against pragmatica `release-1.0.0-rc3` head
`e123caafb`. Audience: whoever scopes the Forge/Ember work; written product-neutral so it can be
lifted into a public issue.

## Purpose

A set of reliability patterns is designed on top of the shipped `DurableEntity` primitive but not
yet built: a durable saga (step ledger with paired compensations and per-step rerun policy), a
workflow facade (validated state machine over entity state, with timers), a per-key monotonic
idempotency anchor, and the entity-as-lease/lock idiom. Each is INVENTED-tier: it must be
exercised as a working prototype against real failure injection before it can be canonized or
recommended. The natural place to do that is Forge (the developer tool over Ember's in-process
cluster), because every scenario below is a failure-timing scenario, and Forge is where failure
timing is supposed to be cheap.

This document lists what the prototypes need to exercise, which failure scenarios must be
injectable, what Forge must support for each, and the acceptance criteria per pattern.

## Prerequisites (blocking, independent of any one pattern)

- **P1 — Entity resource on Ember/Forge nodes.** The `entities.<keyspace>` resource must
  provision on Forge-started nodes exactly as on a production node (same SPI path, same config
  binding, same fence), with `replication_factor >= 2` honored across the in-process nodes and
  entity state written to the Forge data directory so restart scenarios are meaningful.
- **P2 — Entity timer fire driver wired.** Timers are durably recorded today but the fire driver
  is not wired into a node, so nothing fires. Saga timeouts and workflow timers cannot be
  prototyped until due timers fire on the partition owner, including after a handover. Wiring the
  driver (at minimum on Forge nodes) is a hard prerequisite for half the scenarios below.
- **P3 — Ungraceful termination in Forge.** Forge's "kill" today is a graceful `stop()`. Graceful
  stop flushes and hands over; it cannot produce the crash windows these patterns exist to
  survive. Forge needs a hard-termination mode per node — drop the node without running `stop()`,
  releasing nothing — that approximates process SIGKILL as closely as a single JVM allows, and
  reports honestly where the approximation falls short of a real process kill.
- **P4 — Deterministic fault points.** Random chaos finds bugs eventually; prototype gates need
  the crash placed exactly. Required: a way to arrange "terminate node N at point X" where X is a
  named point in application code (a test-only hook a slice can call, e.g. `faultpoint("after-
  charge-before-ledger")`, armed per scenario from the Forge API). Without this, the single most
  important scenario (S1 below) is untestable except by luck.

## Patterns and the scenarios each must survive

### Saga ledger over the entity

The prototype: saga state as `DurableEntity` state; steps declared with forward action,
compensation, and a required rerun policy (`RUN_ONCE` | `IDEMPOTENT`); a `RUN_ONCE` step writes a
step-attempt marker under the fence before invoking its forward action.

- **S1 — Crash in the effect/record window.** Arm a fault point between a `RUN_ONCE` step's
  forward effect (a call into another slice) and the ledger commit recording it. Hard-terminate
  the node there. On recovery: the marker is found, the forward action is not invoked a second
  time, and the saga completes or compensates from the correct step. Acceptance: across repeated
  runs, the downstream effect count for that step is exactly one, and no run loses the saga.
- **S2 — Crash between steps.** Hard-terminate after step k's ledger commit, before step k+1
  begins. On recovery the saga resumes at k+1; `IDEMPOTENT` steps may re-run, `RUN_ONCE` steps do
  not.
- **S3 — Compensation failure is a named terminal state.** Make a compensation's target slice
  unavailable (node stopped or a failure-injecting stub). The saga finishes in the
  partially-compensated state, the failed compensation is identified in the status read, and
  nothing retries forever.
- **S4 — Owner failover mid-saga.** Hard-terminate the entity partition owner while a saga is
  mid-step. The new owner recovers the ledger from the replicated log; a write from the deposed
  owner cannot commit (fence); the saga completes with effect counts respecting rerun policies.

### Workflow (validated state machine + timers)

- **W1 — Illegal transition is a typed refusal.** Dispatching an event illegal in the current
  state returns the typed refusal and writes nothing, verified by a subsequent read.
- **W2 — Timer fires after handover.** Schedule a timer, hard-terminate the owner before it is
  due, and observe the fire applied by the new owner at or after the due instant (needs P2 + P3).
- **W3 — Cancel races the fire.** Cancel close to the due instant; either outcome is acceptable,
  but exactly one of {fired, cancelled} is observable — never both, never neither.

### Idempotency anchor (per-key monotonic counter)

- **I1 — Duplicate delivery converges.** Drive an entity update from a stream consumer, force a
  redelivery (see F5), and verify the downstream effect keyed by `(key, n)` lands once.
- **I2 — Counter survives failover.** Hard-terminate the owner; the counter continues monotonic
  on the new owner — no reuse, no gap large enough to break the downstream dedup contract.

### Entity as lease/lock

- **L1 — Single writer under contention.** Two slices updating one key concurrently: updates are
  totally ordered; no interleaving is observable via reads.
- **L2 — Deposed holder cannot act.** Hard-terminate and isolate the owner mid-update; the
  deposed node's in-flight write is rejected by the fence, verified by the absence of its effect.

## Failure injections Forge must support (consolidated)

| # | Injection | Needed by |
|---|---|---|
| F1 | Hard-terminate a named node (no `stop()`) | S1, S2, S4, W2, I2, L2 |
| F2 | Fault-point-triggered termination (P4) | S1, S2, W3 |
| F3 | Stop/refuse a named slice's calls (downstream outage) | S3 |
| F4 | Full-cluster stop and cold restart from data dirs | ledger recovery bound (documents the #349 envelope; expected-fail is an acceptable recorded outcome) |
| F5 | Force stream-consumer redelivery (drop a checkpoint, or reassign the consumer ungracefully) | I1 |
| F6 | Clock skew between nodes (configurable offset) | W2 timing bound (desirable, not blocking) |

## Observability the sandbox needs

- Entity keyspace hosting view (which node owns/holds which partition) — exists via the
  management API; must be reachable from Forge.
- A read of saga/workflow status (the prototype provides the status read; Forge must let a test
  poll it cheaply).
- Effect counting at the downstream slices (test-owned counters are fine; no product change).
- Per-run failure-log capture surviving node termination (exists for the integration suites;
  Forge runs need the same).

## Acceptance criteria (gate for canonizing the patterns)

1. Every scenario above runs as a scripted, repeatable Forge session — no manual timing.
2. S1, S4, I1, and L2 pass repeatedly (the flaky-window scenarios; a bounded repeat count is
   fixed when the suite is scripted, and a single unexplained failure blocks the gate).
3. Each pattern's guarantee is written down per operation with its mechanism and its bounds, and
   every bound observed in the sandbox (e.g. the F4 cold-restart outcome) is recorded with it.
4. Anything a scenario surfaces that is a runtime defect rather than a prototype defect is filed
   upstream before the pattern is canonized.

## Out of scope

Performance measurement of any kind (a separate gate owns that); multi-machine network
partitions (Forge is one JVM; the cloud suites own real partitions); the pub-sub surface
(nothing in these patterns depends on it).
