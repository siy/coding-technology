# Part VI — Thinking in Aether

The promise this book opened with was a change of rank, and rank was never about API
coverage. A senior Aether developer is someone who can stand in front of a problem the
runtime has no chapter for and derive the right structure anyway. Every chapter so far
has quietly practiced that move; this part makes the method explicit, because the method
is the thing you keep after the API details fade — and the details will fade, while the
way of deriving them will not.

## Deriving idioms yourself

Every derivation in this book, from the first slice to the durable saga, answered the
same five questions in the same order. Stated once, plainly:

**What knowledge does this operation gather?** Name the pieces: what arrives in the
request, what each step adds, what is enough to answer. This is the frame from Part 0,
and it is the working definition of done — processing continues until the knowledge in
hand suffices to respond, and not a step longer.

**What does each failure mean?** A failure is knowledge too, and each one is knowledge
of something different. "Declined" answers the request; "timeout" answers nothing and
licenses a retry; "shipping refused after payment" creates an obligation to undo. Sort
every failure into what it tells you, because the sorting decides the structure: answers
flow back as values, ambiguity demands repetition-safety, obligations demand
compensation.

**What must survive?** Decide what outlives a process crash, and the answer picks the
primitive. Nothing survives: a plain pipeline is enough. A value per key survives: that
is a durable entity. An ordered history survives: that is a stream. A multi-step
obligation survives: that is a saga ledger. Most of the playbook is this one question
asked against different problems, and choosing a primitive is cheap once the survival
requirement is named — it is expensive only when the question was skipped.

**Who else needs to know?** Some knowledge is a private step; some is an event other
slices react to. If missing one is acceptable, that is pub-sub; if every one counts, in
order, with catch-up, that is a stream. The distinction is a business requirement wearing
a technical coat, which is why it can be derived and not guessed.

**Only now, the API.** The idiom is the last step, not the first, and by the time you
reach it the choice is usually forced. A developer who starts from the API surface
memorizes; one who starts from the problem derives, and derivation survives version
bumps.

The deeper habit under all five questions is decomposition along the lines where the
answers differ. A slice boundary is well placed when the knowledge, the failure meanings,
and the survival requirements inside it belong together and the ones outside it do not —
the criterion is older than any runtime, and Parnas stated it in 1972: decompose around
what can change and what must be hidden, not around the flowchart of the moment. Slices
give that criterion teeth, because each boundary is also a deployment, scaling, and
review boundary, and a badly placed one bills you monthly.

When the runtime offers no primitive, the same questions govern the invention. The
durable saga is this book's worked example: the manual saga answered every question but
survival, the survival requirement named a keyed, single-writer, durable object, the
entity supplied it, and the facade grew from there. Notice what the invention did not do.
It did not add a new distributed mechanism; it composed verified primitives and stated
its guarantee per operation, with the mechanism that earns it and the failure modes that
bound it. That is the standard an invented idiom must meet before you trust it: built
from parts whose guarantees you can cite, honest about what it does under each failure,
and exercised as a prototype before anything real stands on it. Reuse when an existing
primitive's guarantee covers the requirement; invent when the gap is real; and when you
invent something that generalizes, feed it back upstream — a good idiom wants to stop
being yours.

## Designing for idempotency and failure from line one

The second habit is refusing the schedule most projects keep, where failure handling and
repetition safety arrive after the features, as hardening. In a distributed system they
are not hardening; they are half the specification, and the half that shapes the design.

The reason is structural, and Part II named it: a caller that times out cannot know
whether the work happened. The only available move is asking again, so every layer of
the runtime asks again — retries, failovers, at-least-once delivery — and a method that
was not designed for repetition is not incomplete, it is wrong, in a way no later
hardening pass reliably fixes. Retrofitting an idempotency key into a write that has
been double-charging quietly is an incident review; designing it in is a line of code.

