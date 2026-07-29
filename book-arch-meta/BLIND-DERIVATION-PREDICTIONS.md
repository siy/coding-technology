# Pre-registered predictions — blind derivations 2 & 3

**Registered 2026-07-07, BEFORE the research agents returned their answer sheets.** The derivation writeups must quote these verbatim and grade them, hit or miss. (Protocol established in `BLIND-DERIVATION-SO.md`, where the pre-registered "read replicas" prediction was wrong and the derivation was right — the miss is the point.)

## Shopify (pod era, ~2015-2020)

- Deployment: modular monolith as the app tier (single deployable per pod).
- Persistence: **sharded on shop_id** — the natural partition key; cross-shop transactions barely exist. Pods as *full-stack* shards (not just DB), doubling as blast-radius isolation for flash sales.
- Flash-sale contention (limited inventory drops): handled by **admission control / queueing, not by more sharding** — contention ≠ volume (the ticketing on-sale rule).
- Substrate: direct within; async jobs/webhooks at the edges.
- Read/write: unified. Storage: current-state. Recovery: BER for checkout money.

## Discord (2017-2023, messages/read path)

- Deployment: split by workload shape — real-time gateway (websocket fan-out) separate from API/data path.
- Persistence: **sharded wide-column store on channel + time bucket** (polyglot: store shaped to the read).
- Storage: append-only immutable messages — design-out flavored.
- Consistency: eventual/bounded staleness acceptable for message reads; per-channel ordering; presence as decay (FER).
- **Registered revision of my own earlier claim:** when queuing Discord I said "genuine read-model separation." I now predict that prior is WRONG — expecting a **coalescing/containment layer over a unified store**, not classic CQRS/separated read models. If the answers confirm, that's a second "answers beat the prior."
