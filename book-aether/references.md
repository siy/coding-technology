# References

Works cited in the text, alphabetical by author.

**Garcia-Molina, Hector, and Kenneth Salem.** *Sagas.* Proceedings of SIGMOD 1987.
The origin of the saga: a long-lived transaction decomposed into steps, each paired with a
compensating action run in reverse on failure. Module D's compensation chapters teach the
pattern's Aether form; this is the paper the industry's usage descends from.

**Kleppmann, Martin.** *Please stop calling databases CP or AP.* 2015.
<https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html>
The argument that one-bit consistency labels mislead, and that a system is described honestly
per operation, by the guarantee it provides and the mechanism that earns it. This book's
discipline of stating every guarantee that way — visible most plainly in Module B's "what
durable depends on," Module D's durability bounds, and Part V's majority rule — follows this
essay's lead.

**Parnas, David L.** *On the Criteria to Be Used in Decomposing Systems into Modules.*
Communications of the ACM 15(12), 1972.
The decomposition criterion Part VI names: modularize around what can change and what must be
hidden, not around the processing steps of the moment. Slice boundaries give the criterion
operational teeth — each is also a deployment, scaling, and review boundary.

**Restate documentation.** Restate. <https://docs.restate.dev/>
Cited in Module D for how production saga systems handle failed compensations: best-effort
reverse with explicit partial outcomes rather than a retry loop that hides a broken downstream.

**Temporal documentation.** Temporal Technologies. <https://docs.temporal.io/>
Cited in Module D as the replay-based contrast: Temporal re-executes workflow history to rebuild
state and so requires deterministic workflow code, where the durable entity confines replay to
pure state-transition commands and leaves surrounding slice code unconstrained.

**Yevtushenko, Sergiy.** *Java Backend Coding Technology.* Leanpub. <https://leanpub.com/jbct-book>
The companion volume this book assumes: the four return shapes, parse-don't-validate, the six
structural patterns, and the testing discipline that Part 0 compresses. Where this book writes
Java, that book is the authority on how.

**Yevtushenko, Sergiy.** *Process-First Design.* Leanpub. <https://leanpub.com/process-first-design>
The companion volume this book inherits its recovery-class taxonomy from — compensate, continue
degraded, design out — which Part VI maps onto Aether's primitives, and the wider
design-from-process discipline the knowledge-gathering frame belongs to.