So the discipline is to design every operation with its repetition story and its failure
story in the same breath as its success story. For repetition: what identity does the
second attempt carry, and how is the first attempt's work recognized? For failure, use
the three recovery classes this book inherited from its sibling volumes and gave Aether
idioms. Compensate — the failure creates an obligation to undo, and the saga carries it.
Continue degraded — partial knowledge still answers, the scatter-gather join decides
with three bureaus or two. Design out — the best failure handling is a failure that
cannot matter, which is what idempotent writes, immutable events, and single-writer
state actually are: not robustness features but deletions of entire failure classes.
Reach for design-out first, degrade where the business tolerates it, compensate where it
does not. A design that names its recovery class for every step has no "error handling"
section at the end, and that absence is what senior looks like on paper.

## The finished order application

Stand back from the spine and look at what accumulated. A customer places an order. The
request parses at the edge into a value the rest of the system never re-checks, and
`placeOrder` runs the pipeline: reserve, charge, arrange — three slices, each a contract
in one file, each testable with lambdas in milliseconds. The order lands in Postgres
through a connector the slice declared in one factory parameter; the schema that
receives it is versioned migration files the deploy applies. An `OrderEvent` goes onto a
durable stream, keyed by order id so one order's history reads in order; the ledger
consumes it through a driven method whose cursor advances only on success, and the
order-history read model catches up at its own pace even after an hour down. A topic
fans the same news out to whoever is merely curious, and missing one is allowed — that
asymmetry was a derivation, not a default. Compensation guards the sequence: today the
manual saga, whose reversals live on each step's failure channel; the durable ledger
over a fenced entity is the designed successor, and this book has told you exactly how
much of it is real. Around all of it, the operational shell: one blueprint deployed
unchanged from Forge to production, payment scaled to fifty instances while catalog
idles at one, a canary gated on measured error rate, every request traceable by an id no
handler ever threaded, and a cluster that goes passive rather than split-brained when a
partition takes its majority.

The inventory of moving parts is short, and that is the point: contracts, resources,
two messaging shapes, one durable primitive with facades, and a derivation habit. Every
piece earned its place by solving a stated problem, every guarantee came with its
mechanism, and every gap was named rather than rounded up. There is no step in that
lifecycle you cannot reproduce on a laptop, and no claim in it you have to take on
faith.

## Techniques this book invented

Where Aether offered no primitive, this book designed one, and the honest ledger of
those inventions is short. Each is a candidate to flow upstream — into the runtime,
its tooling, or its taught idiom set — once its prototype gate is passed.

- **The manual compensation pipeline.** Context records accumulating step results,
  reversals on the failure channel, recovery that must not mask the trigger. Plain JBCT,
  runs today, and remains the right tool for single-invocation operations even after the
  durable saga ships.
- **The durable saga ledger.** A saga as `DurableEntity` state: declared steps, paired
  compensations, and a required `RerunPolicy` per step, with the `RUN_ONCE` attempt
  marker written under the fence closing the effect-versus-record crash window.
  Prototype-gated: designed and pinned, awaiting the facade build.
- **Workflow as validated state machine.** The entity specialized to a declared
  transition set, where an illegal event is a typed domain answer rather than a failed
  write. Same gate as the saga.
- **The `(key, n)` idempotency anchor.** Every entity update numbered, the number handed
  downstream as an idempotency key, and the dual-write problem answered without an
  outbox table or a delivery worker. Designed; its guarantee is only as real as the
  entity counter it rides on, so it passes the gate with the saga.
- **The recovery-class mapping.** Compensate, continue degraded, design out — the
  taxonomy is inherited from the companion books, but its systematic mapping onto Aether
  primitives (saga, scatter-gather join, idempotent single-writer state) is this book's,
  and it is the piece most worth teaching first.

The list is deliberately not longer. An invented idiom is a liability until it is
exercised, which is why each carries its gate, and why the book has been explicit at
every step about which register it was speaking in: shipped and verified, or designed
and pinned. You now hold both the system and the method that produced it. The method is
the part that was never version-locked: the next problem you meet will not be in this
book, and it will yield to the same five questions, asked in the same order, ending as
this book ends — with structure derived, guarantees named, and nothing taken on faith.
