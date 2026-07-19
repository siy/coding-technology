# Verification

A contract lands: quotes served in 200 milliseconds at P99, in-region, in every region the platform sells. The team celebrates the deal and files the number as a requirement. Nobody runs the arithmetic that would have taken ninety seconds: the platform masters its data in one region, a cross-region round trip costs 80 to 150 milliseconds of geography before any software runs, and P99 includes the bad days. Half to three-quarters of the entire budget is spent on the speed of light — at the *median*. The number was signed as a business term and it is an architecture verdict: either the data is served from every region where the promise was sold, or the promise is broken on the day it is tested. There is no third state, and no amount of engineering effort inside the wrong architecture reaches one.

A derived vector is a set of claims — this guarantee, from this mechanism, inside this budget — and Part I closes with the instrument that checks them. Verification is the exit gate of every derivation, and it earns its keep twice: it catches wrong vectors before they are built, and it catches fake answers that survived the entry gate, because a fake answer is often easiest to expose by pricing what it would take to honor it.

## The consistency lens

The first check is qualitative and per operation: for every operation that matters, state the **guarantee** it holds under the derived vector, the **mechanism** that earns the guarantee, and the **behavior under failure**. Three columns, no exceptions, and the discipline is entirely in the second column: **a guarantee with no mechanism is a lie the system will eventually tell at the worst moment.** "Bookings are strictly consistent" — through what? Single-store transactions: earned. "Read-your-writes for the seller's own view" — through what? If the reads land on lagging replicas and nobody can name the session-pinning mechanism, the vector is wrong or the answer was decoration.

The lens also enforces a vocabulary rule on the system's own documentation: one-bit labels are banned outputs. A system is never "strongly consistent" or "highly available" in its own description — a specific operation holds a specific guarantee through a specific mechanism and degrades in a specific way. Systems described at one bit get defended at one bit, and one-bit defenses are how outages get explained to customers after the fact rather than to engineers before.

The failure column does quiet work that deserves notice: it is where the recovery axis's choices become visible per operation. An operation whose failure behavior cannot be stated has not chosen a recovery class; it has chosen surprise.

## Budget arithmetic

The second check is quantitative, and five rules cover what a derivation needs. None requires more than arithmetic — four of them not even that much — and all five are routinely skipped.

**Rule 1 — latency budgets decompose downward.** An operation's budget is spent by its critical path: sequential steps add, parallel branches cost their maximum, every network hop pays a round-trip floor, every cross-region hop pays geography.

*path floor = Σ sequential floors + max(parallel branch floors) · software budget = target − path floor*

The verification move is subtraction, and the chapter's opening contract is the whole worked example: target 200 ms; cross-region geography 80–150 ms; software budget 50–120 ms — for every hop, queue, store lookup, and serialization on the path, at the *median*, with P99 still owed the bad days. Those are the ninety seconds nobody ran. When target divided by floor approaches one, the select-mode driver from Chapter 2 is pressing — and when the floors alone exceed the target, the vector is wrong regardless of implementation quality. Physics decides whether the number is reachable; production only proves whether you reached it.

**Rule 2 — tails compose through the distribution.** The instinct is that a chain of five steps, each at P99 100 milliseconds, gives a chain P99 of 500. The truth is worse in the direction nobody budgets for: sequentially, the chain is slow when *any* step is slow.

*series: slow-fractions add, P(chain slow) ≈ p₁ + p₂ + … + pₙ, so a chain of n steps held to allowance p grants each step ≈ p/n · wait-for-all fan-out over n shards: P(at least one past its P99) = 1 − (1 − p)ⁿ*

Five steps each allowed to be slow 1% of the time produce a chain slow about 5% of the time — holding the five-step chain at P99 grants each step roughly a 0.2% allowance, a fifth of what its own P99 promised. Tail budgets divide like error budgets; means add like costs. Fan-out is crueler: a hundred shards at per-shard P99 of 10 milliseconds means 1 − 0.99¹⁰⁰ ≈ **63% of requests wait on at least one shard beyond its P99**. Fan-out harvests the tail rather than diluting it: the arithmetic behind request hedging, behind the coalescing rung, and behind restraint in partition counts. One caveat travels with both formulas: they assume independent slowness, and production correlates it — a shared garbage collector, a shared host, a deploy wave slow everything together. Correlation makes the sequential arithmetic kinder and the fan-out numbers optimistic; treat the independent-case results as bounds and budget for correlation the way rule 3 does explicitly.

