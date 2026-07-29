# Blind Derivation 3 — Discord messages/read path (2017-2023) from published answers

**Protocol:** as `BLIND-DERIVATION-SO.md` — every step cites a published answer, comparison with the known outcome only at the end. Predictions pre-registered in `BLIND-DERIVATION-PREDICTIONS.md` (2026-07-07, before the answer sheet arrived), graded below. Sources: [B17](https://discord.com/blog/how-discord-stores-billions-of-messages), [T23](https://discord.com/blog/how-discord-stores-trillions-of-messages), [EX17](https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users), [RS20](https://discord.com/blog/why-discord-is-switching-from-go-to-rust), [ND22](https://discord.com/blog/how-discord-supercharges-network-disks-for-extreme-low-latency), [SDB](https://www.scylladb.com/tech-talk/how-discord-migrated-trillions-of-messages-from-cassandra-to-scylladb/).

## The answer sheet (published demands only)

1. **Volume:** 40M→120M+ messages/day (2016-17) [B17]; 4B messages/day, ~2M DB requests/s (2022) [ND22]; trillions stored [T23]. Product commitment: "We decided early on to store all chat history forever" [B17].
2. **Read shape:** "reads extremely random... read/write ratio about 50/50" (store level, 2017) [B17]; disk ops 2022: ~1.25-1.5M reads/s vs ~0.1M writes/s [ND22]; hot recency in big channels ("requesting messages sent in the last hour... often") [B17]; "it's read latency that has the biggest impact" [ND22].
3. **Latency:** API p95 alert at 80ms [B17]; want sub-ms writes / <5ms reads [B17]; "super snappy all the time" [RS20].
4. **Concurrency/fan-out:** 5M concurrent websockets, millions of events/s (2017) [EX17]; big-guild presence fan-out 900ms-2.1s pre-optimization, 30K concurrent users in one guild [EX17].
5. **Consistency:** availability explicitly preferred over strong consistency for messages [B17]; last-write-wins per column [B17]; per-channel ordering via chronologically sortable Snowflake IDs [B17][T23].
6. **Availability/ops:** "self heal as much as possible", "tolerate a loss of nodes", "Linear scalability — we do not want to manually re-shard" [B17]; high-toil paging named as a failure [T23].
7. **Hot partitions:** "concurrent reads as users interact... can hotspot a partition"; "unbounded concurrency, leading to cascading latency" [T23].
8. **Team bound (loud):** "only 4 backend engineers", no dedicated DevOps (2017) [B17].
9. **Presence:** ephemeral, re-derivable, massive fan-out [EX17]; not a stored data class.
10. **Compliance/audit:** absent from all sources (the history-forever policy is voluntary product identity, not a mandate).

## The derivation (each step cites an answer)

Start at the null vector.

**Persistence.** Trillions of rows forever (#1), 2M req/s (#1), survive node loss, linear scaling without manual resharding, four engineers (#6, #8): a single shared store fails containment on volume and on ops (the F12 ceiling — no single box's economics hold this). The demand set has a natural partition key: messages belong to exactly one channel, and the read pattern is per-channel recency (#2). → **sharded on channel**, with a time bucket as the mechanism that bounds partition size. Consistency check: per-channel ordering + eventual acceptable + availability preferred (#5) — the sharded position contains it; nothing prunes toward a distributed strict store.

**Data-shape → polyglot.** The read is (channel, time-descending) recency scans at millions/s with tight latency (#2, #3). A row store shaped for relational access isn't shaped for this; a log-structured wide-column store with (partition key, time-ordered clustering) is the ledger's polyglot entry verbatim: **store shaped to the read, at the message scope.**

**Deployment — one split.** The real-time fan-out workload (#4) diverges from request/response API work on every dimension: millions of long-lived stateful connections, in-memory session/guild state, event-push lifecycle. Scope split → **gateway tier as its own component; the API itself stays a monolith** (nothing in the answers presses to decompose it — team of four presses hard the other way).

**Hot partitions — contention, not volume (the interesting step).** A hot channel concentrates concurrent identical reads on one partition (#7). More sharding cannot help: one partition has one home — structurally the same as ticketing's on-sale seat, but on the *read* side. Containment, not redistribution: **coalesce identical in-flight reads keyed by channel, bound the concurrency** — a thin mechanism layer in front of the store. Read/write model stays **unified** (plus cache rungs, F13): nothing here demands a projection; the reads want the same rows, just deduplicated.

**Storage & recovery.** No audit/replay mandate (#10) → current-state, where the current state happens to be an append-shaped message set. Writes reshaped so conflicts can't matter: upserts + last-write-wins + sortable IDs (#5) = **design-out for message writes**. Presence: ephemeral, re-derived on reconnect, decays (#9) = **FER**. 

**Substrate.** Direct on the data path; the real-time path is event fan-out by its nature (facts pushed to sessions) — **mixed by scope, each scope uniform.**

**Derived vector:** *API monolith + gateway split / direct data path + event fan-out real-time path / unified reads + coalescing and cache rungs / current-state, append-shaped, design-out writes / sharded polyglot wide-column on (channel, time bucket) / design-out (messages) + FER (presence).*

## Comparison against the known outcome

| Derived | Actual | Match |
|---|---|---|
| Gateway split; API stays monolith | Elixir gateway/session/guild tier; "our API monolith" [T23] | ✓ (their own word) |
| Sharded on (channel, time bucket), wide-column | `((channel_id, bucket), message_id)`, bucket = static time window | ✓ exact |
| Coalescing containment layer, unified store, no read model | Rust data services: "no business logic", "one gRPC endpoint per database query", coalescing routed by channel ID | ✓ |
| Design-out writes (upserts, LWW) | Cassandra upserts, per-column LWW, Snowflake ordering | ✓ |
| FER presence, not a stored class | Presence in Erlang process state, fanned out; no presence DB | ✓ |
| Cache rung | Read States LRU service (millions of entries) | ✓ |

**Prediction grades** (from `BLIND-DERIVATION-PREDICTIONS.md`): gateway split HIT; sharded wide-column on channel+time HIT; append-only/design-out HIT; eventual + per-channel ordering + presence-as-decay HIT; **the registered revision HIT** — the read path is a coalescing layer over a unified store, not CQRS. Honesty note: that revision was made before the data arrived but from memory of these same sources, so it grades as a registered-and-confirmed call, not a clean "derivation beat the prior" like SO's replica miss.

## Findings

- **F15 — contention is symmetric across reads and writes.** The hot partition is read-side contention; ticketing's on-sale seat is write-side. Same containment family both times: admission/coalescing, never more sharding. Ledger v0.2: coalescing joins the read-containment chain (cache → coalescing → replicas → projections), and the volume-vs-contention distinction gets stated side-agnostic.
- **F16 — the vector lens classifies migration severity.** MongoDB→Cassandra (2017) was an *axis move* (single shared → sharded polyglot): hard, architecture-level. Cassandra→ScyllaDB (2022) changed **no axis** — same position, different product, pure Phase 6 ("same restaurant, different meal"). The derivation predicts which migrations are architectural and which are procurement. Article gem.
- **F17 — demands can come from product identity.** "Store all chat history forever" is voluntary, not regulatory — and it still presses the persistence axis as hard as any SLO (177 nodes hard). Entry-gate note: identity-demands must be priced like any other answer; Discord visibly paid.
- **F18 — thin mechanism tiers are axis-invisible.** Load balancers, caches, coalescers (the Rust data services) own no business logic and no data: they are containment mechanisms, not topology moves. The ledger should say so explicitly, or every real system looks like it has more deployables than its vector claims.
