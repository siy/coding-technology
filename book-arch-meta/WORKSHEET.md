# The Derivation Worksheet

*Draft v0.2 (2026-07-11), reworked for ease of consumption per user review: two parts — Part A is the sheet you fill in, Part B is the reference you consult while filling it. Counterexample-invitation footer removed (the invitation lives in ch. 13, not on the sheet). Ch. 4 artifact; also the intake format for reader-submitted cases.*

---

# Part A — The sheet

## Step 1 · Write down the answers

One row per answer. Every answer needs a **number** and a **scope** — "scalability" is not an answer; "the search path serves 50k req/s peak" is.

| # | Question | Your answer (number + scope) |
|---|----------|------------------------------|
| 1 | **Time budget** — per operation: percentiles, tails, soft maxima, completion windows | |
| 2 | **Failure budget** — per operation: error budget, criticality | |
| 3 | **Loss budget** — per data class: RPO, retention, what may never be lost | |
| 4 | **Consistency contract** — per data class or path: strict / bounded / eventual; read-your-writes where? | |
| 5 | **Load** — magnitude (steady and peak), shape per path, concentration, window | |
| 6 | **External constraints** — audit vs replay; residency; mandates that strike values | |
| 7 | **Release structure** — cadence divergence between parts; deploy safety | |
| 8 | **Cost & capacity envelope** — money; who operates | |
| 9 | **Multi-X** — regions, tenants, versions: what partitions naturally, what the law pins | |

Below the table, list the **domain-shape facts** — one line per effectful operation:

- Does an inverse exist (can it be undone in the domain, not in the database)?
- Does the value decay over time?
- Can the operation be reshaped — made idempotent, commutative, or append-only?

*An UNKNOWN is a valid answer. Write it down as UNKNOWN — never guess.*

## Step 2 · Start from the null vector

```
single deployable / direct / unified / current-state / single shared
```

Recovery has no null — it is decided per effectful operation in Step 4.

## Step 3 · The pressure pass

Go through the answers one by one. For each, decide: **inert** (the null vector plus a containment rung handles it) or **pressing** (an axis must move). Record only the pressing ones:

| Answer (Q#, scope) | Mode | Shape | Axis pressed | Toward | Because (mechanism) |
|--------------------|------|-------|--------------|--------|---------------------|
| | | | | | |

Modes, shapes, and rungs are in Part B. Two rules to keep in view while you fill this:

- A driver presses only when it **crosses what the current vector can contain**. Most answers are inert — that is a result, not a failure.
- Check answer **combinations**, not just rows: some pressures clear their bar only when two answers from different questions converge on the same axis.

## Step 4 · Resolve and write the vector

Work through the pressing rows using the resolution rules in Part B, then write the result:

```
topology / substrate / read-write / state / persistence
+ recovery class per effectful operation
```

**Every position must cite the answer(s) that forced it.** A position no answer forces is debt — either inherited, or about to be built voluntarily.

## Step 5 · Verify

- **Per operation:** name the guarantee, the mechanism that earns it, and the behavior under failure. A guarantee with no mechanism means the vector is wrong — or the answer was fake.
- **Arithmetic:** decompose each latency budget down its critical path; compose capacity envelopes upward. If the floors don't fit inside the budget, stop here.

## Step 6 · Leave the trail

One decision record per axis move:

> **Position** · forced by (answer #s) · via (mechanism) · costs accepted · **revisit when** (the citing answer changes)

---

# Part B — The reference

## Driver modes (what each answer does)

| Mode | Questions | What it does | Character |
|------|-----------|--------------|-----------|
| **Prune** | 3, 4, 6, 9 | Eliminates vectors that can't honor it | Binary. Correctness — can't buy back with hardware |
| **Select** | 1 | Chooses among survivors | Presses only near the physics floor |
| **Split** | 5 | Forces decomposition | Presses only on divergence — uniform load presses nothing |
| **Isolate** | 2 | Blast-radius containment | Starts biting past ~99.9 on a named path |
| **Bound** | 7, 8 | The economic envelope | Sets the frame everything optimizes inside |

## Demand shapes (which mechanism family contains it)

Ask of every load answer: **would a second copy help?**

- **Volume** — yes, a second copy helps. Contained by capacity: sizing, cache, replicas, sharding.
- **Contention** — no: one record, one winner, regardless of copies. Contained by admission control, coalescing, or design-out. Never by sharding.
- **Burst** — a peak with a tolerable settling delay. Contained by a buffer (the queue). If the peak must be served synchronously, it is volume at the peak number.
- **Deadline** — "finish inside the window," not "respond fast." Contained by windowed throughput plus resumable batch. Latency mechanisms are irrelevant.

One more triage for time answers: does the deadline bind the **requester's clock** (a statutory 14-day filing window — inert for architecture) or the **system's clock** (a 200 ms response target — presses)?

## Containment rungs (price these before moving any axis)

```
hardware sizing → cache → coalescing → replicas → projections
```

Each rung contains a different pressure; the last one is the axis move, everything below it is not. Thin tiers — load balancers, caches, coalescers — own no business logic and no data of record: they never appear in the vector.

## Resolution rules

1. **Rungs before moves.** The cheapest containing value wins; each new mechanism is an ongoing cost, not a one-time price.
2. **Prune-mode demands: try scope exclusion first.** Narrowing where the demand applies (split the regulated path out) competes with hardening an axis — and often wins.
3. **Conflict on one axis → the scope test.** Pressures from *different* scopes: don't compromise the axis — split the system at the boundary between the pressures and derive each part separately (the split itself has a price: a contract, a consistency decay, a translation seam, an operational seam). Pressures from the *same* scope: decompose the demands to mechanism level and satisfy the binding part minimally.
4. **Still opposed after decomposition → a genuine contradiction.** The output is a renegotiation menu with prices, not an architecture. This is the method working, not failing.
5. **Apply every chosen value at the narrowest scope that contains the demand.** Event-source one data class. Separate one read path. Extract one component. A value applied wider than its demand is unforced cost.

## Recovery classes (per effectful operation, from the domain-shape facts)

- **Design-out** — reshape so the failure cannot arise (idempotent, commutative, append-only, structural constraint). Cheapest at runtime; check it first.
- **BER** (backward) — a defined domain inverse exists; restore consistency by compensating. The inverse must stay in-domain, or compensation becomes its own use case.
- **FER** (forward) — continue degraded: defaults, queue-for-later, decay states, checkpointed batch. Degraded windows must be bounded and visible.
