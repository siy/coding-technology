---
title: "Three Famous Architectures, Derived Blind"
description: "Stack Overflow, Shopify, Discord: from their published numbers to their actual systems, every step cited"
tags: [architecture, backend, softwaredesign, programming]
published: false
---

# Three Famous Architectures, Derived Blind

*The derivation from the last article, tested against systems I didn't build*

The [previous article](https://dev.to/siy/how-architecture-emerges-1b9) made a claim that deserves to be attacked: architecture can be derived from answers instead of chosen by taste. I ran the derivation on a small worked example and invited counterexamples.

An invitation is not a test. The worked examples in that article are mine; a derivation validated only against its author's own examples is self-graded homework. So here is the external test: take three famous systems that publish their numbers, derive their architectures from the published answers alone, and compare against what they actually run. The outcomes were not chosen by me, and two of them are counterintuitive.

The protocol, honestly stated: these architectures are famous, nobody derives them from ignorance. The discipline is different. Every derivation step must cite a published input, never the known outcome, and the comparison happens only at the end. Predictions were written down before collecting the sources, so misses are on the record next to hits.

## The toolkit, in brief

Eleven questions establish what the system must satisfy: **Q1** latency, **Q2** throughput, **Q3** availability, **Q4** consistency contract per data class, **Q5** durability, **Q6** compliance, **Q7** technology mandates, **Q8** deploy frequency and team cadence, **Q9** cost shape, **Q10** multi-X (country, currency, tenant, region), **Q11** scale shape.

Six axes describe the architecture: deployment topology, composition substrate, read/write model, state storage, persistence, recovery.

Four rules connect them. **R1**: start at the cheapest position on every axis. **R2**: move an axis only when an answer is not contained by the current position; contained answers are inert. **R3**: when you must move, take the cheapest value that contains the demand, at the narrowest scope that contains it. **R4**: when two answers press one axis in opposite directions, the system splits at the boundary between them.

## Stack Overflow, 2016

The answer sheet, from Nick Craver's engineering posts and High Scalability:

- **Q2**: 209M HTTP requests/day, 66M page loads/day; weekday peaks around 2,600-3,000 req/s.
- **Q1**: 50ms render budget; question pages actually at 22.71ms average.
- **Q11**: read-dominated at the HTTP tier — but at the store, read:write is 40:60, and "the entire database is cached in-memory. The entire thing."
- **Q3**: no published SLA; scheduled datacenter failover drills; deploys routinely take 2 of 9 web servers offline.
- **Q4/Q5**: SQL as "single source of truth"; all replicas asynchronous, including disaster recovery — an accepted small loss window.
- **Q6**: no compliance, audit, or replay statements anywhere (absence noted).
- **Q8**: ~15 people pushing to one repo; 5-10 production deploys/day.
- **Q9**: stated as a company value: "hardware is cheaper than developers and efficient code"; web tier at 5-15% CPU.
- **Q11, special shapes**: tag matching runs on "a huge in-memory struct array" with a ~2-minute index reload; full-text search moved off SQL because "SQL CPUs are comparatively very expensive, Elastic is cheap."

The derivation:

- **Deployment topology → single deployable, N identical instances.** Inputs: Q8 (15 committers, one uniform cadence), Q3 (deploys taking servers out is routine), Q9. R2: nothing demands independent releases, independent scaling, or isolated failure domains — nothing presses.
- **Persistence → single shared store, plus an async HA replica.** Inputs: Q11 (40:60 at the store; whole DB in RAM — reads contained at the primary), Q3 (failover drills demand redundancy), Q5 (async acceptable). R2 says reads force nothing; R3 picks the cheapest containing mechanism for the availability demand: a replica that serves failover, not traffic.
- **Two scope splits → tag engine, full-text search.** Inputs: Q11 special shapes (an in-memory index with an expensive reload; an inverted-index access pattern with a cost citation). R4: these two workloads press against the web tier's stateless render shape; each splits at its own boundary. R3: narrowest scope — the search store is shaped to the read (polyglot) for that path only.
- **Read/write model → unified, with caching.** Inputs: Q4 (logged-in pages render from the source of truth: read-your-writes free), Q11. R2: no separate read SLO, no divergent read shape — a projection would contain nothing the cache doesn't.
- **State storage → current-state.** Input: Q6 (no audit or replay demand exists). R2: nothing presses.
- **Recovery → forward posture.** Input: their deployment doctrine, "why roll back when you can roll forward" — idempotent roll-forward migrations.

Derived vector: a monolith on identical instances, one store with a failover replica, cache, and exactly two split-out components. The actual 2016 architecture: a .NET monolith on 9 (+2) web servers, one SQL Server master "taking almost all of the load" with an availability-group replica and an async DR copy, Redis as cache, a Tag Engine on 3 dedicated servers, Elasticsearch on 3. Every axis matches, including the two splits and their exact locations.

Now the instructive part. General intuition says a Q&A site must be read-heavy, so its storage must be read-scaled — replicas serving traffic. Reality appeared different: write-majority at the store, reads contained by RAM, and the only replica in the building serves failover. **The method caught the wrong assumption**: intuition pattern-matches on "read-heavy site," the derivation is forced to cite the store-level answer and cannot make that mistake. (The pull of that intuition is strong enough that "read replicas" made it into my own prediction sheet, written before the sources were collected. The derivation refused it.)

## Shopify, pod era

The answer sheet, from Shopify Engineering:

- **Q2**: 80K req/s peak across 600K merchants (2018); by BFCM 2021, 11M database queries/s and 11 TB/s of read I/O.
- **Q11, burst shape**: celebrity sales "hurl Super Bowl-sized traffic, often without notice... like Black Friday not every year but every seven or eight days"; a product "can sell out in seconds, even if there are thousands of items in inventory."
- **Q3, stated as an incident**: a 2016 flash sale "took down not just her store, but all others on the database shard"; "absolutely vital to avoid anything that would put our merchants at risk of downtime."
- **Q10**: 600K isolated tenants — "Shopify merchants are isolated from each other"; cross-shop actions don't exist.
- **Q6**: PCI, handled by a stated trick: "we keep the Shopify monolith out of scope. We just don't let it see any card data." Oversell prevented by reserving inventory during payment.
- **Q8**: 1000+ developers, 2.8M lines, ~400 commits/day, one train deploying ~40 times/day.
- **Q9**: can't pre-provision "for sales that might not happen."
- **Q11, two path shapes**: checkout is write-concentrated ("every step in the flow modified that same record"); the storefront is read-dominant and staleness-tolerant.

The derivation:

- **Persistence → sharded by shop.** Inputs: Q2 (volume past any single store), Q10 (a natural partition key: tenants are isolated, nothing crosses shops). R3: the cheapest value containing the volume, on the key the domain hands you.
- **The shard widens to a full-stack cell.** Inputs: Q3 (the 2016 incident is the blast-radius demand stated as an outage — one tenant's burst must not reach another). R2: a store-only shard leaves shared caches, queues, and workers as cross-tenant failure paths; the demand is uncontained. R3: widen the shard boundary until it contains it — each shard becomes a complete, isolated instance of the system, and nothing acts across shards.
- **Deployment topology → modular monolith.** Inputs: Q8 (1000+ developers press for ownership; the deliberately uniform 40-deploy train presses against fragmentation). R4's precondition fails: both pressures attach to the same scope, so decompose the demand instead — ownership is demanded, release independence is not. Module boundaries, one deployable.
- **Flash-sale sellout → admission control, not sharding.** Inputs: Q11 burst shape (every checkout step hits the same records inside one shop — which already owns a whole cell). This is contention, not volume: no amount of redistribution helps when the fight is over the same rows. R3: contain it at the edge — throttle and queue before the app tier sees the burst.
- **Read/write model → unified, with cache and replicas at the storefront scope only.** Inputs: Q11 two path shapes, Q2 (11 TB/s of reads outgrows any primary — unlike Stack Overflow). R3 at narrowest scope: the storefront path gets caching plus read replicas; checkout stays strict on the primary.
- **Compliance → contained by scope exclusion.** Input: Q6. R3 applied to the demand's own scope: split the card path out, and the monolith exits PCI scope entirely — cheaper than hardening 2.8M lines.
- **Storage → current-state; recovery → design-out + compensation.** Inputs: Q6 (no replay mandate; oversell designed out via reservations — double-selling made structurally impossible), money keeps its defined inverses (refund, void).

Derived vector: a modular monolith running in fully isolated shop-sharded cells, edge admission control for drops, replicas and caches on the storefront path only. The actual architecture: "we chose to evolve Shopify into a modular monolith" (services rejected: they "increase the overall complexity considerably"), 100+ pods, each "a fully isolated instance of Shopify with its own datastores like MySQL, Redis, memcached," a hard no-cross-pod rule, and flash sales absorbed by a leaky-bucket throttle at the edge with a cached queue page. Match on every axis, down to the mechanism.

## Discord, 2017-2023

The answer sheet, from Discord's engineering blog:

- **Q2**: 100M messages/day (2016) growing to 4B/day and ~2M database requests/s (2022); trillions stored.
- **Q5, by product identity**: "we decided early on to store all chat history forever" — voluntary, and it presses as hard as any regulation.
- **Q11**: reads "extremely random," hot recency in big channels ("requesting messages sent in the last hour... often"); by 2022, disk reads outnumber writes more than 10:1.
- **Q1**: p95 API alert at 80ms; sub-5ms reads desired.
- **Q11, fan-out shape**: 5M concurrent websocket users (2017), millions of presence events/s; one guild alone with 30K concurrent users.
- **Q4**: availability explicitly preferred over strong consistency; conflicts resolved last-write-wins; per-channel ordering via sortable IDs.
- **Q3/Q9**: "tolerate a loss of nodes," "we do not want to manually re-shard," and a team of 4 backend engineers with no dedicated DevOps.
- **Q11, the pathology**: "high traffic to a given partition resulted in unbounded concurrency, leading to cascading latency" — the hot channel.
- **Q6**: absent (noted).

One registered bet this time: before collecting sources, I wrote down that my own earlier description of Discord's read path as "read-model separation" was probably wrong, and that the answers would show a coalescing layer over a unified store instead of CQRS.

The derivation:

- **Persistence → sharded on channel, time-bucketed.** Inputs: Q2 + Q5 (trillions of rows forever — past any single store's economics), Q3/Q9 (node-loss tolerance, no manual resharding, four engineers), Q11 (reads are per-channel recency: the key is given). R3: sharded on the channel; the time bucket is the mechanism that bounds partition size.
- **Store shaped to the read.** Inputs: Q11 (time-descending scans per channel, millions/s), Q1. R3: a log-structured wide-column store fits the read shape; polyglot at the message scope.
- **Deployment topology → gateway split; the API stays a monolith.** Inputs: Q11 fan-out shape (millions of long-lived stateful connections — a different resource shape, scaling dimension, and lifecycle than request/response). R4: split at that boundary. R2 for the rest: nothing presses to decompose the API — Q8's four engineers press hard the other way.
- **Hot channel → coalescing, not redistribution.** Inputs: Q11 pathology. Contention again, this time on the read side: identical concurrent reads concentrate on one partition, and one partition has one home. R3: deduplicate identical in-flight reads keyed by channel, in a thin layer with no business logic. The reads want the same rows — **read/write model stays unified**; no projection contains anything here.
- **Storage → current-state, append-shaped; recovery → design-out + decay.** Inputs: Q6 absent (no replay mandate), Q4 (upserts + last-write-wins: write conflicts reshaped so they cannot matter), presence ephemeral and re-derivable — it decays instead of compensating.

Derived vector: API monolith plus a gateway tier, channel-sharded wide-column storage, a coalescing layer over unified reads, design-out writes, decaying presence. The actual architecture: an Elixir gateway tier of session and guild processes; "our API monolith" (their words, 2023); storage partitioned as ((channel_id, bucket), message_id); and Rust "data services" that "intentionally contain no business logic," one gRPC endpoint per database query, coalescing requests by channel ID. Not CQRS — a containment layer over a unified store. The registered bet graded: the earlier intuition was wrong, the answers were right.

One more thing falls out of the vector view. Discord migrated MongoDB→Cassandra in 2017 and Cassandra→ScyllaDB in 2022. The first moved an axis (single store → sharded wide-column): an architecture project. The second moved nothing — same position on every axis, different product occupying it: procurement with a careful cutover. The derivation predicts which migrations are which before anyone schedules them.

## What three systems said together

- **Contention is never solved by sharding, and it is symmetric.** Shopify's flash sale is write-side contention, absorbed by admission control at the edge. Discord's hot channel is read-side contention, absorbed by coalescing in front of the store. Same rule both times: distinguish contention from volume, contain it, never redistribute it. One seat has one winner; one partition has one home.
- **The read-containment chain stops where the answers say, not where fashion does.** Cache, then coalescing, then replicas, then projections. Stack Overflow stops at RAM. Discord stops at coalescing. Shopify walks to replicas. None of the three reaches projections, because in none of them do reads have a different shape than writes. Three systems, three different rungs, each stop cited.
- **Team size never pressed deployment topology.** Four engineers derived to a monolith plus one split. Fifteen to a monolith plus two. A thousand-plus chose a modular monolith on purpose, with the strongest anti-services words in the whole corpus. What presses topology is release-cadence divergence and blast radius — never headcount.

Three for three, with one wrong intuition caught on my side and zero on the derivation's. That is not proof — three systems is three systems, all consumer-scale platforms with generous public documentation. But it is no longer self-graded homework, and the standing invitation from last time applies with sharper teeth: run the eleven questions on your system, walk the axes, and if the derivation produces something absurd, bring it. A method improves on counterexamples, not on applause.

The derivation itself — the questions, the axes, the rules, and worked examples at three scales — is the Architecture Synthesis method from [Process-First Design](https://leanpub.com/process-first-design). The condensed edition is free and reads in about thirty minutes.
