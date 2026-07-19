## blurb
Sequencer, Fork-Join, and Aspects - composing basic patterns into real workflows.

## learn
- Sequencer: chaining dependent steps
- Fork-Join: parallel independent operations
- Aspects: cross-cutting concerns without mixing responsibilities

## note
Sequencer alone structures most business logic you'll write. Fork-Join and Aspects are for the cases
that need more.

## exercise
### Add Retry and Timeout | ~20 min
Take an existing adapter call in your codebase. Wrap it with a timeout (fail after N seconds) and a
retry (up to 3 attempts on transient failure), composing both as aspects around the original step
interface. Solution discussion in the book's Appendix B (Exercise 3.4).