**Rule 3 — envelopes compose upward, by correlation.** A subsystem's capacity envelope derives from its operations': steady loads add; peaks add only when correlated.

*envelope = Σ steady loads + Σ peaks that fire together · anti-correlated peaks contribute their max, not their sum*

The on-sale burst hits quote, hold, and payment together — one correlated peak, one envelope. Reporting close and pay-run may anti-correlate by calendar, and sizing for their sum wastes the difference. The calendar is capacity input, and shape beats headline everywhere: Part II contains a burst of a hundred thousand attempts per minute whose honest envelope decomposes into a large cheap stateless edge, a tiny contended core sized to *seat throughput*, and a fan-out absorbed by a buffer — three different envelopes from one headline number, none of them the naive division.

**Rule 4 — availability multiplies down a chain; independence must be earned.**

*series: availabilities multiply, A = a₁ × a₂ × … × aₙ · parallel: unavailabilities multiply, A = 1 − (1 − a₁)(1 − a₂), independence assumed*

Series first: five components in a chain, each at 99.99%, compose to 0.9999⁵ ≈ 99.95% — a 99.99% path cannot be built as a series of five parts as good as its target, and every thin tier in the chain counts in the multiplication even though none appears in the vector. The escape is parallel: two independent 99.9% paths compose to 1 − 0.001² = 99.9999% — *if* the failures are independent, and shared deploys, shared certificates, shared regions, and shared configuration are the reasons the parallel arithmetic lies in practice. Earned independence is structural, which is the quantitative case for blast-radius isolation and for the cell escalation in Chapter 3: the arithmetic of redundancy is only as honest as the isolation underneath it.

**Rule 5 — the mechanism bill must fit the operating envelope.** The four rules above verify performance answers; this one verifies the bound-mode answers, which most methodologies elicit and never consult again.

*Σ bills of standing mechanisms ≤ operating envelope, in both its currencies: money and operating attention*

Count the derived vector's standing mechanisms — every store technology, every broker, every projection pipeline, every cell-management discipline — and price the count in the two currencies the envelope answer stated. The check is a comparison rather than a formula: a vector whose mechanism count assumes a platform team, held against a sheet that says four engineers and no operations staff, has failed verification as surely as a blown latency budget, before anything is built, at the cost of counting. Part II's chat-platform run is the worked case: the four-engineers answer pruned as hard as any latency number on that sheet, and a vector that ignored it would have passed every other rule and still died in production, slowly, of operational starvation.

The availability ladder is worth internalizing as price bands. Two nines and a half — 99.5% — is forty-four hours a year: a restart strategy with an on-call phone. Three nines is under nine hours: failure domains start mattering. Four nines is fifty-three minutes a year: series arithmetic starts vetoing designs, and the Chapter 2 pricing drill ("what does the business do differently in the fifty-third minute?") is what this chapter's numbers look like when they arrive at the elicitation table. The two gates are one discipline at two moments.

## Verification before the build

The lens and the arithmetic check the vector on paper. Between paper and production sits a third pass, cheaper than either neighbor believes: exercise the claims before the system exists in full. Load models against the derived envelopes, with the correlation structure, not just the totals. Capacity models against the containment rungs' ceilings — the hardware rung's economics, a replica's lag under the projected write rate. And failure injection against the stated failure behaviors — every row of the consistency lens's third column is a testable hypothesis, and injecting the failure is the test. The industry practice this resembles is deliberate: game days and fault drills are the recovery axis's verification arm, and Part IV returns to where that practice's ownership belongs.

None of this replaces production truth. It bounds the surprises production is allowed to hold: a vector that survives decomposition, tail arithmetic, envelope composition, and injected failure can still disappoint — but at the margins, where operations lives, and no longer at the structure, where rewrites live.

## The toolkit, complete

Part I is done, and it is small on purpose: a sheet of priced answers and domain-shape facts; a ledger of what values provide and cost; a procedure that walks one against the other and refuses three specific decisions; a gate that checks the output's claims. Everything fits in the appendix as a worksheet and a deck of reference cards, which is a design property rather than a convenience — a method you can apply from memory is a method that actually gets applied.

What a toolkit cannot do for itself is prove that it works. Part II exists for that: first the domain this book controls, re-derived with every step citing its rule — then four systems this book does not control, derived blind from their public commitments, with predictions registered in advance and graded in the open. The instruments just described are about to be held to their own standard.

*Instruments introduced: the consistency lens (guarantee / mechanism / failure behavior) · the one-bit-label ban · the five rules of budget arithmetic · the availability price bands · pre-build verification (load, capacity, injection).*
