# Spiral Pass 1 — Use Case Altitude

*A customer wants a seat. The system has eight steps to give them one. The methodology has six patterns, four shapes, and one recovery class to spend on the work — and one of those patterns won't show up at all.*

---

## What this pass does

Foundations named the pieces. This pass walks them through one use case, *buy a ticket for a specific seat at a specific event*: one trigger, one outcome, eight steps. By the end the six properties will have applied at the altitude where they are concrete and immediate, the per-process types will have been invented, the patterns that show up at this altitude will have, and the patterns that do not — compensation, time-as-decay, Aspects beyond runtime ones — will be visible as absences, clues to what the next altitude will earn. The methodology is not the pieces; it is what the pieces do when a team uses them on real work. This pass shows that.

---

## The use case, opened

### Trigger

The trigger for *buy ticket* is an incoming request from a customer-facing channel; for this pass, synchronous HTTP. In a typical deployment that means an HTTP POST to a specific endpoint, but the trigger is not the protocol; the trigger is what the protocol carries. Different trigger sources (scheduled job, message-bus event, human approval flow) make the same logical work into different use cases with different signatures, different observability requirements, and different failure modes for the caller-not-waiting case. That multiplicity earns its place at workflow altitude; at use-case altitude the trigger is fixed.

For *buy ticket* the customer is waiting. Latency matters in single-digit seconds. The use case must respond with success or with a structured failure that the customer-facing client can render.

### Typed input

The input is what *buy ticket* needs to begin. Three things, in this use case:

- The customer placing the order. Specifically the customer's identifier, not the customer's full record. The use case needs to know who is buying; the use case does not need to know the customer's address, payment history, marketing preferences, or anything else stored on the customer. The minimal input is the smallest input that the use case actually needs.
- The event the customer is buying for. Again the identifier, not the event record. The use case will look up event-relevant facts (is the event still selling tickets, what is the current price for this seat category) at the point where those facts matter, not by passing them in.
- The specific seat the customer wants. At use-case altitude this is a seat location — a section, a row, a number — not a free-text description and not a database row identifier. The seat is named in the venue's terms.

The input type is process-local. It does not exist elsewhere in the system as a shared definition. It is a structure of raw fields, the shape that arrives at the trigger boundary before any parsing has happened:

```
BuyTicket.Request:
    customer: String
    event: String
    section: String
    row: String
    number: int
```

