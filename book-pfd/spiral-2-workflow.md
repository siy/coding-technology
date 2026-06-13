# Spiral Pass 2 — Workflow Altitude

*A customer holds a seat. Five minutes later the system has to decide what to do with the unbought claim. Across the booking, cancellation, and held-seat workflows the same six patterns appear again — but now Iteration has work to do, time stops being a fixed point and becomes a category, and one workflow turns out to be a saga without needing the name.*

---

## What this pass does

Pass 1 closed on multiplicity. *Buy ticket* is one use case; the system that contains it is not. The customer who bought a ticket might cancel it. The customer who has not yet bought might hold a seat while consulting friends. The venue operator periodically releases blocked seats for last-minute sale. The pricing system adjusts tier prices before each batch of holds becomes a purchase. Each of these is a use case in its own right, and the system that runs them all is not just a list of unrelated transactions.

The use cases interact. Multiple use cases write to the same seat, the same customer record, the same event's selling state. Multiple use cases produce events that other use cases consume. Some use cases compensate others; some use cases must wait for others; some use cases coordinate against shared time-bounded constraints. The structure that emerges from those interactions is the workflow. At workflow altitude the same methodology applies again — same six properties, same six patterns, same four shapes, same recovery-class triple — but with the granularity shifted up.

This pass walks workflow altitude through a single domain. The running example holds: event ticketing. The use cases have multiplied. *Buy ticket* from Pass 1 is one of them, kept intact at its own altitude; the customer can also *cancel ticket*, *refund ticket*, *hold seat*, *check availability*; the venue's operations fire scheduled work like *release expired holds*. These are genuinely distinct use cases with their own external triggers, and they cohere into workflows around shared change drivers.

By the time the pass closes, the reader has seen the six patterns reappear with a different distribution. Iteration earns its first strong appearance. Aspects surface as load-bearing rather than runtime-handled. Sequencer composes use cases rather than steps inside one use case. Compensation becomes load-bearing because failures cross use-case boundaries. Time stops being a fixed point in some workflows and becomes a category (fresh, stale, expired) that the system reasons about. The cancellation-and-refund workflow decomposes into the structure the industry calls a saga, with the methodology naming it as a composite of patterns it already has.

The pass closes by naming what does not appear at this altitude either. Subsystem boundaries are still implicit. Cross-subsystem coordination is still hidden in the assumption that all workflows share a substrate. Persistence topology is still a question to be deferred. The multiplicity that earns the next altitude is not yet here, but it is coming.

---

## Workflows emerge from multiplicity

A workflow is a named set of use cases that share a change driver and compose toward one business outcome, and that is also how you recognize one. Take a candidate set of use cases and ask: what business change would force all of them to change together? If a single force (the reservation policy, say) rewrites every one of them when it shifts, they cohere into one workflow. If a change touches only some, the set is not one workflow but two that happen to sit near each other. The cohesion is in the business, not in shared data; a workflow is not a deployment unit, a transaction boundary, or "the use cases that touch the same record."

Booking shows the test passing. *Hold seat*, *confirm reservation*, *cancel reservation*, and *release expired holds* belong to one workflow because the reservation policy governs all four: change what holding and confirming a seat means — the hold duration, the confirmation rules, the conditions for release — and all four change together. They also contend over the same seat record, but that contention is a symptom of their cohesion, not its cause: they touch the same state because the same force governs them, not the other way round. The shared-data view has the arrow backwards. Cohesion comes first; contention is what the methodology then has to manage, and later sections do.

The set passes both directions the recognition test has. It is *complete*: every use case the reservation policy governs is here, so a policy change lands in this one workflow rather than scattering across several (the shotgun surgery a split would cause). And it is *pure*: nothing in it answers to a different driver, so pricing's changes never ripple through booking (the accidental coupling a foreign member would invite). A set that passes only one direction is not a workflow — drop *release expired holds* elsewhere and a hold-duration change must be made twice; fold a pricing use case in and pricing's churn reaches booking.

The change-together test is sharper than "these feel related," and it cuts against the data intuition directly: shared data is neither necessary nor sufficient for cohesion. Two use cases can write the same record yet answer to different forces (not one workflow); two can never touch the same data yet answer to the same force (one workflow). Organize by what changes things together, not by what they store. The Foundations chapter named this criterion's independent counterpart: the Independent Variation Principle, reached from the change-driver side rather than the process side. The convergence is corroboration, not foundation, and the workflow altitude is where Process-First Design first uses the criterion to draw a boundary.

A workflow is named after the business outcome it composes. Booking-and-payment is the lifecycle from "customer asks to buy" through "customer has a confirmed ticket and the venue has the money." Cancellation-and-refund is the lifecycle from "customer asks to cancel" through "the seat is back in inventory and the customer has their money back." Temporary-hold is the lifecycle from "customer puts a seat on hold" through "the hold is either consumed by a confirmed booking or released because expiry passed." Each name carries a complete business arc; each arc decomposes into several use cases.

A workflow has the same six properties as a use case. Trigger, typed inputs, typed outputs, typed failures, steps, dependencies. The granularity differs: the trigger fires the workflow rather than a single use case; the steps are use cases rather than atomic operations; the dependencies are between use cases rather than between operations inside one use case. The failures are workflow-level — some bubble up from constituent use cases, some are workflow-specific (the workflow as a whole timed out before any individual use case did). The methodology's claim, restated at this altitude, is that the same vocabulary describes both scales without losing precision.

The workflow's types are mostly composed from its use cases, not invented for it. Internally, the workflow threads the use cases' own types forward as growing context — each step's output is the next step's input — rather than wrapping them in workflow-specific equivalents.

