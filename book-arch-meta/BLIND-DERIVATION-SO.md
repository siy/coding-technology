# Blind Derivation 1 — Stack Overflow (circa 2016) from published answers

**Purpose:** first EXTERNAL validation of `next_step` v0.1 — an architecture we didn't publish, derived from its operators' published statements, compared against the publicly known outcome only at the end. Sources gathered 2026-07-06 (Nick Craver's blog, High Scalability); full citations in the answer sheet below.

**Honesty protocol:** true blindness is impossible (the architecture is famous). Defensibility comes from the same place as in the article: every derivation step cites a published *answer*, never the known outcome. Inputs and outcome are from the same era (2013-2016).

**Pre-registered predictions (made before the answer sheet arrived, on the record in session):** "a monolith with read replicas plus exactly two scope-splits forced by divergent workload shapes (tag matching, full-text search)." Graded below — one part of it is WRONG, instructively.

---

## The answer sheet (published demands only)

Sources: [Arch-2016](https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/), [2013](https://nickcraver.com/blog/2013/11/22/what-it-takes-to-run-stack-overflow/), [Deploy-2016](https://nickcraver.com/blog/2016/05/03/stack-overflow-how-we-do-deployment-2016-edition/), [HS-2014](https://highscalability.com/stackoverflow-update-560m-pageviews-a-month-25-servers-and-i/), [HS-Dash](https://highscalability.com/stackexchanges-performance-dashboard/).

1. **Traffic:** ~209M HTTP requests/day, 66M page loads/day (Feb 2016) [Arch-2016]; 560M pageviews/month network-wide, weekday peaks 2,600-3,000 req/s [HS-2014].
2. **Latency:** 50ms render budget ("we strive to maintain 50ms" [2013]); actuals 2016: question pages 22.71ms avg, homepage 11.80ms [Arch-2016].
3. **Scale shape:** HTTP tier read-dominated (page loads), but at the store: "40:60 read-write ratio... 60% of our database disk access is writes" [2013]; "The entire database is cached in-memory. The entire thing." [HS-2014].
4. **Availability:** no published SLA. "Move fast and break things. Push it live." Full DC failover drills "every 2 months or so" [HS-2014]; routine deploys take 2 of 9 web servers offline [Deploy-2016]. Relaxed stance, on the record.
5. **Consistency:** SQL is "single source of truth"; "All replicas are asynchronous" including DR [Arch-2016]; logged-in pages rendered real-time, "caching only for anonymous users" [HS-2014]. (Async-only DR = an accepted RPO > 0 on datacenter loss — consistent with the relaxed stance.)
6. **Compliance/audit:** no compliance, audit, or replay statements in any source (absence noted).
7. **Team/deploys:** ~15 people pushing to the repo [Deploy-2016]; 5-10 production deploys/day, full deploy under 9 minutes [Deploy-2016]; core Q&A dev team ~6-7 + SRE 5 (2014) [HS-2014].
8. **Cost stance (loud and explicit):** "Hardware is cheaper than developers and efficient code"; cloud specs "aren't available... not at reasonable prices"; web tier at 5-15% CPU [2013, HS-2014].
9. **Geo/multi-X:** NY primary + Colorado DR over 10Gbps MPLS [Arch-2016]; serves the world from one DC; no residency constraints published.
10. **Divergent workload shapes:** tag matching = "complicated queries based on tags... a huge in-memory struct array... optimized for SO use cases" [HS-2014], 3.66M requests/day, index reload ~2 minutes [Arch-2016]; full-text search 17.2M searches/day, offloaded because "SQL CPUs are comparatively very expensive, Elastic is cheap" [Arch-2016]; ~500K concurrent websockets at peak [Arch-2016]; Redis 5.8B hits/day "below 2% CPU" [Arch-2016].

## The derivation (each step cites an answer)

Start at the null vector: *single deployable / direct / unified / current-state / single shared store*.

**Deployment.** ~15 committers, uniform 5-10×/day cadence for everyone, explicit ops-cost ceiling (#7, #8). No release-independence demand, no blast-radius demand (the availability stance tolerates two servers out at every deploy). Nothing presses. **Single deployable, N identical instances.** The instances are capacity/redundancy, not architecture.

**Persistence — the step my prediction got wrong.** The HTTP tier is read-dominated, and the reflex is "read replicas." The answers refuse it: the store's ratio is 40:60 read:write (#3), and the entire database is cached in memory (#3) — the primary *contains* the read demand outright. What the answers do press is availability-of-data (failover drills, DR site, #4, #9) — a *redundancy* demand, not a read-scaling demand. Cheapest containing mechanism: an HA replica that serves failover, not traffic; async to Colorado, because the accepted RPO > 0 (#5) permits async and async is cheaper. **Single shared store + HA replica (availability mechanism, not a read/write-model move).**

**Vertical containment as a first-class move.** The 50ms budget (#2) at 3,000 req/s peak (#1) is contained without any axis move because they sized the null position instead: RAM to hold the whole DB, servers idling at 5-15% CPU. Their cost stance (#8) is the selection rule stated as a company value: buying hardware for the cheapest position is cheaper than paying the ongoing mechanism costs of any axis move. **Hardware is a containment mechanism; the ledger must price it as the alternative to every split.**

**Scope splits — where divergence is real.** Two workloads have shapes the web tier's (stateless render) cannot contain:
- Tag matching (#10): a giant in-memory index with a 2-minute reload — divergent state shape + divergent lifecycle. Rule 3 at the narrowest scope: **split the tag path out as its own component** (a handful of dedicated instances; redundancy, not load).
- Full-text search (#10): inverted-index access shape, and an explicit cost citation ("SQL CPUs expensive, Elastic cheap") — the ledger's polyglot entry verbatim: **store shaped to the read, at the search scope only.**

Nothing else diverges: 500K websockets and 5.8B cache hits/day are contained by the existing tiers (#10 — Redis at 2% CPU).

**Read/write model.** Logged-in reads render from the source of truth → read-your-writes free (**unified**); anonymous pages accept bounded staleness via caching at that scope only (#5). A separated read model would buy nothing the cache doesn't already provide — same replicas-vs-projection comparison as P2, one rung cheaper: **cache before replicas before projections.**

**Storage.** No audit, no replay, no compliance demand anywhere (#6) → **current-state**, with roll-forward idempotent migrations ("Why roll back when you can roll forward?" [Deploy-2016]) — a forward-recovery posture at the operational level.

**Substrate.** One deployable, tight latency, no lag-tolerant cross-boundary facts → **direct**, with one narrow event mechanism where a fact genuinely fans out: cache-invalidation pub/sub (L1 invalidation via Redis) — scoped, not a substrate move.

**Derived vector:** *single deployable (N instances) + two component splits (tag, search) / direct + scoped pub/sub for invalidation / unified with anonymous-scope caching / current-state / single shared store with async HA replica + polyglot at the search scope + in-memory at the tag scope / forward-recovery ops posture.*

## Comparison against the known outcome

| Derived | Actual (Section B of research) | Match |
|---|---|---|
| Single deployable, N instances | 9+2 IIS servers, one .NET monolith (~110K LoC, 9 projects) | ✓ |
| Two splits: tag path, search | Tag Engine on 3 dedicated servers; Elasticsearch 3/DC | ✓ both, and only these |
| Single shared store, HA replica not read-scaling | SQL clusters: "1 master (taking almost all of the load) + 1 replica" AlwaysOn, async DR | ✓ including the load distribution |
| Unified + cache (no projections) | Redis L2 + local L1, no separated read models | ✓ |
| Current-state, roll-forward | Relational source of truth, roll-forward migrations | ✓ |
| Direct + scoped invalidation pub/sub | Direct calls; Redis pub/sub for L1 invalidation | ✓ |

**Every axis matches, including the splits' exact count and location, and including the detail my prediction got wrong.**

## Findings

- **F11 — the answers beat the prior.** My pre-registered prediction said "read replicas"; the derivation, run against the actual answers (40:60 ratio, DB-in-RAM), correctly does NOT produce them — the real replica is an HA mechanism. The failure was in the prediction (a taste-shaped prior: "read-heavy site → read replicas"), not in the method. This is the article's thesis eating its own author, and it belongs in the writeup verbatim.
- **F12 — vertical sizing is a containment mechanism the ledger must price.** "Buy RAM/CPU for the null position" competes with — and here beats — every axis move. Ledger v0.2: add hardware sizing as a sub-mechanism under the null values, with its own ceiling (it stops working when the working set or write rate outgrows one box's economics).
- **F13 — cache slots into the containment chain:** cache → replicas → separated model. The unified entry's sub-mechanism list grows by one rung.
- **F14 — scale shape must be stated per tier.** "Read-heavy" was true at HTTP and false at the store (40:60). One more reason the book bans bare -ilities: the same system is read-heavy and write-majority simultaneously, at different scopes.
- **Score:** six derivations reproduced, first external one. The counterintuitive outcome (a "boring" monolith at 209M requests/day, with exactly two earned exceptions) is precisely the shape that makes the strongest article: the method reproduces restraint, not just architecture.

## Next candidates

Shopify pod sharding (write-scaling with a natural partition key — exercises the sharded value the other runs never touched); Discord read path (the opposite corner: genuine read-model separation). One derivation per article keeps each self-contained.
