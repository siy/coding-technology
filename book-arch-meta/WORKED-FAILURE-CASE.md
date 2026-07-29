# Worked Failure Case — the global order book (contradiction detected mechanically)

**Purpose:** all eight validations to date SUCCEEDED; a derivation that never fails is a parlor trick. This case exercises the honest-failure path: `next_step` detecting that no vector satisfies the answers, and producing the module's promised output — "surfacing the obstruction" — as a priced renegotiation menu. Book home: ch. 8 ("When the derivation says no"). Constructed, not sourced; flag as such in the book (candidates from reader counterexamples may replace it).

## The system and the answers (all three priced and confirmed at the entry gate)

A trading platform for a commodity with a single global market. Three answers, each individually reasonable, each with an owner who has seen its price and still wants it:

- **A1 (compliance, prune-mode):** the regulator in each of three jurisdictions requires that resident traders' order data be stored and processed in-country. Sovereignty pins data by law. Non-negotiable by statute.
- **A2 (consistency, prune-mode):** the business requires ONE global order book with atomic matching — every order sees every other order; two matching engines would create arbitrage between them, which the market's rules prohibit. Confirmed at the entry gate: decomposition attempted ("is 'one book' really global price *visibility*, bounded-staleness tolerable?") — no: matching itself must be atomic and global. The demand survives decomposition intact.
- **A3 (latency, select-mode, contractual):** order acknowledgment ≤ 50ms P99, in-region, in all three regions. Contractual; priced; wanted.

## The derivation walk

1. **Prune round, persistence axis.** A2 (atomic global matching) demands a single serialization point for the order book. Candidate values:
   - *Single shared store (one region):* violates A1 for two of three jurisdictions (their residents' orders processed out-of-country) AND A3 for two regions (cross-region ack ≥ ~70-140ms RTT > 50ms). Struck twice.
   - *Sharded (by region or instrument):* regional shards violate A2 (two books = arbitrage); instrument shards don't help — the book is per-market and the market is one. Struck.
   - *Distributed shared store (multi-region quorum):* satisfies A1 (regional presence) and A2 (one logical book). A3: quorum commit across three regions has a physics floor of one-plus inter-region RTTs — ≥ 70-140ms before any software runs. 50ms P99 ack is **unreachable at any engineering effort**. Struck by physics.
   - Every value on the axis is struck. **The prune round empties the axis.**
2. **Scope test.** Opposing pressures on one axis — different scopes? No: A1, A2, A3 all attach to the SAME data class (the order book) and the same operation (order submission → match → ack). No boundary exists to split along. The escape hatch the conflict rule provides for profile-three-shaped systems does not exist here.
3. **Demand re-decomposition (second attempt, per the rule).** A2 already survived decomposition at the entry gate. A3 decomposes one candidate way: does "acknowledgment" mean *matched* or *durably accepted*? This is the only soft joint in the triple — noted for the menu below.
4. **Output: CONTRADICTION.** No vector satisfies {A1, A2, A3}. The derivation halts and says so. Detection was mechanical: an emptied axis after pruning + a failed scope test + demands that survive decomposition. No judgment call anywhere in the detection — the judgment starts *after* it.

## The output that is actually useful: the renegotiation menu

The methodology's product here is not silence — it is the explicit menu of which answer bends, each with its price. This is where "methodology informs, business decides" stops being a slogan:

- **Bend A3 (redefine acknowledgment):** ack = *durably accepted in-region* (local durable enqueue, ≤ 50ms honestly achievable), matching completes asynchronously with a *match notification* following (~200-400ms). The consistency lens states the new guarantee precisely: 50ms covers acceptance, not matching; the match itself is strict, global, and slower. **Price:** the semantics change is visible to traders; "fast ack" no longer means "fast fill." Most real exchanges live here.
- **Bend A2 (regional books):** three books with cross-region arbitrage explicitly permitted and bounded (publish inter-book spreads; arbitrageurs close them). **Price:** the market's one-price rule is gone; the regulator that prohibits arbitrage must agree — usually they don't; this branch usually dies, which is itself information.
- **Bend A1:** legal, not architectural — one jurisdiction hosts the matching engine under a treaty/equivalence arrangement while data residency is satisfied by regional replicas-of-record. **Price:** years, lawyers, and a dependency on regulation staying put (a Phase-4 answer with a change-driver attached).
- **Reject all three:** don't build this product in three jurisdictions. Also a valid business answer, and cheaper discovered now than in production.

Each branch, once chosen, re-enters `next_step` as a new answer set and derives normally (branch one derives cleanly: regional ingestion + durable queues + one strict matching core + async match feeds — the derivation continues without further incident).

## What the case demonstrates (for ch. 8)

1. Contradiction detection is **mechanical**: emptied axis + failed scope test + decomposition-stable demands. "A methodology that always returns a confident answer is hiding the cases where it has none" — this is the case it doesn't hide.
2. The physics floor does real work: A3-vs-quorum is decided by geography, not by effort ("production proves you met the number; physics decides whether you can").
3. The valuable output is the **priced menu**, and the menu's usual winner (bend the ack semantics) is found by decomposing the *softest demand*, not the loudest stakeholder.
4. The failure modes compose with the success path: the chosen branch resumes the ordinary derivation. Failure is a fork, not a dead end.