What the workflow owns is its boundary. Its request is the shape the trigger carries, often broader than any one use case's input because it gathers at the boundary what later steps will need; its response is shaped from the terminal steps; its failure type sums the constituent failures that can reach the caller with the failures only the composition can produce. The rule: a workflow invents a type only where the composition produces something no single use case has — an aggregate input the trigger carries, or a failure only the orchestration can hit. Everything else is the use cases' own types, composed.

Sharing across workflow boundaries still happens only at the value-object layer: `CustomerId`, `EventId`, `SeatId`, `Money` travel intact between workflows because they carry the same meaning everywhere.

What changes at this altitude is not the methodology. What changes is what the methodology has to express. Composition runs across autonomous use cases that have their own triggers, their own SLOs, their own deployment characteristics. Some compositions are short and direct; others stretch across minutes or hours. Some compositions need compensation when a downstream step fails; some compositions tolerate partial success and continue with degraded state. The workflow is the unit at which the methodology names that variety.

---

## Cancellation-and-refund: a workflow from independent use cases

The cancellation-and-refund workflow lives in event ticketing because the customer who bought a ticket sometimes wants to cancel. The trigger is a customer's request to cancel a specific booking, surfaced through the customer-facing channel. The work the workflow has to do — reverse the reservation, initiate the refund, invalidate the ticket, send the customer a confirmation — composes use cases that are each invokable on their own at use-case altitude. An administrator can manually cancel a reservation. The payment provider can initiate a refund from an out-of-band trigger. An operator can invalidate a ticket directly. They cohere into one workflow because the cancellation policy governs all of them: change what cancellation means in the business (the cancellation window, who is eligible, what the refund policy is, how refunds are processed) and the four use cases change together. That cohesion is the workflow.

The workflow is *cancel booking*, and it has the six properties at workflow granularity. Its trigger is the customer's intent to cancel, a customer-facing request distinct from any internal step's trigger. Internally it threads its use cases' types forward as growing context: `LoadBooking` produces a `Booking`, `VerifyCancellationEligibility` consumes it and produces an `EligibleBooking`, and so on. What it owns at its boundary is three types: `CancelBooking.Request` (what the trigger carries), `CancelBooking.Response` (shaped from the terminal steps), and `CancelBooking.Failure` (the constituent failures that reach the caller plus the ones only the orchestration can hit).

```
CancelBooking.Request:
    booking: BookingId
    customer: CustomerId
    reason: Option<CancellationReason>
```

```
CancelBooking.Response:
    booking: BookingId
    cancelledAt: Instant
    refundStatus: RefundInitiated
```

```
CancelBooking.Failure:
    BookingNotFound
    CancellationNotPermitted(policy: PolicyReason)
    ReservationCancellationFailed
    RefundInitiationFailed(reason: String)
    TicketAlreadyUsed
```

(A note on notation: type shapes appear in pseudo-code for readability; composition snippets use Java, to stay faithful to the JBCT idioms they depend on.)

Sharing across workflow boundaries still happens only at the value-object layer: `CustomerId`, `BookingId`, `TicketId`, `Money` travel intact between workflows because they carry the same meaning everywhere.

The steps of the workflow are use cases: *load booking*, *verify cancellation eligibility*, *cancel reservation*, *initiate refund*, *invalidate ticket*, *send cancellation confirmation*. Each has its own use-case-altitude definition with its own Request, Response, Failure. The dependencies between steps are mostly linear: verify cannot run before load; cancel-reservation cannot run before verify; initiate-refund cannot run before cancel-reservation; invalidate-ticket and send-confirmation run in parallel after refund initiation.

### The workflow body

A workflow's own signature — `Request` in, `Promise<Response>` out, the `Promise` carrying asynchrony and failure — is the same shape a use case has, one altitude up. That sameness is the point: because every use case and workflow presents this one invocation shape, a framework can invoke and Aspect-wrap them uniformly, and a subsystem can later compose a whole workflow exactly as a workflow composes a use case. The shape is what matters; whether a framework names it or you write the method out, as below, is a detail.

```java
public interface CancelBooking {
    Promise<Response> apply(Request request);
    interface LoadBooking                   { Promise<Booking> apply(ValidRequest request); }
    interface VerifyCancellationEligibility { Promise<EligibleBooking> apply(Booking booking); }
    interface CancelReservation             { Promise<CancelledReservation> apply(EligibleBooking booking); }
    interface InitiateRefund                { Promise<RefundedBooking> apply(CancelledReservation cancelled); }
    interface InvalidateTicket              { Promise<InvalidatedTicket> apply(RefundedBooking refunded); }
    interface SendCancellationConfirmation  { Promise<NotificationOutcome> apply(RefundedBooking refunded); }
}
```

```java
return CancelBooking.ValidRequest.validRequest(request)
                                 .async()
                                 .flatMap(loadBooking::apply)
                                 .flatMap(verifyCancellationEligibility::apply)
                                 .flatMap(this::executeCancellation);

private Promise<CancelBooking.Response> executeCancellation(EligibleBooking booking) {
    return cancelReservation.apply(booking)
                            .flatMap(initiateRefund::apply)
                            .flatMap(this::finalizeCancellation);
}

private Promise<CancelBooking.Response> finalizeCancellation(RefundedBooking refunded) {
    return Promise.all(invalidateTicket.apply(refunded), 
                       sendCancellationConfirmation.apply(refunded))
                  .map((_inv, _conf) -> CancelBooking.Response.response(refunded));
}
```

