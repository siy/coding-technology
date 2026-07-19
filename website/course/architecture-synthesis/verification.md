## blurb
The exit gate: the consistency lens and five rules of budget arithmetic that catch a wrong vector before anything is built.

## learn
- The consistency lens — guarantee, mechanism, behavior under failure
- The one-bit-label ban (no system is just "highly available")
- Latency budgets decompose downward; tails compose through the distribution
- Envelopes compose upward by correlation; availability multiplies down a chain
- Pre-build verification: load, capacity, failure injection

## exercise
### Fill the Consistency Lens | ~20 min
Pick one operation in a system you operate. State its guarantee, name the mechanism that earns it, and describe its behavior under failure. Then run the arithmetic on one latency target: sum the critical path's floors and subtract from the budget. If the floor eats the budget, you've found what the lens is for.
