# Ch. 5 material — Budget arithmetic

*Assembled 2026-07-11. The emptiest chapter gets its numeric teeth. Sources: DRY-RUN-TICKETING (P1–P3 answers), BLIND-DERIVATION-SO (the inert case), PROCESS-DESIGN candidate 11, LEDGER v0.2 (chain costs). Discipline: numeric teeth without becoming DDIA — every number serves a derivation step, none is universal.*

## The four rules

1. **Latency budgets decompose downward.** An operation's budget is spent by its critical path: sequential steps add, parallel branches cost their max, every network hop pays an RTT floor, every cross-region hop pays a geography floor. The select-mode trigger is arithmetic: latency presses only when target ÷ floor approaches 1.
2. **Tails don't add — they multiply through the distribution.** Percentiles compose through the whole distribution, not through the percentile. Two consequences with teeth:
   - *Sequential:* the chain is slow if any step is slow — slow-fractions add (union bound). Holding a 5-step chain at P99 gives each step ≈ a 0.2% slow allowance, not its own P99. **Tail budgets divide like error budgets; means add like costs.**
   - *Fan-out:* wait-for-all over N shards is governed by the slowest. At 100-way fan-out, per-shard P99 = 10 ms means 1 − 0.99¹⁰⁰ ≈ **63% of requests see at least one shard beyond its P99**. Fan-out doesn't dilute the tail; it harvests it. (The arithmetic behind hedged requests, request coalescing, and partition-count restraint.)
3. **Envelopes compose upward.** A subsystem's capacity envelope is derived from its workflows': steady loads add; peaks add only when **correlated** (the on-sale burst hits quote+hold+pay together; reporting close and pay-run may anti-correlate by calendar — the calendar is envelope input, F8's other face).
4. **Availability multiplies down a chain; independence must be earned.** Series: five components at 99.99% compose to 0.9999⁵ ≈ 99.95% — a 99.99% path *cannot* be a series of five 99.99% parts (see example B). Parallel: two independent 99.9% paths give 1 − (10⁻³)² = 99.9999% — *if* independent, and shared deploys, certs, regions, and configs are why the parallel arithmetic lies. Redundancy arithmetic is honest only after blast-radius isolation makes the failure terms independent — the numeric argument *for* isolate-mode moves and cells.

## Example A — P3's contractual 200 ms P99, decomposed downward

Multi-region product; suppose the data's home region is not the reader's. One cross-region round trip costs ~80–150 ms of pure geography — half to three-quarters of the entire budget spent on physics before any work happens, at the *median*, and P99 includes the bad days. Target ÷ floor ≈ 1.3–2.5 → select-mode presses hard. The decomposition forces the conclusion mechanically: **the read must be served in-region** — replicate or project data to every region where the SLO is sold. Within a region the same budget re-decomposes (edge ≈ 1–5 ms, service work ≈ 10–20 ms, store read under storm ≈ 20–50 ms at P99, tail headroom ≈ the rest) and survives. This is P3's read-path split, previously narrated — now *computed*. The consistency price (bounded staleness, RYW mechanism per LEDGER) is what the arithmetic buys; #4's answer decides whether it may.

## Example B — the availability ladder, composed upward

- **P1, 99.5%** = 43.8 h/year of budget. A single node with a restart story fits inside it with room to spare — *the arithmetic is why the driver is inert*, and the null position survives by numbers, not vibes.
- **P2, 99.9%** = 8.77 h/year. Still restart-shaped, but a bad dependency or long store recovery starts to threaten it — isolate-mode begins pricing failure domains.
- **P3, 99.99% on the read path** = 52.6 min/year. Series arithmetic (rule 4) kills any 5-deep chain of merely-99.99% parts (≈ 99.95%, 5× over budget). The options the arithmetic leaves: shorten the chain (fewer serial parts — thin tiers are axis-invisible but still count in series math), or buy honest parallelism (independent serving paths, isolated blast radii — in-region replicas/projections again, from the availability side this time). **The same in-region serving that example A derived from latency, B derives from availability — convergent forcing is what "over-determined" looks like in numbers.**

## Example C — the on-sale burst envelope (shape beats headline)

P3's on-sale: 10⁵+ attempts/min against a handful of seats. The naive envelope sizes the write path at ~1,700 writes/s. The shape arithmetic: successful outcomes are bounded by *seats* — with 10³ seats, ≥99% of attempts are structurally futile writes. Capacity follows the shape:
- **Edge/admission**: absorbs the full 10⁵/min — stateless, cheap, fast-fail/queue (contention's containing mechanism, never sharding: a second copy of the seat helps nobody).
- **Contended core**: sized to seat *throughput* — tiny; the transition serializes at the seat regardless of fleet size.
- **Fan-out (notifications, availability updates)**: sized to attempts, absorbed by the event substrate's buffer (burst shape, rule 3's correlated peak).

One headline number, three different envelopes. Sizing the store for the headline buys nothing the derivation asked for — the demand-shapes vocabulary (LEDGER v0.2) doing arithmetic.

## Example D — the inert contrast (SO, the hardware rung's numbers)

50 ms budget at 3,000 req/s peak, working set in RAM: in-process call floors are microseconds, local-RAM reads likewise; target ÷ floor ≈ 10³–10⁴. Nothing presses; the whole demand is contained by *sizing the null position* (F12). The same arithmetic that forces P3's splits proves SO's non-splits — a derivation says no with numbers in both directions.

## The seams

- **Ch. 2 (fake nines):** the arithmetic is the pricer — "99.99% because it sounded right" becomes "52.6 min/year: name the on-call rotation, the redundancy, and the correlated-failure work that buys it, or lower the number." *An SLO you haven't priced is a wish* — this chapter is where the price list lives.
- **Ch. 12 (bare means):** "average 100 ms" hides everything rules 1–2 operate on; ban bare means, budget shapes.
- **Verification (ch. 5's other half / ch. 4 alt-placement):** the decomposition run in reverse is the pre-build check — sum the floors along the critical path; if the answer doesn't fit, the vector is wrong *or the answer was fake*, before anything is built.