Three composed methods within JBCT's chain-length discipline. The growing-context discipline holds across use cases just as it held inside the single Pass 1 use case: `Booking`, `EligibleBooking`, `CancelledReservation`, `RefundedBooking` are records that thread the workflow's accumulated knowledge forward. Each step's response becomes the precondition for the next. The compiler enforces order; reordering accidentally produces a type error at the misaligned step.

Invalidating the ticket and sending the cancellation confirmation run in parallel as a Fork-Join. Both depend on the refund being initiated; neither depends on the other. The result tuple folds into the workflow's response.

### Compensation classified

The cancellation-and-refund workflow is the methodology's natural place to surface compensation in its full taxonomy, because its primary action is itself the inverse of an action the system already took. Its forward chain runs through *cancel reservation*, *initiate refund*, *invalidate ticket*, *send cancellation confirmation*. Some of those inverses are local to the system; some are not. The compensation discussion that *buy ticket* opened at Pass 1 surfaces here in full.

The methodology distinguishes two compensation shapes by where the inverse lives.

**Domain-internal compensation** is the inverse whose entire effect stays inside the original action's domain. *Cancel reservation* inverts *confirm reservation*: both operations live in the reservation store; the inverse is a state transition on the same record. Releasing a hold inverts acquiring a hold. Voiding an authorization inverts placing an authorization. Reversing a posted ledger entry inverts the post. The inverse is mechanical: it is an operation on the same domain interface, and the methodology's discipline asks the designer to confirm at design time that the operation exists.

**Domain-escaping compensation** is the inverse whose effect leaves the original action's domain. *Initiate refund* inverts *authorize-and-capture payment*, but the refund's effect does not stay inside the payment store. It propagates outward into the payment provider, the customer's bank, the customer's account statement, and eventually the customer's psychological state about the transaction. The inverse is not a single operation; it is itself a workflow, with its own steps, its own timing, its own failure modes, and its own potential need for compensation if the refund flow itself fails.

The classification is not a hierarchy. Both shapes are legitimate. The distinction governs what the workflow has to budget for:

- Domain-internal inverses are bounded. The compensation Aspect invokes them and the system's state reverts. Latency is the latency of the inverse operation; failure modes are the inverse's own failure modes.
- Domain-escaping inverses are unbounded in scope. The compensation Aspect invokes the inverse use case (which initiates the inverse workflow), but the inverse workflow's terminal effect propagates beyond the system's edge. The workflow that initiated the compensation is finished when its inverse use case completes successfully; the downstream effects continue outside the workflow's scope.

The workflow's responsibility is to make the boundary explicit. *Cancel booking* commits to "the system has done its part of the cancellation": the seat is back in inventory, the ticket is invalidated, the refund has been initiated. The workflow does not commit to "the customer has received the refund," which is the payment provider's downstream guarantee. The methodology asks the designer to name this boundary at workflow design time, not to discover it during incident response.

### Residuals

Some effects cannot be undone at all. The customer received a confirmation email yesterday; the email exists in their inbox; the cancellation workflow cannot un-send it. The customer made a decision to wait at the venue yesterday afternoon because they had a ticket; the cancellation workflow cannot refund the customer's time. The customer told a friend they were going; the cancellation workflow cannot un-tell that conversation.

These are residuals. The methodology names them explicitly at workflow design time, and the team decides how the workflow accounts for them. Three responses:

- **Forward correction.** Send a follow-up email confirming the cancellation. The original email is not reversed; the chain continues with new state. The customer's inbox now has both messages; the timeline reads as a coherent narrative.
- **Acknowledged residual.** The cancellation workflow names "the customer's time" or "the third-party knowledge" as a residual the system does not address. The workflow's contract reads: "the system reverts its own state; effects that have escaped the system stay escaped." This is honest about the methodology's scope.
- **Workflow restructuring.** If a residual would be unacceptable in the workflow's domain, the workflow's forward path is restructured so the residual does not arise. (A workflow that issues physical tickets a week before the event would not commit to "issue ticket" until later in the lifecycle, when cancellation residuals are smaller.) This is a design-out move applied to compensation residuals.

The methodology's discipline is to ask the residual question for every domain-escaping action: what does this action commit the customer to that the inverse cannot undo? The answer is either "nothing significant," "a residual we acknowledge," or "a residual the workflow's structure should avoid." Discovering residuals during an incident is the failure mode that this discipline prevents.

### What the cancellation workflow does not roll back

The cancellation workflow's failures do not compensate the workflow's own forward steps with respect to its own state. The workflow's intent is to revert; if the revert is partial, the partial state is the workflow's outcome, not a thing to be re-reverted. The failure modes name what the workflow could not complete; the caller decides what to do about the partial cancellation. `ReservationCancellationFailed` may leave the booking active and the refund un-initiated. `RefundInitiationFailed` may leave the seat returned to inventory while the customer's money remains with the provider. Each failure is a domain fact with its own response policy; reconciliation runs as its own workflow.

---

## Saga as composite

The cancellation-and-refund workflow has a name the industry already gives it. Autonomous use cases, each forward step's inverse-or-completion being its own use case, eventual consistency, the workflow's Sequencer short-circuiting on failure and a compensation Aspect unwinding what was committed — this is a saga. The shape is the canonical case of the pattern because the workflow's forward chain *is* a chain of inverses; compensation logic and forward logic share the same vocabulary because they are the same kind of thing seen from two directions.