(A note on notation, since this is the chapter's first code block: type shapes appear in pseudo-code for readability; composition snippets later in the chapter use Java, to stay faithful to the JBCT idioms they depend on.)

That is the use case's input type, in full. It carries what *buy ticket* needs and nothing more. If a different use case (cancel ticket, check availability) needs different information, that other use case has its own input type. The fact that both involve "a customer" and "an event" does not produce a shared parent type. Sharing without evidence of common meaning is a category error that produces structural problems downstream; the use cases involve customers and events but they involve them differently.

`CustomerId`, `EventId`, and `SeatLocation` — the validated forms the use case parses these raw fields into — work the other way. They are value objects, and they must be defined identically across every use case that references them. The system's integrity depends on it: when *buy ticket* and *cancel ticket* both name `CustomerId`, they must refer to the *same* customers, with the *same* construction rules and the *same* equality semantics, not to use-case-local notions that happen to share a name. Value objects are the kernel of the type vocabulary that travels intact across processes; per-process types are the surface each use case shapes for its own needs. The discipline is recognizing which is which, and the rule is structural: per-process types must stay local because the same noun means different things in different processes; value objects must stay common because the same noun means exactly the same thing wherever it appears, and the system's invariants depend on that identity.

### Typed output

The output is what the use case produces when it succeeds. *Buy ticket* succeeds when the customer has a confirmed claim to a specific seat at a specific event and payment has settled. The output structure says exactly that:

```
BuyTicket.Response:
    ticket: TicketId
    seat: SeatLocation
    eventStartsAt: ZonedDateTime
    receipt: ReceiptId
```

The customer's client renders this. The ticket identifier is the load-bearing piece — it is what the customer presents at the venue. The seat is echoed back so the client can display where the customer is sitting. The event start time is bound to a location with a specific time zone; the field type reflects that. The receipt identifier is what the customer uses to retrieve a printed proof of payment.

This output type is also process-local. The "ticket" referenced here is the customer's claim — it carries the identifier and presentation-relevant fields. A different use case (validate ticket at venue gate) has its own notion of what a ticket is for its purposes; that notion shares the identifier but adds different fields.

### Typed failures

The use case can fail in specific, enumerable ways. They are not exceptions to be raised somewhere; they are part of the use case's specification.

For *buy ticket*:

- **PaymentDeclined** — the payment provider rejected the authorization.
- **SeatUnavailable** — the seat is already booked or currently held for another customer.
- **EventNotSelling** — the event has closed sales (sold out, cancelled, completed, paused).
- **CustomerIneligible** — the customer's account state prevents booking (suspended, age-restricted for this event, region-restricted, exceeded purchase limit).
- **PaymentProviderUnavailable** — the payment provider returned a transient error rather than a definitive accept or reject.
- **ConcurrentBooking** — another booking process committed the seat between this use case's check and its reservation attempt.

Each failure is a domain fact. Each one has a known set of responses (retry, fall back, surface to the customer, alert operations). The set is closed at design time; it does not grow at runtime through unanticipated paths. A new failure mode is a new entry, added deliberately, with its own response policy. In Java with JBCT, the closed set is encoded as a sealed interface extending `Cause`: fixed-message variants live in a nested enum, variants with data live in nested records. Failures are lifted into the return type via fluent construction (`cause.result()`, `cause.promise()`), never via `Result.failure(...)` or `throw`.

For *buy ticket* the split is mechanical. `SeatUnavailable` and `ConcurrentBooking` carry no extra data and live in the nested enum. The other four carry data the caller needs to render or retry (the provider's decline reason, the event's closure type, which eligibility restriction applies, the transient error's category) and live as nested records.

The use case's signature is short:

```
Promise<BuyTicket.Response> buyTicket(BuyTicket.Request request)
```

`Promise<T>` is the methodology's async shape, used by any use case that performs I/O — even when the trigger is synchronous, as it is here. Reads from stores, calls to the payment provider, writes to the ticket record, and notifications are each asynchronous Leaves, and the asynchrony propagates outward. `Promise<T>` carries both the async modality and the failure modality: it resolves to either the success value (`BuyTicket.Response`) or one of the enumerated `BuyTicket.Failure` variants. A caller pattern-matches on both branches; the compiler insists that both are addressed. The HTTP handler that calls this use case awaits the Promise's resolution and renders the response to the customer as a synchronous response from the client's point of view.

### Steps

The steps are the use case's internal structure. *Buy ticket* has a small number of steps; the methodology's discipline keeps them named, ordered, and visible.

1. Validate the request — well-formed identifiers, the seat location is real for the event's venue, no obvious structural problems.
2. Check that the event is still selling tickets.
3. Check that the customer is eligible to buy a ticket for this event.
4. Reserve the seat — claim it for this customer with a short time-bounded hold.
5. Authorize payment — ask the payment provider to commit the customer's money to this order.
6. Confirm the seat — convert the reservation hold into a permanent assignment.
7. Issue the ticket — create the customer's claim record.
8. Notify the customer — send the confirmation through whatever channel the customer prefers.

Eight steps. Each one named in domain terms. The reader looking at the use case implementation sees these names in order; the implementation is not hidden behind framework calls or scattered across helper classes. The methodology's structural commitment is that the steps are visible at the altitude they belong to, named in the domain's vocabulary.

### Dependencies between steps

The dependency graph is what makes the steps a composition rather than a list. Some steps must complete before others can begin. Some steps can run in parallel. Some steps are conditional on the outcome of prior steps.

For *buy ticket*:

- Validation must complete before any other step runs. An invalid request goes no further. The dependency is enforced structurally: validation produces a new type (`BuyTicket.ValidRequest`) only when the request is valid, and subsequent steps accept only this type. Invalid requests cannot reach later steps because no value of the required type can be constructed from them. This is the discipline [Alexis King named *parse, don't validate* in 2019](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/), applied at the use case's entry point — and the same pattern holds at every step boundary that follows: each step produces a new type whose existence is the precondition for the next.
- Event-selling check and customer-eligibility check are independent of each other; both depend only on validation. They can run in parallel.
- Seat reservation depends on event-selling and customer-eligibility both succeeding.
- Payment authorization depends on seat reservation succeeding. A reserved seat is the precondition for taking money.
- Seat confirmation depends on payment authorization succeeding.
- Ticket issuance depends on seat confirmation succeeding.
- Customer notification depends on ticket issuance succeeding.

```
             Validate request
                     |
          +----------+----------+
          |                     |
          v                     v
     Check event           Check customer
       selling               eligibility
          |                     |
          +----------+----------+
                     |
                     v
               Reserve seat
                     |
                     v
            Authorize payment
                     |
                     v
               Confirm seat
                     |
                     v
               Issue ticket
                     |
                     v
             Notify customer
```

That is the graph. It has two parallel branches early (event-selling and customer-eligibility), then a linear sequence. The graph is small enough to hold in the reader's head. It is also small enough that the implementation can be read and the graph can be reconstructed without external documentation.

The six properties are now stated. The use case is, in methodology terms, specified. Implementation follows.

---

## Per-process types: where the methodology earns its first concrete commitment

The six properties named types: `BuyTicket.Request`, `BuyTicket.Response`, `BuyTicket.Failure`, plus the shared value objects `CustomerId`, `EventId`, `SeatLocation`, `TicketId`, `ReceiptId`. Inventing these types is where the methodology's process-first commitment becomes visible.

The commitment is small to state and consequential to apply: **types belong to processes, not to the domain.** A "customer" in *buy ticket* is a customer-buying-something, identified by `CustomerId` and needing nothing else from the customer concept at this use case's level. A "customer" in customer-registration is a customer-being-created, with a different set of fields. A "customer" in customer-profile-update is a customer-with-mutable-state, with a third set. The same noun, three uses, three types.

In the entity-first tradition this collapse is the default: there is one `Customer` class, used everywhere, with whatever union of fields the various callers have asked for over the years. The result is well-documented and structurally consistent across teams that have used the pattern long enough: god-objects that no individual use case actually wants, or anemic carriers whose behavior has been pushed out into services that operate on the carriers from outside.

Process-first reverses the default. Each use case owns the types it needs. The shared layer is small — value objects that genuinely carry one piece of well-defined meaning across processes. The seat example makes this concrete.

### The seat across three processes

A seat is a real domain concept. Three processes interact with it.

**Buy ticket** needs to know where the customer is sitting. The seat in this use case is a location — section, row, number, within a specific venue. The booking process records that this customer is in row L, seat 14, for the event being held. The information needed about the seat is its physical position. The behavior performed is selecting it and committing it to a customer.

```
SeatLocation:
    section: SectionId
    row: RowId
    number: SeatNumber
```

**Check seat availability** is a different process. It is not buying anything; it is answering "is this seat currently bookable for this event?" The seat in this process is an availability status — held until a certain time, currently for sale, sold, blocked, withdrawn from sale. The information needed is the seat's current state and, if held, when the hold expires.

```
SeatAvailability:
    seat: SeatId
    status: AvailabilityStatus
    holdExpiresAt: Option<Instant>
```

A hold may or may not be present; both cases are legitimate from the business perspective. The `Option<Instant>` expresses that fact explicitly: a seat for sale carries no hold expiration, a held seat does, and the type makes the difference unmissable rather than encoding it as a null or a sentinel instant.

**Quote a price for a seat** is a third process. Before the customer commits to a purchase, they ask: what does this specific seat at this specific event cost? The seat in this process is a price tier — premium, standard, economy, accessible, restricted-view — paired with the pricing rules for this event's tier schedule. The information needed is the seat's price tier and the event's pricing rules; the physical location of the seat is irrelevant to pricing. Pricing is a per-tier concern, not a per-seat-location concern.

```
SeatPricing:
    seat: SeatId
    tier: PriceTier
    eventSchedule: PriceScheduleId
```

Three processes. Three different things called "seat." Different fields. Different operations. Different invariants. If a single shared `Seat` class is forced over all three uses, the class either grows every field every use ever needed (and no use wants all of it) or stays thin and pushes the differences into mapping code that has to evolve as each use evolves.

Process-first declines the shared class. The three processes each get their own type. The processes are connected at the persistence layer (there is a physical seat in a venue, persisted, that all three processes read from in their own projections) and at the identifier layer (`SeatId` travels between processes opaquely; possessing the identifier is not the same as possessing the seat's data).

### What stays shared

The reframe is sometimes mistaken for a position that nothing should be shared. That is not the position. Some types are genuinely shared because they genuinely mean the same thing everywhere they appear.

`CustomerId`, `EventId`, `SeatId`, `TicketId` — opaque identifiers, used the same way wherever they appear. A typed wrapper around a string or a UUID. They travel; the things they identify do not need to travel as full objects with them.

`Money` — an amount and a currency, with arithmetic rules and comparison operations. The same `Money` in pricing means the same thing as the same `Money` in payment authorization. A shared `Money` value object is appropriate.

`Instant` — a point in time, in the system's chosen representation. Used wherever a time is mentioned.

These are small. Few fields. Well-defined invariants. No behavior beyond enforcing those invariants and supporting basic operations. They are value objects in the term-of-art sense — equality is by content, instances are immutable, construction is validated, the type carries one piece of domain meaning and no more.

The distinction the methodology makes is between *value objects* and *entities*. Value objects can be shared because they carry one well-defined piece of domain meaning. Entities — concepts that mean different things in different processes — cannot. The discipline is recognizing which is which, which is usually obvious once the question is asked: does this concept carry one piece of validated meaning across all uses, or does it carry different meanings in different uses? The first is a value object. The second is an entity, and it does not become a shared type just because the noun is the same.

### Construction enforces the type's claim

A type that carries domain meaning makes a claim. A `CustomerId` claims to be a valid customer identifier. A `Money` claims to be a non-negative amount in a known currency. A `SeatLocation` claims to be a real position in a real venue.

The methodology asks that construction enforce the claim. A `CustomerId` cannot exist as an empty string. A `Money` cannot exist with a negative amount or an unknown currency. A `SeatLocation` is constructed by lookup against the venue's seating plan, not by accepting arbitrary section, row, and number values. Construction is the choke point; invalid values do not survive it.

*Parse, don't validate*, as the prior subsection cited. The construction site does the work once. Every caller that receives a constructed value can trust it. The use case's body is free of defensive checks because the types it operates on have already been validated at the boundary.

Implementation choices vary across languages — some compilers enforce these invariants directly via refinement types; others enforce through factory-method discipline. The Foundations section named four enforcement levels. The methodology's structural commitment is the same across all four; the teeth differ. *Buy ticket* in Java with JBCT uses the factory-method pattern: the type has a non-public constructor and a public static factory that returns `Result<T>`. The factory performs validation; success wraps a valid instance, failure carries the named cause. Callers must address both branches — the type system insists. Invalid instances cannot exist as values of the type because no caller can construct one without the factory's `Result`. Same discipline as in languages with refinement-type support; the teeth here are structural through the factory's `Result` return rather than syntactic through the type signature itself.

Composite construction accumulates. When `BuyTicket.ValidRequest` is built from independently validated fields (`CustomerId`, `EventId`, `SeatLocation`, each with its own factory returning `Result<T>`), the JBCT-canonical composition is

```
Result.all(customerIdResult,
           eventIdResult,
           seatLocationResult)
      .map(BuyTicket.ValidRequest::validRequest);
```

The composition collects per-field failures rather than short-circuiting at the first; a caller receiving the structured rejection sees every invalid field at once, which is what a customer-facing client needs to render. Async equivalents (`Promise.all`, `Promise.allOrCancel`) accumulate the same way for I/O-touching factories.

### Types evolve within the use case

Per-process types are not static. Inside the use case body the types appear in sequence: each step accepts the prior step's typed output and produces a new typed value that the next step accepts. `BuyTicket.ValidRequest` is the entry condition; downstream steps produce a `Reservation`, then an `Authorization`, then a `ConfirmedSeat`, then a `Ticket`, then a `NotifiedTicket`. The sequence of types *is* the use case's spine. A reader scanning the steps' return types sees what each step contributes.

This pattern is canonical in JBCT under the name **growing context**: each pipeline stage receives the prior context, adds information, and passes an enriched context forward. The discipline is structural (every step's output type is the precondition for the next step's input), so the compiler enforces the order. Reordering the chain accidentally produces a type error at the first misaligned step, not a behavioral surprise at runtime. Per-process types are not just a between-processes commitment; they are the within-process record of growing knowledge.

The same discipline lets the Fork-Join at the front of the use case carry information forward rather than acting as a pure gate. The event-selling and customer-eligibility checks each succeed with a typed value (the event's current sale state, the customer's booking context) that combines with the validated request into the reservation context the next step consumes. Success enriches; failure carries the typed `BuyTicket.Failure` variant that propagates to the caller and short-circuits the chain. The pattern holds at every step boundary.

---

## Composition: the six patterns at use-case altitude

The methodology names six composition primitives: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects. The claim from the Foundations section is that the same six apply at every altitude. At use-case altitude, some of them show up immediately; some are present but spare; some do not earn their place until later altitudes. Which appear and which do not is itself information about the use case.

### Sequencer

A Sequencer is the most common pattern at use-case altitude. *Buy ticket*'s linear spine (reserve, then authorize, then confirm, then issue, then notify) is a Sequencer. Each step's output feeds the next; failure at any step short-circuits the rest.

The implementation reads as a chain of typed operations. Each step takes the prior step's output as input. Each step is a Leaf to an external resource (or composes other Leaves) and therefore returns `Promise<T>`. The chain composes through `flatMap`, which short-circuits at the first failure — the failure variant propagates to the use case's caller without further steps running.

```
return reserveSeat.apply(validRequest)
                  .flatMap(authorizePayment::apply)
                  .flatMap(confirmSeat::apply)
                  .flatMap(issueTicket::apply)
                  .flatMap(notifyCustomer::apply);
```

The shape is recognizable. The reader following the chain sees the use case's spine. Each step is named in domain terms. The failure mode at each step is part of the step's typed return, not raised as an exception that disappears up the stack.

The chain stays short. JBCT's monadic-chain discipline caps direct chains at four or five steps before extracting named sub-Sequencers. *Buy ticket*'s full pipeline (validation, the Fork-Join checks, this five-step booking spine) exceeds that limit as one inline chain; the use case body composes named sub-pipelines instead, each itself a short Sequencer that the outer Sequencer flatMaps over.

Sequencer appears in every non-trivial use case at this altitude. If a use case has no Sequencer it is doing a single thing, and the methodology's response is to ask whether it is actually a use case at all or something smaller — a query, a probe, a leaf operation.

### Condition

A Condition is the methodology's name for branching on a business decision — a domain fact that selects between alternative continuations, both of which are legitimate. The Condition pattern routes on values like *which discount tier applies to this purchase*, *which shipping method does this order use*, *do these miles get added to the customer's account at the standard rate or the promotion rate*. The use case is asking which path this case takes.

For *buy ticket* as described, explicit Condition is rare. The use case is mostly Sequencer + Leaf + Fork-Join: validate, check, reserve, authorize, confirm, issue, notify. Each step has a clear next step on success; the use case is not differentiated by branching business rules at this altitude.

A Condition would appear if the use case branched on, say, the event's sale type: member-restricted events take a membership-check path before reserving; general-sale events skip the membership check. The methodology accommodates such variations cleanly — the branch is encoded as a typed sum (`EventSaleType.MemberOnly | EventSaleType.GeneralSale`), and the use case dispatches on the variant.

Other natural Conditions in the booking domain include applying a customer's eligible discount tier (student, senior, military), routing on whether a valid promo code is present, and triggering a group-discount path when the booking covers a party of N or more. Each is a branch on a domain fact selecting between alternative continuations — different price calculations, different validation rules.

The discipline is keeping the branch typed. A boolean rarely carries enough domain meaning to make the branch self-describing at the call site; the typed sum carries the business fact the branch depends on. `EventSaleType.MemberOnly` says what is being decided; `true` says only that something was decided.

Condition earns more visibility at workflow altitude (Pass 2), where workflows compose around branching business decisions: which fulfillment flow this booking follows, which refund policy applies to this cancellation, which notification channel reaches this customer best.

### Leaf

A Leaf is the methodology's name for an atomic execution unit. It is the bottom of composition — either a boundary crossing (I/O, external library call, non-deterministic API) or a pure computation (deterministic input-to-output transformation with no side effects). Anything that composes other operations is a different pattern (Sequencer, Fork-Join, Condition); anything that has hidden state is forbidden in business code. *Buy ticket* has several Leaves, almost all of them boundary crossings:

- Reading the venue's seating plan to validate the seat location.
- Reading the event's selling-status from the event-management subsystem.
- Reading the customer's eligibility state from the customer subsystem.
- Calling the seat-reservation store to claim the seat with a hold.
- Calling the payment provider to authorize the customer's payment method.
- Calling the seat-reservation store again to convert the hold to a permanent assignment.
- Writing the ticket to the ticket store.
- Calling the notification service to send the customer confirmation.

Each one is a Leaf. The use case's body composes them; the body itself is not a Leaf. The discipline at this altitude is that Leaves are named in domain terms (`ReservationStore.claim`, `PaymentProvider.authorize`) rather than technical terms (`Database.execute`, `Http.post`). The technical detail lives behind the domain-named interface. The use case body knows nothing about whether the reservation store is a Postgres table, a Redis key, a remote service, or a hybrid; it knows only that it can ask the reservation store to claim a seat.

The cross-cutting distinction the Foundations section drew applies cleanly here. The use case's body operates in a quarantined zone where only domain concepts appear. Technical concerns live one step away, behind domain-named interfaces. The reader of the use case body sees business logic uninterrupted by framework or infrastructure concerns.

### Fork-Join

A Fork-Join is the pattern for parallel steps that converge. *Buy ticket* has one natural Fork-Join: the event-selling check and the customer-eligibility check are independent. Both depend on validation completing; neither depends on the other. They can run concurrently and their results join before reservation begins. The Fork-Join also grows context, as the prior subsection named: each check on success returns a typed status that the reservation step needs.

```
return Promise.all(checkEventSelling.apply(validRequest.event()),
                   checkCustomerEligibility.apply(validRequest.customer(), validRequest.event()))
              .map((selling, eligibility) -> ReservationContext.reservationContext(validRequest, selling, eligibility))
              .flatMap(reserveSeat::apply);
```

`checkEventSelling` returns `Promise<EventSaleStatus>`; `checkCustomerEligibility` returns `Promise<CustomerBookingContext>`. `Promise.all` runs both concurrently and joins them into a tuple, propagating either's typed failure if it occurs. The `.map` builds the next step's context: `ReservationContext` combines the validated request with both statuses. `reserveSeat::apply` is a single-arg method reference taking that context. The step interface stays single-method, single-arg, as the methodology asks; the growing context absorbs what the Fork-Join produced.

The implementation depends on the runtime's concurrency primitives (futures, promises, fibers, threads, whatever the language and stack provide). The methodology's commitment is independent of the primitive: the pattern is Fork-Join, the implementation honors what the host language calls it.

Fork-Join at use-case altitude is sometimes present, sometimes absent. *Buy ticket* has one occurrence; some use cases have none. Its presence depends on what is genuinely parallelizable in the use case's step graph, and that depends on the domain, not on the developer's preference.

### Iteration

Iteration is the pattern for applying a step to a collection. Whether it appears at use-case altitude depends on the use case's shape. Use cases that operate on multi-item structures — checkout flows reserving stock for each line item in an order, multi-seat bookings, bulk invoice processing, order-validation passes — naturally include Iteration at use-case altitude. The trigger is still one event and the outcome is still one response, but the work inside includes "do this for each item."

*Buy ticket* as defined here does not iterate, because the use case handles a single ticket. The absence is a property of this specific use case, not of use-case altitude in general. A close variant — *buy multiple tickets in a single order* — would iterate naturally over the seat selections, reserving each one in turn.

Iteration also appears at higher altitudes, where the iteration is *over use cases* — a workflow processing many bookings, a subsystem handling daily batches. Both forms compose through the same primitive.

### Aspects

Aspects are cross-cutting concerns: things that apply uniformly across many operations rather than belonging to any specific operation. Logging, retries, distributed tracing, correlation identifiers, idempotency-key handling, audit trail emission, circuit-breaking — these are all Aspects.

At use-case altitude, Aspects are present but mostly handled by the runtime rather than written into the use case body. The Foundations section made the distinction between business cross-cutting and technical cross-cutting. *Buy ticket* itself does not log; the runtime around it does. *Buy ticket* itself does not trace request paths; the runtime injects tracing. *Buy ticket* itself does not handle retries against the payment provider; the payment provider's Leaf wrapper handles retries policy, and the use case body sees only the typed outcome.

When multiple Aspects wrap a single operation their composition order matters, but at use-case altitude the runtime supplies the order and the use case body sees only the typed outcome. The convention itself — which Aspect wraps which, and why — earns its place at workflow altitude, where Aspects become load-bearing, and is settled fully in the Architecture Synthesis module.

The use case body is therefore short. It contains domain logic and nothing else. Aspects are visible in the use case's behavior at runtime (the logs appear, the traces propagate, the retries happen) without being visible in the use case's source. The discipline that produces this separation is the quarantine principle plus the Leaf interface: business code calls domain-named Leaves; Leaves carry whatever technical Aspects the operation needs.

Aspects earn more visibility at higher altitudes. At subsystem altitude, business cross-cutting (audit-as-data versus audit-as-Aspect, regulatory compliance hooks) becomes load-bearing and the methodology has to make explicit choices about where the cross-cutting lives. At use-case altitude, the choices are not yet forced.

That deferral is not a reason to undervalue the separation; it is load-bearing. The composition skeleton — the Sequencer spine, the Fork-Join, the steps that compute rather than call out — is this use case's business logic in pure form, and it is testable as such, exercised against stand-in Leaves with no database, payment provider, or clock in sight. "Pure" here is meant in the business sense rather than the functional-programming one: the skeleton is a faithful account of how this use case processes, independent of the machinery that runs it.

Because the skeleton is independent of its Leaves, the same skeleton attaches to different Leaf implementations to become a running application: real adapters in production, doubles under test. That attachment is also where technical instrumentation enters. Because every Leaf and every injected dependency crosses the same uniform seam, the runtime can wrap them with logging, tracing, and metrics automatically, and the use case body names none of it. This is the technical cross-cutting the runtime already owns; the skeleton-and-Leaf structure is what lets the wrapping be applied systematically rather than written by hand. The wiring itself is assembly-time work, taken up at system altitude.

### What the pattern distribution shows

*Buy ticket* uses Sequencer (strongly), Leaf (frequently, at every boundary), Fork-Join (once), Condition (rare or absent), Iteration (absent), Aspects (handled by runtime). Three patterns are strongly present; Condition and Iteration are absent in this specific use case; Aspects live in the runtime.

This is the distribution this use case earned. A different use case at the same altitude will have a different distribution. *Check seat availability* is mostly Leaf with a small Condition — read the seat's current state, branch on the variant. *Refund ticket* is mostly Sequencer plus Condition (full refund vs partial refund vs courtesy waiver) with one Leaf to the payment provider. *Buy multi-seat order* puts Iteration at the centre (reserve each seat in turn) alongside the same Sequencer spine. No use case at this altitude has every pattern at high frequency; the distribution carries information about the use case's shape and the business rules it embeds.

The methodology does not prescribe which patterns appear. The methodology supplies the patterns and lets the use case earn which ones show up. The reader inspecting a use case body recognizes the patterns by their shape and can reason about the use case's structure by which patterns are present and which are absent.

---

## The four shapes earn their place

The Foundations section named four shapes that types carry: `T` (the value exists unconditionally), `Option<T>` (the value may or may not exist), `Result<T>` (the operation may or may not have produced the value), `Promise<T>` (the value arrives later). Each shape carries a domain modality. The shapes are not stylistic; they are how the type system represents what the domain says about a value.

*Buy ticket* makes each shape concrete.

### T — the unconditional value

Several values in *buy ticket* are unconditional. They are present, they are valid, they are not waiting on anything. The validated request after construction is a `BuyTicket.ValidRequest` — not an `Option<BuyTicket.ValidRequest>`, not a `Result<BuyTicket.ValidRequest>`, just a `BuyTicket.ValidRequest`. Construction either produced it or rejected the inputs at the boundary, but downstream code receives the unconditional value.

A `CustomerId` once constructed is a `CustomerId`. A `Money` once constructed is a `Money`. A `SectionId` is a `SectionId`. These are baseline types. Wrapping them in additional containers when they cannot fail is ceremony without payload. The Foundations section named this discipline; *buy ticket* shows it in practice.

### Option<T> — the absent value

`Option` carries the absence-as-domain-fact modality. Some values legitimately may not exist. *Buy ticket* has a few:

- A seat's current hold expires at some instant, *if* the seat is currently held. If the seat is not held, there is no hold expiration. The field is `Option<Instant>`, not `Instant`. A reader looking at the field knows the absence is a domain fact, not an error condition.
- The customer's preferred notification channel might or might not be set. If unset, the use case uses a fallback. `Option<NotificationChannel>` carries the design fact.

`Option` is used where the absence carries domain meaning. Where absence would indicate a programming error (a value the use case expects to always be there but might be missing because of a bug), the answer is not `Option`; the answer is type discipline that prevents the value from being missing. `Option` is a domain claim, not a defensive catch-all.

### Result<T> — the synchronous failure modality

`Result<T>` carries failure-as-typed-outcome for operations that complete synchronously and do not touch I/O. *Buy ticket* itself returns `Promise<BuyTicket.Response>` because it performs I/O at almost every step (covered next), but `Result<T>` still earns its place inside the use case wherever a step is purely computational: pre-validation of the request structure, derivation of intermediate values from already-loaded data, structural checks against the typed input. Those steps return `Result<T>`, and the surrounding `Promise<T>` composition lifts them into the async chain where the next step is an I/O Leaf.

`Result<T>` and `Promise<T>` are not redundant. They name different modalities (synchronous-may-fail and asynchronous-may-fail), and the methodology asks the designer to be explicit about which the step is. A Sequencer of `Result<T>` operations stays synchronous; a Sequencer involving any `Promise<T>` propagates `Promise<T>` outward. The composition primitives handle the lifting uniformly, so the use case body composes both shapes without ceremony.

### Promise<T> — the asynchronous shape that includes failure

`Promise<T>` carries both the async modality and the failure modality. *Buy ticket* has multiple Leaves that touch external resources: the payment provider authorization, the reservation store calls, the ticket store writes, the notification dispatch. Each is I/O, each is asynchronous, each returns `Promise<T>`, and `T` already includes the failure case because `Promise` resolves to either a success value or a typed failure.

The propagation is automatic. Any step that depends on an async Leaf is itself in a `Promise` context, and the compositions absorb it: a Sequencer chains `Promise<T>` values via `flatMap`; the runtime handles the async sequencing while the type carries the failure modality. The reader sees the chain and reads it as a sequence; the underlying machinery does what the language and runtime supply.

The implementation depends on what the host language calls async (futures, promises, fibers, virtual threads, suspend functions, async/await). The methodology's commitment is independent of the implementation primitive. The shape is `Promise<T>`; the runtime supplies the concurrency.

### Why these four

Four shapes cover the design space use-case-altitude operations care about: the value exists or it does not (T or Option), the operation succeeded or failed (T or Result), the value arrives now or later (T or Promise). Other traditions add more — list types, stream types, effect-tracking types — but the methodology declines them: four shapes are sufficient, and each additional shape is a cost the reader pays at every signature. The payoff is a signature that reads directly as domain modality. `Result<TicketId>` is a synchronous operation producing a ticket identifier or one of the named failures; `Promise<TicketId>` is the same operation asynchronously, with failure already folded in.

---

## Recovery: BER applies cleanly at this altitude

The Foundations section named three recovery classes: BER (Backward Error Recovery — compensate via inverse action), FER (Forward Error Recovery — continue with degraded state), and design-out (alter the shape so compensation is unnecessary). At use-case altitude, BER applies cleanly to almost everything, with one design-out move that the methodology's structural choices have already made.

### What can fail and what compensation looks like

Failure points in *buy ticket*:

- **Validation fails.** No state has changed. Return the structured rejection. No compensation needed because nothing happened.
- **Event-selling check fails.** No state has changed. Return the structured rejection. No compensation needed.
- **Customer-eligibility check fails.** Same as above.
- **Seat reservation fails because the seat is unavailable.** No state has changed. Return the structured rejection. No compensation needed.
- **Payment authorization fails.** The seat reservation exists — a hold has been placed on the seat. The state must be undone. Release the hold. BER applies; the inverse is mechanical.
- **Seat confirmation fails after payment authorization succeeds.** Payment has been authorized but not captured. Release the hold; void or reverse the authorization. Both are mechanical inverses on the domains they affect.
- **Ticket issuance fails after seat confirmation succeeds.** The seat is now committed and payment is authorized; the customer's ticket record does not exist. Reverse the confirmation; void the authorization; release any residual state. The inverses are still mostly mechanical, but the surface area grows with each successful step that has to be undone.
- **Notification fails after ticket issuance succeeds.** The ticket has been issued. The customer does not need to be notified for the booking itself to be valid; the failure is logged for reconciliation and the use case returns success. FER could apply here, with degraded state being "ticket issued, notification queued for retry."

The pattern is: failures early in the sequence cost nothing because nothing has happened. Failures late in the sequence cost the inverse of every successful step. The Sequencer makes this visible; the reader following the chain can identify exactly which inverses are needed at which failure points.

### Each inverse is mechanical at this altitude

Releasing a seat hold is the inverse of placing a seat hold. Both operations live in the same domain (the reservation store); the inverse is the operation's reverse and does not require a separate workflow to execute. The methodology calls this **domain-internal compensation**: the inverse stays inside the step's own domain.

Voiding a payment authorization is similar. The payment provider supports an inverse operation (`void` or `reverse`) that maps directly to the authorization. The inverse is mechanical in the same sense — call the inverse method on the same domain interface.

Reversing a seat confirmation (turning a confirmed assignment back into an unclaimed state) is again domain-internal. The reservation store supports this transition explicitly because the methodology asked the designer to think about it.

The discipline this surfaces is **identifying compensation requirements at design time**. When the use case is being specified, the question "what is the inverse of this step?" is asked for every step that produces state. Steps without inverses are flagged. If a step's effect cannot be undone (sending an email, charging a card without a reverse path, dispatching a physical item), the methodology surfaces that fact and the team decides whether the step belongs in this use case or whether the use case's structure needs to change.

### Design-out is already in play

*Buy ticket* makes one design-out move that the methodology's structural choices have already taken: the seat reservation model. The use case does not naively check seat availability and then attempt to claim it (which would race against other booking attempts). The use case reserves the seat with a short time-bounded hold *before* attempting payment. The hold prevents two booking attempts from succeeding for the same seat; only one hold can exist at a time per seat.

This design-out move means "two customers attempting to book the same seat at the same time" does not need BER. The reservation model prevents the conflict from producing two inconsistent confirmed bookings. One reservation succeeds; the other's reservation attempt fails immediately with `SeatUnavailable`. There is no compensation needed for the failed attempt because the failed attempt never made any state change beyond the failed reservation try, which the reservation store handles atomically.

Design-out at use-case altitude tends to be exactly this kind of structural choice: pick a domain model where the conflicting case cannot arise. The methodology's discipline asks the designer to look for design-out opportunities before committing to compensation. If a domain model exists where the conflict is structurally impossible, that model is usually cheaper than the compensation logic that would otherwise be needed.

### FER is not yet earned

Forward Error Recovery means continuing with degraded state. At use-case altitude FER applies sparingly because there is little state to degrade. The single FER candidate in *buy ticket* is the notification step — the booking can succeed even if the notification fails, with the failure logged for retry. That is a small FER application, applied at the edge of the use case where the customer's claim to the seat is already committed and the notification is a downstream concern.

The full FER discourse (time-as-decay, defaults under partial failure, self-stabilizing flows) does not earn its place until workflow altitude. At workflow altitude, multiple use cases compose, telemetry streams persist across compositions, and the design space for degraded states opens. At use-case altitude, the design space is small: the use case either succeeds and produces its output, or fails and (after compensation if needed) leaves no inconsistent state behind.

### Recovery class selection at this altitude

The Foundations section named four selection axes: reversibility, forward-progress value, domain shape, coordination cost. At use-case altitude, the choice is mostly driven by the first two.

- **Reversibility.** Steps that produce reversible state (seat holds, payment authorizations, draft records) admit BER cleanly. Steps that produce irreversible state (sent emails, dispatched physical items, posted ledger entries) need design-out or accept the irreversibility.
- **Forward-progress value.** When partial success is more valuable than rollback, FER applies. The notification example is the small case at use-case altitude.

Domain shape (the third axis) determines which design-out moves are available, but at use-case altitude the design-out moves are typically built into the methodology's vocabulary (the reservation model is one such move). Coordination cost (the fourth axis) does not bite at use-case altitude because everything happens within one use case's scope.

The full selection mechanism (with all four axes weighed against each other, with mixed strategies across a workflow) lives in the Architecture Synthesis module that follows the spiral. At use-case altitude, the selection is straightforward: BER for steps with mechanical inverses, design-out where the domain model can prevent the conflict, FER for downstream effects whose failure does not invalidate the use case's primary outcome.

---

## Architecture surfaces at this altitude

Phase-5 architecture-vector selection operates across six axes (deployment topology, composition substrate, read/write model, state storage, persistence layer configuration, recovery class), fully developed in the Architecture Synthesis module. At use-case altitude, some of these axes have decisions to make; some do not yet.

### Per-use-case SLOs

The architecture decision that surfaces immediately at use-case altitude is the SLO triple per use case: latency, throughput, availability. *Buy ticket* needs to respond to the customer in seconds, not minutes. It needs to handle the venue's peak booking rate, which for a popular event can be thousands of attempts per second in the first minutes of sale. It needs to remain available during exactly those peak periods.

These SLOs do not appear out of nowhere. They come from the business's understanding of what the use case is for. They are inputs to architecture, not outputs. The Phase-4 elicitation that the Architecture Synthesis module fully treats begins here: what does *this* use case need to deliver in operational terms? Answer that, in the use case's own scope, and the answer constrains the architecture choices that follow.

For *buy ticket*:

- **Latency.** P50 under 2 seconds, P99 under 5 seconds. The customer is waiting.
- **Throughput.** 1,000 attempts per second sustained during peak; 5,000 attempts per second burst.
- **Availability.** 99.95% during business hours, accepting brief degradation during scheduled maintenance.

These are concrete numbers. They are not what every use case in the system needs; *check seat availability* might have different numbers, *refund ticket* might have different numbers, *send venue capacity report* might have different numbers. Phase 4 attaches answers at three scopes (per use case, per data class, per domain), developed in the Architecture Synthesis module. Latency, throughput, and availability are per-use-case answers.

Beyond the SLO triple, the use case makes another architecture-level choice: the in-flight failure response mode. Three modes are available: synchronous fail (return the typed failure to the caller immediately), retry-with-backoff (within the use case's latency budget, transient failures retry transparently inside a Leaf), and degraded mode (return a partial success when the primary outcome cannot be achieved). For *buy ticket* the response is mostly synchronous fail; retry-with-backoff lives inside the payment-provider Leaf for transient provider errors and is invisible to the use case body; degraded mode does not apply because there is no meaningful partial success of "buying a ticket."

### What is deferred

Several architecture questions do not surface at use-case altitude. They are real questions, but they do not yet have anything to decide against because the multiplicity that would force them has not arrived.

- **Persistence topology.** Does the reservation store live in a shared database with other subsystems' data, or in its own? At one use case, the question has no force. Multiple use cases across multiple workflows make the question concrete.
- **Deployment topology.** Is *buy ticket* deployed as part of a monolith, as one slice of a modulith, as its own microservice, as a function-as-a-service, or as an Aether slice on a unified runtime? At one use case, any topology works. The choice has weight when many use cases are deployed together and operational concerns (independent scaling, blast-radius isolation, deployment frequency) start to matter.
- **Cross-process consistency.** When *buy ticket* writes the ticket and another use case reads it, what consistency is required? At one use case in isolation, the question is moot. Composition with other use cases — query the customer's tickets, list event attendees, calculate venue revenue — forces it.
- **Composition substrate.** Are use cases composed directly, each calling the next and using its result, or through events that one publishes and another reacts to, or some hybrid? At one use case the trigger is fixed (synchronous HTTP); the composition question only appears when use cases call other use cases.

These deferrals are not omissions. They are honest about what the altitude has earned. The Architecture Synthesis module fully treats each axis after the spiral has shown what each altitude surfaces. The deferral here means: the question exists, the answer comes when the methodology has enough multiplicity to drive it.

---

## Closing — multiplicity is coming

This pass has shown one use case. The methodology applied to it produced a typed input, a typed output, an enumerable failure set, a small ordered sequence of steps with explicit dependencies, per-process types specific to this use case's needs, value objects where genuine sharing applies, the composition patterns that appear at this altitude (and the ones that do not), the four shapes earning their place, and a recovery class that applies cleanly to local failures.

The methodology did not produce the design. A team designing *buy ticket* made choices. The methodology made those choices visible, named them, and kept the resulting code legible.

The next pass starts where this one ends. *Buy ticket* is one use case. The system that contains it is not just *buy ticket*. The customer who buys a ticket may want to cancel it. The customer may want a refund. The customer may want to change their seat. The customer may want to check seat availability without committing to a purchase. The customer may want to hold a seat temporarily while consulting friends. The venue operator may want to release blocked seats for last-minute sale. The pricing system may want to update tier prices based on demand. Each of these is a use case in its own right.

The use cases share resources. Multiple use cases interact with the same seat. Multiple use cases interact with the same customer. Multiple use cases produce events that other use cases consume. The composition of these use cases is not just a list; it is structured. Workflows emerge from the structure.

At workflow altitude, the methodology applies again. The same six properties describe workflows, with the granularity shifted up. The same six patterns appear, with some that were absent at use-case altitude (Iteration, Aspects) earning their first strong appearances. The same four shapes carry domain modalities. Recovery class selection becomes more interesting because the design space opens: compensation across use cases, time-as-decay as a first-class concern, saga as a recognizable composite rather than a primitive.

The next pass walks through that.

---

*Threads advanced: 5 (legibility), 6 (knowledge preservation), 11 (interesting work), 14 (telescope).*
