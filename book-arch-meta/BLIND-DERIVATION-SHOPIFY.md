# Blind Derivation 2 — Shopify (pod era, ~2015-2021) from published answers

**Protocol:** as `BLIND-DERIVATION-SO.md` — every step cites a published answer; comparison with the known outcome only at the end; predictions pre-registered in `BLIND-DERIVATION-PREDICTIONS.md` (2026-07-07), graded below. Sources: [Tech Stack](https://shopify.engineering/e-commerce-at-scale-inside-shopifys-tech-stack), [Pods](https://shopify.engineering/a-pods-architecture-to-allow-shopify-to-scale), [Flash-I](https://shopify.engineering/surviving-flashes-of-high-write-traffic-using-scriptable-load-balancers-part-i), [Flash-II](https://shopify.engineering/surviving-flashes-of-high-write-traffic-using-scriptable-load-balancers-part-ii), [Deconstructing](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity), [Under-Deconstruction](https://shopify.engineering/shopify-monolith), [Storefront](https://shopify.engineering/how-shopify-reduced-storefront-response-times-rewrite), [InfoQ](https://www.infoq.com/presentations/shopify-architecture-flash-sale/), [BFCM-2021](https://shopify.engineering/cloud-load-modular-code-shopify-2022), [Capacity](https://shopify.engineering/capacity-planning-shopify), [Merging-1000](https://shopify.engineering/successfully-merging-work-1000-developers).

## The answer sheet (published demands only)

1. **Traffic:** 80K req/s peak, 600K merchants (2018) [Tech Stack]; BFCM 2021: 32M app-server req/min, 11M queries/s, 11 TB/s read I/O [BFCM-2021].
2. **Flash-sale shape:** celebrity merchants "hurl Super Bowl-sized traffic, often without notice... Black Friday not every year but every seven or eight days" [Flash-I]; a product "can sell out in seconds, even if there are thousands of items in inventory" [InfoQ]; one sale used 20%+ of total compute.
3. **The blast-radius incident (a demand stated as an outage):** Feb 2016 Kylie sale "took down not just her store, but all others on the database shard" [Flash-I].
4. **Latency:** server processing under 200ms "satisfying" [Storefront].
5. **Availability stakes:** "absolutely vital to avoid anything that would put our merchants at risk of downtime" [Capacity].
6. **Consistency/compliance:** PCI — "we keep the Shopify monolith out of scope. We just don't let it see any card data" [InfoQ]; payments "we want exactly-once semantics" [InfoQ]; oversell prevented by reserving inventory during payment [InfoQ / reservations retrospective].
7. **Multi-tenancy (the shape gift):** "Shopify merchants are isolated from each other" [Tech Stack]; no cross-shop actions needed.
8. **Team/deploys:** 1000+ developers, 2.8M lines, ~400 commits/day, deployed "around 40 times a day" — one uniform train [Deconstructing, Under-Deconstruction, Merging-1000, InfoQ].
9. **Cost:** can't pre-provision "for sales that might not happen" [Capacity].
10. **Read/write shape, two divergent paths:** checkout is write-concentrated ("every step in the flow modified that same record" [Flash-I]); storefront is read-dominant and staleness-tolerant [Storefront].
11. **Geo:** active + recovery DC per pod scope; no residency demands published.

## The derivation (each step cites an answer)

**Persistence.** 11M queries/s and 11 TB/s read I/O (#1) is past any single store's economics (F12 ceiling). The demand set carries a natural partition key: shops are isolated from each other, cross-shop actions don't exist (#7). → **sharded on the shop.**

**Blast radius widens the shard.** The 2016 incident (#3) plus per-merchant downtime stakes (#5) demand that one tenant's burst cannot reach another tenant. A store-only shard leaves shared caches, queues, and workers as cross-tenant failure paths. Cheapest value containing the demand: widen the shard boundary to the **full stack — every shard is a complete, isolated instance of the system** (stores, caches, queues), with nothing allowed to act across shards. Volume-sharding and blast-radius demands compound into cells.

**Deployment.** 1000+ developers press for ownership; ops-cost and a deliberately uniform 40-deploys/day train press against deployment fragmentation (#8). Same-scope tension → decompose the demand (F2): ownership is demanded, release independence is not — everyone rides one train by choice. → **modular monolith with enforced module boundaries.** This is the regional-platform resolution at 20× the team size.

**Flash-sale contention.** A drop sells out in seconds with every checkout step hitting the same records (#2, #10) — write contention concentrated inside one shop, which already owns a whole cell. More sharding cannot help: the contention is within one tenant. → **admission control at the edge**: throttle and queue *before* the app tier, fair ordering, burst never reaches the contended records. The ticketing on-sale rule at industrial scale.

**Read/write model.** The storefront read path (#10): read-dominant, staleness-tolerant, 11 TB/s — a primary cannot contain this (unlike Stack Overflow's RAM-contained reads). Next rungs of the containment chain: **caching + read replicas at the storefront scope only**; checkout stays on the primary, unified and strict. No projections — the reads are the write shape at higher volume, so the chain stops at replicas (F13 choosing a different rung than SO, correctly, from different answers).

**Compliance by scope exclusion.** PCI (#6) is contained not by hardening the monolith but by **splitting the card path out so the monolith never sees card data** — shrinking where the demand applies is the cheapest containing move for a prune-mode demand.

**Storage & recovery.** No replay/audit mandate (#6 handled by exclusion) → **current-state**. Oversell (#6): reservation during payment = a hold — **design-out** (double-sell made structurally impossible), with expiry as decay. Money movements: defined inverses (refund, void) → **BER**. "Exactly-once" (#6) read through the consistency lens: idempotency + reservation + compensation, which is what the mechanism can actually earn.

**Substrate.** Direct within the monolith; background jobs/webhooks async at the edges; everything pinned inside one pod (isolation preserved end-to-end).

**Derived vector:** *modular monolith + full-stack shop-sharded cells + card-path split / direct within, async jobs at edges, pod-scoped / unified with cache+replica rungs at storefront scope / current-state / sharded per-cell stores / design-out (reservations) + BER (money) + edge admission control for contention.*

## Comparison against the known outcome

| Derived | Actual | Match |
|---|---|---|
| Modular monolith, enforced boundaries | "We chose to evolve Shopify into a modular monolith"; 37 components; services rejected for complexity | ✓ their words |
| Full-stack cells sharded by shop | Pods: "a fully isolated instance of Shopify with its own datastores — MySQL, Redis, memcached"; "we don't allow any actions to reach across pods"; 100+ pods | ✓ exact, including the no-cross-pod rule |
| Edge admission control for flash contention | Leaky-bucket throttle in Nginx/Lua, queue page cached at the edge, signed-cookie fair ordering | ✓ mechanism-level |
| Cache + replicas at storefront scope, checkout on primary | Storefront "always reads from dedicated read replicas" + full-page caching | ✓ |
| Card-path split (PCI scope exclusion) | Monolith kept out of PCI scope, never sees card data | ✓ |
| Async jobs at edges, pod-pinned | Resque fork on Redis, jobs pinned per pod | ✓ |
| Current-state; design-out reservation + BER money | Relational MySQL; Redis-based inventory reservations | ✓ |

**Prediction grades:** all HIT — modular monolith, shop-sharded full-stack pods doubling as blast-radius isolation, admission-control-not-sharding for the drop, direct+async substrate, unified, current-state, BER money. One detail I under-predicted: the reservation/hold as explicit design-out (I said only "BER for checkout money"). Partial credit noted.

## Findings

- **F19 — cells are the sharded value at full-stack scope.** When volume-sharding compounds with blast-radius demands, the shard boundary widens: store-only → store+cache+queue → complete cell. Ledger v0.2 note under *sharded*.
- **F20 — compliance by scope exclusion.** A prune-mode demand can be contained by narrowing where it applies (split the card path; the monolith exits PCI scope) before any axis hardening. Cheapest-containing-move applies to the *demand's scope*, not just the axis value.
- **F21 — the modulith holds at 1000 developers.** Team size alone never presses deployment topology; only release-cadence divergence does. With Discord (4 engineers) and Shopify (1000+) both deriving to monoliths from opposite extremes, "team size forces microservices" is dead on public data. F2's ownership-vs-release-independence decomposition now spans three orders of magnitude.
- **F15 cross-confirmed:** write-side admission (leaky bucket) here, read-side coalescing at Discord — the contention rule is side-symmetric with two industrial instances.
- **F13 cross-validated:** the containment chain stops at a different rung per answers — RAM at SO, replicas at Shopify, coalescing at Discord — and each stop is forced by citations, not taste.