The methodology does not introduce saga as a primitive. The methodology recognizes saga as a composite of patterns it already names. The decomposition: Sequencer + Condition (where the workflow branches on failure detection) + compensation Aspect. The Sequencer carries the forward chain. The Condition surfaces inside use cases that have internal branches (whether the booking is eligible by policy, whether the refund flow chose the refund-to-original-method path or refund-to-credit-balance path). The Aspect carries the inverse mapping and the unwinding orchestration. None of the three is new. Together they form the structure the industry has been calling a saga.

The reduction holds when four qualifiers are satisfied:

1. **Committed, accumulating state.** Each forward step commits state that a later failure has to unwind, and the steps pile those effects up with no single transaction to discard them at once. A composition whose steps only read has nothing to compensate and is not a saga.
2. **Autonomous steps.** Each step is a unit with its own typed boundary, coordinating through typed handoffs and explicit inverses rather than a shared call stack. If the steps share an atomic transaction that could roll back together, the coordination problem disappears and saga is not the right framing.
3. **Inverses are themselves use cases.** Each forward step's compensation is itself a use case in the system (*cancel reservation* is a use case; *void authorization* is a use case; *initiate refund* is itself a workflow that the compensation Aspect can invoke). They are not exception handlers, not catch blocks, not finalizers. They are first-class objects with their own Requests, Responses, Failures.
4. **Eventual consistency.** State is consistent in the limit, not at every intermediate point. A reader observing the system during a saga's execution sees partial states; the saga's terminal contract is that the system either reaches the success state or returns to the pre-saga state via compensation.

None of the four is an altitude. The saga is recognized by this shape wherever it appears: most elaborately at workflow altitude, across autonomous use cases that share no transactional substrate, but the same shape governs a use case like *buy ticket*, whose committed steps — hold, authorize, confirm, issue — must unwind in reverse if a late step fails. That forward chain is the one the diagram below uses.

When these four qualifiers hold, the composition is a saga, and the methodology names it as a composite of Sequencer + Condition + Aspect. When one of the qualifiers does not hold, the composition is some other shape, usually a Sequencer with simpler recovery, or a higher composition of sagas. (The separate published treatment of this reduction — [*Saga Is Not a Pattern* (Yevtushenko, 2026)](https://medium.com/@sergiy-yevtushenko/saga-is-not-a-pattern-6973bdcebde5) — develops the reduction's historical context and the article-length argument against introducing saga as a primitive.)

The recognition matters because it constrains what the composition has to commit to. A Sequencer is something the methodology already knows how to compose. A Condition is something it already knows how to type. An Aspect is something it already orchestrates. There is no new vocabulary, no new primitive, no special-case handling. A composition's saga-ness is a property of how its existing components are arranged. Naming the property does not require giving it its own grammatical category.

The compensation Aspect, illustratively:

```java
CompensationAspect.builder()
                  .inverseOf(ConfirmReservation.class, CancelReservation.class)
                  .inverseOf(AuthorizePayment.class, InitiateRefund.class)
                  .inverseOf(IssueTicket.class, InvalidateTicket.class)
                  .build();
```

When the workflow's Sequencer short-circuits on a typed failure, the compensation Aspect unwinds prior committed steps in reverse order, invoking each inverse use case. The compensation runs as use cases. Each inverse is its own use case with its own trigger, inputs, outputs, and failure modes. The Aspect orchestrates them. This is the methodology's structural commitment: compensation does not live as exception handlers scattered through the workflow body. It lives as a registered Aspect that the workflow runtime applies uniformly.

The shape is easier to see than to say:

```
   forward (Sequencer, top to bottom)         inverse (compensation Aspect)

   Hold seat            <--------->   Release hold
       |                                   ^
       v                                   |
   Authorize payment    <--------->   Void authorization
       |                                   ^
       v                                   |
   Confirm reservation  <--------->   Cancel reservation
       |                                   ^
       v                                   |
   Issue ticket         <--------->   Invalidate ticket
```

The forward chain runs top to bottom; a typed failure runs the committed steps' inverses bottom to top, the last commit undone first. That is the whole of a saga — a Sequencer, the inverses its steps already define, and an Aspect that applies them in reverse.

---

## Temporary-hold: time-as-decay enters

The temporary-hold workflow has a different shape than the prior two. There is no caller waiting for the workflow's response. The workflow's primary mechanism is the passage of time, not the arrival of a request. A hold begins when the customer asks for one (the *hold seat* use case fires); the hold ends either because the customer used it for a purchase, or because expiry passes, or because the venue manually invalidates it. The workflow exists to coordinate the hold's lifecycle: what state the hold is in, what the system observes about it, and how the system responds when the hold's state degrades.

### Time-as-trigger, time-as-condition, time-as-decay

Time appears in three distinct shapes across the methodology, and the temporary-hold workflow is where the methodology earns the distinction.

**Time-as-trigger** is a scheduler firing a use case at a wall-clock instant. The *release expired holds* use case has a scheduled trigger: every minute, the use case fires, queries holds whose expiry has passed, and releases them. The use case's trigger is time; its action is the inverse of the original hold acquisition. This is a use-case-altitude pattern; the workflow surrounding it is the periodic cleanup workflow, not the temporary-hold workflow.

**Time-as-condition** is a boundary check at any point during a request. When *buy ticket* fires after a customer has been holding a seat, the workflow checks: is the hold still within its expiry window? If yes, the buy proceeds against the held seat. If no, the buy proceeds against the seat as if no hold existed (subject to availability). The check uses time as a Boolean condition: the hold either is in-window or is out-of-window.

**Time-as-decay** is the methodology's third shape, and the temporary-hold workflow surfaces it. Time-as-decay treats the hold's state as continuously degrading: `fresh → stale → expired`. The workflow does not check "is the hold expired?" as a Boolean; it queries "what state is the hold in?" as a typed answer. A `fresh` hold (under 30 seconds old, say) is a hold the customer can rely on. A `stale` hold (between 30 seconds and the configured expiry) is a hold the customer can still rely on but the system has flagged for possible refresh. An `expired` hold is a hold the system has released. The workflow operates on the typed state, not on raw time arithmetic at every use site.

```
HoldState:
    Fresh(holdToken: HoldToken, acquiredAt: Instant)
    Stale(holdToken: HoldToken, acquiredAt: Instant, staleSince: Instant)
    Expired(originalToken: HoldToken, expiredAt: Instant)
```

A use case that needs to know the hold's state asks the temporary-hold workflow; the workflow returns `HoldState` as a typed sum; the use case pattern-matches on the variants and decides what to do for each. *Buy ticket* operating against a `Fresh` hold extends the hold's lease and proceeds. *Buy ticket* operating against a `Stale` hold either extends-and-refreshes (if business rules allow) or treats the hold as if it did not exist. *Buy ticket* operating against an `Expired` hold treats it as if it did not exist.

### Why time-as-decay earns its own shape

The two simpler shapes — time-as-trigger and time-as-condition — handle most temporal logic the methodology encounters. Time-as-decay earns its own shape because it carries domain information the other two do not.

A Boolean check (in-window / out-of-window) collapses the customer's experience to two states. A `Fresh` / `Stale` / `Expired` typed sum carries three meaningful states, and the system responds to each differently: `Fresh` proceeds without ceremony; `Stale` may surface a warning or trigger a refresh; `Expired` requires re-acquisition. The richer typing lets the system express degraded operation rather than binary success/failure.

The shape also enables Forward Error Recovery cleanly. A workflow that observes a `Stale` hold can FER: continue with the stale state, possibly degrading the customer experience (asking the customer to confirm the seat is still what they want before committing payment, for instance) rather than failing the workflow. With only Boolean time, the workflow has to choose between treating the hold as valid (risky if stale near boundary) and invalid (frustrating to customer near boundary). With typed decay, the workflow has a third option.

Time-as-decay is the methodology's claim to original contribution. The literature names time-as-trigger (scheduled jobs, expiry sweepers) and time-as-condition (window checks, freshness validations) under various names; time-as-decay as a continuously typed state has no widely cited treatment. The methodology surfaces it because workflows at this altitude need it.

### The temporary-hold workflow's structure

The workflow has multiple triggers:

- The customer's *acquire hold* request: fires *hold seat*; the workflow registers a new hold in `Fresh` state.
- The customer's *check hold* query: the workflow returns the current `HoldState`.
- The customer's *extend hold* request (sometimes implicit through a downstream use case): the workflow refreshes a `Fresh` or `Stale` hold back to `Fresh`.
- A scheduled sweep: every minute, the workflow transitions holds whose `Fresh` window has passed to `Stale`, and holds whose full expiry has passed to `Expired`, firing *release expired holds* for the latter.
- The customer's downstream booking: a successful purchase consumes the hold, transitioning it to a non-tracked state.

The workflow body is not a single Sequencer. It is an event-driven composition where multiple triggers fire use cases that each operate on the hold's typed state. The composition pattern at this scale is more naturally described as a state machine — typed states (`Fresh`, `Stale`, `Expired`, `Consumed`), typed transitions between them, use cases as the agents of transition. Each transition is itself a use case invocation. The methodology recognizes state machines as the typed-Condition variant: states are typed values, transitions are gated on Condition checks, and the runtime applies the transition through use-case invocation.

The temporary-hold workflow's failure modes are domain-specific: `HoldNotFound`, `HoldAlreadyConsumed`, `HoldInUnexpectedState` (defensive — the workflow detects an inconsistent state and refuses to operate). FER applies more here than at use-case altitude: a `Stale` hold that the system has not yet swept does not fail the workflow; it returns `Stale` and the caller decides how to proceed.

---

## The six patterns at workflow altitude

The same six patterns reappear at workflow altitude. The distribution differs from use-case altitude. Some patterns that were absent or rare now earn strong appearances. Some patterns that were strongly present now appear less centrally because the work has shifted up a level. The methodology's claim of fractal-pattern composition holds because the same primitives compose the same way at each altitude; the claim is empirical, validated across the workflows the running example has surfaced.

### Sequencer composes use cases

At use-case altitude, the Sequencer composed steps inside one use case's body. At workflow altitude, the Sequencer composes use cases inside one workflow's body. The cancellation-and-refund workflow is a Sequencer of `LoadBooking` → `VerifyCancellationEligibility` → `CancelReservation` → `InitiateRefund` → invalidate-and-notify. Each step is a use case; each is composed through the workflow's chain via `flatMap`; the chain short-circuits on the first typed failure. The shape is recognizable from Pass 1; the granularity is different.

Sequencer is again the most common pattern at this altitude. Every workflow with multiple steps that depend on each other is a Sequencer. The methodology's discipline on chain length (four or five steps before extraction) applies at workflow altitude too; longer workflows extract named sub-Sequencers — `executeCancellation`, `finalizeCancellation` — and the outer workflow body composes those.

### Fork-Join becomes common

At use-case altitude, Fork-Join was present once in *buy ticket* (the parallel checks). At workflow altitude, parallel composition is more frequent. Invalidating the ticket and sending the cancellation confirmation run in parallel at the end of the cancellation-and-refund workflow. Pre-flight checks (eligibility, fraud screen, availability) in some workflow variations run in parallel as their own Fork-Join. The compensation Aspect, when unwinding multiple committed steps, may run their inverses in parallel if no inverse depends on another.

The pattern's structure is unchanged: `Promise.all(...)` (or `Promise.allOrCancel(...)`) joins parallel use case invocations into a tuple; `.map` builds the next workflow context; `.flatMap` proceeds to the next step. The frequency increases because workflows have more independence between their constituents than use cases have between their internal steps.

### Iteration earns its first strong appearance

Pass 1 noted Iteration as absent in *buy ticket*. At workflow altitude, Iteration is load-bearing.

```java
return findExpiredHolds.apply(sweepCriteria)
                       .flatMap(holds -> Promise.allOf(holds.stream()
                                                            .map(releaseHold::apply)
                                                            .toList()));
```

The *process expired holds* workflow iterates over the collection of holds whose expiry has passed, applying *release hold* to each. The methodology's Iteration primitive uses `Promise.allOf` to collect results — `allOf` is the collection-shaped sibling of the fixed-arity `Promise.all` used in Fork-Join: `all` joins a known set of heterogeneous promises into a tuple, `allOf` joins a homogeneous collection into a list. Failure-fast or all-or-cancel variants apply depending on policy.

Iteration appears in several workflow shapes:

- **Sweep workflows.** A scheduled trigger fires; the workflow loads a collection of items needing the same action; the workflow applies the action to each.
- **Multi-item business workflows.** A group booking workflow iterates over the seat selections, acquiring a hold for each, then confirming each. The trigger is one customer's request; the work decomposes into N parallel or sequential sub-workflows per seat.
- **Batch processing.** End-of-day reconciliation iterates over the day's bookings, applying audit and ledger entries.

Iteration's body is itself a use case (or a sub-workflow). The methodology's discipline is that the body of the Iteration is a single coherent step from the iteration's point of view; the body's internal complexity is not the iteration's concern. Iteration is the same primitive at every altitude; what varies is what gets iterated over and at what granularity.

### Condition surfaces in workflow routing

Workflows branch on business-level decisions more often than use cases do. Premium customers route to expedited fulfillment; regular customers route to standard fulfillment. Members-only events route through the membership-check workflow; general-sale events skip it. A booking with a group discount routes through the group-pricing workflow; a single-seat booking routes through the standard-pricing workflow. Each branch is a typed Condition; each branch leads to a different sub-workflow.

The methodology's discipline holds: the Condition operates on a typed sum (`CustomerTier.Premium | CustomerTier.Standard`, `EventSaleType.MemberOnly | EventSaleType.GeneralSale`), not on a Boolean. The branch dispatches on the variant. The methodology declines pattern-matching primitives beyond what the host language supplies; the Condition reads naturally as a typed switch.

### Aspects become load-bearing

At use-case altitude, Aspects were mostly handled by the runtime: the use case body itself was free of cross-cutting concerns, and the runtime around it injected logging, tracing, retries, and idempotency through Leaf wrappers. At workflow altitude, Aspects rise to the workflow body itself.

- **Audit trails.** Many workflows emit audit events at each step. The audit emission is itself a use case (`EmitAudit`) but the workflow's policy about when to emit, what to include, and how to handle audit failures is an Aspect: the workflow's body declares the audit policy at composition time, and the runtime applies it uniformly across the workflow's steps. Audit-as-data and audit-as-Aspect are the two valid encodings; the methodology recognizes both.
- **Idempotency keys.** Workflows that may be retried (the customer resent the booking submission because the original timed out, an upstream proxy replayed the trigger, the workflow's own compensation re-fired) need idempotency keys to prevent duplicate effects. The idempotency Aspect intercepts the workflow's trigger, checks against the workflow's idempotency store, and either reattaches to an in-progress workflow or starts a new one.
- **Correlation IDs.** Cross-workflow tracing requires correlation IDs to propagate through use cases. The Aspect injects them at the workflow's entry and propagates them through every use case invocation.
- **Compensation.** The compensation Aspect named earlier is itself an Aspect: it declares inverse mappings at workflow construction time and applies them when the workflow's forward chain short-circuits.
- **Retry policy.** Workflow-level retry handles transient failures of individual use cases. The retry Aspect declares which failure variants are retryable and the backoff strategy.

Aspects compose in order, and the order matters: each Aspect's scope of measurement is determined by what it wraps. The use-case-altitude Aspects (metrics, timeout, circuit breaker, retry, rate limit) wrap the use cases inside the workflow; the workflow's own Aspects (idempotency, compensation, correlation, audit) wrap the workflow body and apply at workflow boundaries. The full wrapping convention — which Aspect wraps which, and why — is settled in the Architecture Synthesis module; at workflow altitude the methodology asks the team to be explicit about which Aspects live where, and the runtime supplies the orchestration.

### Leaf at workflow altitude

Leaves are usually use-case-altitude objects. At workflow altitude, the workflow's constituent use cases are themselves the Leaves from the workflow's perspective: atomic from the workflow's point of view, internally composed at their own altitude. A workflow whose decomposition has a single use case at one of its steps treats that use case as a Leaf; the workflow does not look inside the use case any more than a use case looks inside an external API call.

The fractal property is visible here. Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects compose at every altitude. The atomicity of a Leaf depends on the altitude observing it. From use-case altitude, a payment provider call is a Leaf. From workflow altitude, the payment authorization use case (which contains the Leaf and orchestrates retries and validation around it) is the Leaf. From subsystem altitude (Pass 3), the cancellation-and-refund workflow itself becomes a Leaf in the larger composition.

### What the pattern distribution shows at workflow altitude

The distribution this altitude earned:

- Sequencer: dominant. Most workflows are linear or near-linear compositions of use cases.
- Fork-Join: common. Parallel composition of independent use cases.
- Iteration: load-bearing. Sweep workflows, multi-item workflows, batch processing.
- Condition: present. Business-level branches between sub-workflows.
- Aspects: load-bearing. The workflow body itself declares its cross-cutting policy.
- Leaf: present but at workflow-internal granularity (use cases as Leaves from the workflow's perspective).

The shift from use-case altitude is visible. Iteration and Aspects move from absent or runtime-handled to centrally present. Sequencer remains dominant. Fork-Join becomes more frequent. Condition remains present at similar density. The shift carries information about what workflow altitude is for: composing autonomous use cases with explicit cross-cutting policy.

---

## Recovery-class selection at workflow altitude

Pass 1 noted that recovery selection at use-case altitude was driven mostly by reversibility and forward-progress value, with domain shape and coordination cost barely biting. At workflow altitude all four axes are active.

- **Reversibility.** Workflows commit to state that crosses use cases. The compensation Aspect's job is to reverse committed state; the workflow's commitment to reversibility is encoded in which use cases have inverses available and which do not.
- **Forward-progress value.** Workflows operating across longer durations or higher value transactions have stronger forward-progress preferences. A workflow that has already issued a ticket and only fails on notification does not roll back. The ticket is valid; the customer can present it; notification is retried. The forward progress is worth more than the rollback.
- **Domain shape.** Workflows in domains with strong immutability (event sourcing, append-only ledgers) have design-out options that workflows in mutable-state domains do not. A workflow whose state is an append-only stream does not compensate failures; it appends a corrective event.
- **Coordination cost.** Workflows that span autonomous use cases pay coordination cost for compensation. Each inverse use case may need to coordinate with external systems, may fail itself, may produce its own residuals. Workflows that stay inside a single use case's bounded transaction pay minimal coordination cost. The selection is governed in part by what the workflow's substrate provides.

Mixed strategies are normal; most workflows use more than one class, chosen per step by what the step's domain allows.

The cancellation-and-refund workflow uses BER as its forward path (the workflow's purpose is to revert), uses FER for residuals (the workflow names what cannot be reverted and proceeds anyway), and invokes design-out at the workflow-design phase rather than at runtime (delaying physical ticket issuance to reduce residuals during cancellation, for instance).

The temporary-hold workflow uses FER as its primary mode. The `Stale` state is the workflow's claim that degraded operation is acceptable in a defined band. This is supplemented by BER (released expired holds undo the original acquisition mechanically) and design-out (the typed `HoldState` sum is itself a design-out move: there is no Boolean-expired race because the state is queried as a typed value).

The methodology's discipline at workflow altitude is to walk all three classes for every workflow during design, naming where each applies. The full selection mechanism, with all four axes weighed against each other and mixed strategies declared per use case inside a workflow, lives in the Architecture Synthesis module after the spiral. At workflow altitude the selection is structured but not yet routinized; the methodology asks for explicit choice per workflow.

---

## Architecture surfaces at workflow altitude

The architecture decisions that surface at workflow altitude expand on the use-case-altitude ones. Per-use-case SLOs remain. Workflow-level SLOs join them. Consistency, idempotency, and cross-workflow coordination become explicit. Some questions deferred at use-case altitude are still deferred (persistence topology, deployment topology); others have force now (per-data-class consistency, idempotency expectations).

### Workflow-level SLOs

A workflow has its own SLO triple, distinct from any constituent use case's triple. The cancellation-and-refund workflow's latency target is the cumulative latency of its forward chain, including the longest plausible compensation if a downstream step fails. The throughput target is the rate at which cancellations flow through. The availability target is the workflow's terminal-state availability, which differs from the per-use-case availability because the workflow can succeed in a degraded mode — the cancellation committed and the refund initiated even when the confirmation message has not yet been sent — where a constituent use case failed.

For the cancellation-and-refund workflow (the numbers below are illustrative; in practice they derive from the Phase-4 elicitation treated in the Architecture Synthesis module):

- **Latency.** P50 under 3 seconds, P99 under 10 seconds, including compensation if the workflow short-circuits and unwinds. The customer is waiting on the cancellation outcome; the failure-with-rollback latency matters too.
- **Throughput.** 50 cancellations per second sustained; 200 per second peak burst — well below the purchase path, since cancellations are a fraction of sales.
- **Availability.** 99.9% during business hours, including degraded modes (a committed cancellation with the confirmation message still queued counts as availability).

These differ from any single use case's SLOs. The constituent *initiate refund* use case has tighter latency (it lives on the payment provider's SLA) but more relaxed throughput (most cancellation attempts that fail eligibility never reach the refund step). The workflow-level SLO is the customer-facing commitment; the use-case-level SLOs are the internal contracts that the workflow's composition must satisfy to meet its workflow-level number.

### Per-data-class consistency

Workflows write to shared state. The seat reservation store is written by *hold seat*, *confirm reservation*, *cancel reservation*, *release expired holds*, all from different workflows. The payment store is written by *authorize payment*, *capture payment*, *void authorization*, *initiate refund*. The ticket store is written by *issue ticket*, *invalidate ticket*.

Consistency questions surface per data class:

- **Reservations.** Within a single workflow, the workflow's body sees its own writes (a hold acquired in step 1 is visible in step 2's read). Across workflows, eventual consistency suffices for most reads (the booking workflow's hold is visible to the cancellation workflow's read after a bounded lag).
- **Payments.** Strong consistency required within a payment lifecycle. Authorize, capture, void must form a coherent sequence with no ambiguous intermediate states observable. Across workflows (the refund workflow reading an earlier authorization, for instance), eventual consistency is acceptable.
- **Tickets.** Once issued, the ticket store's read-after-write consistency matters for the validation flow (the ticket scanner reading at the venue must see the issued ticket). Time bound matters: under 1 second from issuance to scanner visibility.

The consistency choices attach to data classes, not to workflows directly. Phase 4's three answer scopes (per use case, per data class, per domain), developed in the Architecture Synthesis module, earn their workflow-altitude force here: data-class scope answers become first-class architectural inputs.

### Idempotency expectations

Workflows may be retried. The customer's client may resend the booking request because the original timed out; an upstream proxy may replay the trigger; the workflow's own compensation may re-fire. The workflow has to declare which constituent use cases are idempotent (safe to retry without duplicate effects) and which require idempotency keys to deduplicate.

- *Hold seat*: requires idempotency key. Without one, a retry could attempt to acquire a second hold on the same seat for the same customer.
- *Authorize payment*: requires idempotency key passed through to the payment provider (most providers support idempotency tokens directly).
- *Confirm reservation*: idempotent by domain — confirming an already-confirmed reservation is a no-op.
- *Issue ticket*: requires idempotency key. Without one, a retry could issue a second ticket for the same booking.
- *Notify customer*: idempotent at the notification provider level if a correlation key is passed.

The idempotency Aspect carries the key propagation and the deduplication policy. The workflow's contract with its caller is that retries with the same idempotency key produce the same outcome (success or failure variant), and retries with different keys produce independent attempts.

### Cross-workflow coordination

Some workflows produce events that other workflows consume. *Buy ticket* produces a "booking completed" event that the analytics workflow consumes. The cancellation-and-refund workflow produces a "cancellation completed" event that the loyalty workflow consumes (to credit the customer with whatever consolation the program offers). Cross-workflow coordination is the question of how these events flow.

At workflow altitude, the methodology names the coordination question but defers the answer. The substrate choice (direct calls between workflows, event-based publication, durable message queues, hybrid combinations) is a Phase-5 architectural decision that the Architecture Synthesis module fully treats. At workflow altitude, the workflow declares its outbound events (typed records emitted on success and failure) and its inbound triggers (typed events the workflow subscribes to); the substrate that carries them is decided at architecture synthesis.

### What is deferred

The questions Pass 2 does not yet have force to decide:

- **Subsystem boundaries.** Workflows cluster into subsystems; the clustering is the next altitude. At workflow altitude, all workflows are treated as if they share a substrate.
- **Persistence topology for cross-workflow data.** Where does the reservation store live? One database for all workflows? Separate stores per workflow with replication? The question has weight only when subsystem boundaries are explicit.
- **Composition substrate.** Direct vs event-based vs hybrid for cross-workflow coordination. Same deferral: substrate decisions belong to Architecture Synthesis.
- **Deployment topology.** Workflows-as-services, workflows-as-functions, workflows-in-a-monolith — the choice belongs to subsystem-altitude and architecture-synthesis considerations.

The deferrals are honest about what the altitude has earned. Pass 3 brings subsystem boundaries; Architecture Synthesis brings the substrate decisions.

---

## Closing — subsystems are next

This pass has shown workflows. Workflows compose use cases. Workflows have their own typed shapes, their own failure modes, their own architecture decisions. The compensation discipline that *buy ticket* hinted at in Pass 1 became load-bearing. The time-as-decay shape that the methodology has been claiming became typed and operational. The saga reduction took its position as a recognized composite rather than a new primitive.

The workflows in this pass are not unrelated to each other. The cancellation-and-refund workflow, the temporary-hold workflow, and the *buy ticket* use case all interact with the seat, the customer, the payment, the ticket. They live in the same operational space; they share value objects; they share resource contention. They are not, however, indistinguishable from other workflows in the system. The pricing workflow that computes the seat's price tier from event-pricing rules looks different from the booking workflows; it interacts with the event's pricing model, not with the customer or the payment provider. The event-management workflow that opens an event for sale, adjusts capacity, or cancels an event looks different from the pricing workflow; it operates on the event's lifecycle, not on per-customer transactions.

The workflows cluster. Cancellation-and-refund, temporary-hold, group-booking, gift-purchase, together with the *buy ticket* use case that starts the lifecycle: these are all booking work, because one business change — what a reservation is, how holds and confirmations and cancellations relate — forces all of them to change together. They contend over the same seats and holds, but that contention is a symptom of the shared change driver, not its cause; the shared-data view has the arrow backwards, here as it did when workflows formed from use cases. Pricing workflows cluster differently, around the pricing model: change how demand maps to price or how tiers are defined and every pricing workflow moves while the booking workflows stay still. Event-management workflows cluster differently again, around the event's lifecycle: event creation, capacity adjustment, schedule management move together and leave the other two clusters untouched.

The clusters are subsystems. The methodology does not impose subsystem boundaries; they emerge from change-driver cohesion one altitude up: workflows group into a subsystem when a single coarser business change would force them all to change together. At subsystem altitude, the methodology applies again — same six properties, same six patterns, same four shapes, same recovery triple — at the granularity of subsystem-level concerns. Business cross-cutting becomes load-bearing because there are domain reasons for things to happen across subsystems. Aspects rise to subsystem-level orchestration. Architecture decisions about persistence topology and substrate choice become forced because workflows that span subsystems cannot pretend to share a substrate any longer.

The next pass walks subsystem altitude.

---

*Threads advanced: 1 (compositional complexity), 2 (deterministic rules), 6 (knowledge preservation), 8 (observable by construction), 9 (failure modes), 14 (telescope).*
