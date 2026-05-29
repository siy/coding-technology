# Chapter 7 — Process-First, Not Entity-First

*Threads: 5 (legibility asymmetry), 6 (knowledge preservation), 14 (telescopic composition)*

---

## The reframe

The previous chapters argued that entity-first design produces structural problems that two decades of accumulated practice has not resolved. This chapter is about the alternative — not as a critique of entity-first, but as a positive specification of how design proceeds when processes rather than entities are the primary unit.

The reframe is small enough to state in a sentence and load-bearing enough to deserve a chapter. **A business process is a named operation with a trigger, typed inputs, typed outputs, typed failures, and a composition of steps that produces the outputs from the inputs while handling the failures.** That is the design unit. Everything else in the methodology — types, patterns, architecture — exists to support working at that unit.

The unit is not abstract. *Place an order. Charge a card. Confirm a booking. Recompute an estimated delivery time. Notify a customer of a route change.* Each of these is a process. Each has a name in the business's own vocabulary; each can be described to a domain expert without translation; each has a beginning, an end, and a defined notion of success and failure. The system being designed is a collection of these processes, plus the resources they need to do their work. The shape of the system is the shape of its processes.

This is what changes when the design unit moves from entity to process. The starting question changes. Entity-first design starts with "what are the entities, and what are their relationships?" Process-first design starts with "what does the system do, and what does each thing it does require?" Both questions are legitimate. They produce different code, different conversations, different failure modes, and different scaling characteristics. This chapter is about what produces what.

---

## What a process is

A process, in the sense this book uses the word, has six observable properties that are sufficient to specify it for design purposes. Each is named explicitly because the naming is what makes the process tractable to talk about across people who don't share implementation context.

The first property is the **trigger**. Every process starts with something specific: an HTTP request arriving at a particular endpoint, a scheduled timer firing, an event consumed from a queue, a user action in a UI, a sensor reading exceeding a threshold. The trigger is what causes the process to run. It is part of the process's identity; the same logical work triggered by an HTTP request versus a scheduled timer is two different processes, because they have different operational characteristics, different failure modes, and different rate-limiting concerns.

The second property is the **typed input**. The process needs some specific information to begin. The input is described as a type — a structure with named fields, each carrying its own type — and the type is specific to this process. The input type for *Place Order* contains exactly the information *Place Order* needs to start: a customer identifier, the items being ordered, the shipping address, the payment method. It does not contain everything the system knows about customers, items, addresses, or payment methods. It contains what this process needs.

The third property is the **typed output**. The process produces something specific when it succeeds. The output is also described as a type. The output type for *Place Order* might contain an order identifier, an order confirmation, and an estimated delivery time. It does not contain everything the system tracks about the order; it contains what callers of this process need.

The fourth property is the **typed failures**. The process can fail in specific, enumerable ways. *Place Order* can fail because the customer's payment was declined; because an item is out of stock; because the shipping address is invalid; because a downstream service was unavailable. Each of these is a named failure mode, and the set of failure modes is part of the process's specification. The set is finite and known at design time, not an open set of arbitrary exceptions.

The fifth property is the **steps**. A process worth designing typically has internal structure — sub-operations the process performs in sequence, in parallel, conditionally, or repeatedly. Each step is itself a process at the next altitude down. The composition of steps is part of the process's specification, not an implementation detail to be discovered later.

The sixth property is the **dependencies between steps**. Some steps must complete before others can start; some steps can run in parallel; some steps are alternatives to others. The dependency structure of the steps determines the composition pattern: sequential steps form a Sequencer; parallel steps form a Fork-Join; alternative steps form a Condition. The dependency structure is observable from the design, not an emergent property of how the code happens to be written.

Once these six properties are specified, the process is designed. Implementation follows from the specification with most of the architectural decisions already settled. The implementation is the writing-down of what the design already said.

These six properties describe a process at use-case altitude. At lower altitudes — sub-steps within a process — some properties collapse upward: a step is invoked by its enclosing process, so the trigger property belongs to the parent, not the step. At higher altitudes — workflows spanning multiple processes, or systems spanning multiple services — the same six properties apply, but the granularity differs and the dependencies structure grows. The full treatment of altitude variance is in Part III.

---

## Types belong to processes

The single largest consequence of the process-first move is that types stop being domain-wide and become process-local.

This is worth concentrating on, because it inverts a default that most working developers have absorbed without examining it. The default, inherited from entity-first traditions, is that there is one definition of each domain noun. There is one Customer class. There is one Order class. There is one Account class. These shared definitions are used across the system; every process that needs to talk about a customer uses the same Customer type, every process that needs an order uses the same Order type, and so on.

The Seat example is the cleanest illustration of why this default produces problems. Consider a venue-booking system with three processes that all interact with seats: booking a seat for a specific event, checking availability of seats in a venue, and pricing seats by category.

The booking process needs to know about *a specific location*. A seat in booking is identified by its row and number within the venue. The booking process records that this customer is sitting in this specific row and number for this specific event. The information the booking process needs about the seat is its row and its number. The behavior it performs on the seat is selecting it and committing it to the customer's booking.

The availability process needs to know about *a time-bounded hold*. A seat in availability is identified by an internal identifier and has a reservation status — held until a particular time, or available, or sold. The availability process keeps track of which seats have temporary holds and when those holds expire. The information the availability process needs is the seat's identifier, its current state, and its expiration time if any.

The pricing process needs to know about *a fare category*. A seat in pricing is identified by its category — premium, standard, economy, accessible — and the pricing rules that apply to that category for the event being priced. The pricing process does not care which physical seat is being priced; it cares about the category. The information the pricing process needs is the seat's category and the base rate for that category in the event's pricing schedule.

These three processes have three different notions of what a seat is. The information they each need is different. The behavior they each perform is different. The invariants they each enforce are different.

In entity-first design, these three processes have to share a Seat class. The Seat class either grows to contain every field any process needs — row, number, identifier, state, expiration, category, base rate — and becomes a god-object that no individual process actually wants, or it becomes a thin data carrier with all three processes' behavior pushed out into services that each have to load and interact with the thinly-defined entity. Either way, the design pays for the shared definition with structural cost it did not need to pay.

In process-first design, the three processes get three different types. The booking process has a `SeatLocation { row, number }`. The availability process has a `SeatHold { id, state, expiresAt }`. The pricing process has a `SeatCategory { id, category, baseRate }`. Each type contains exactly what the process using it needs. None of the types reference each other. None of the processes share state through these types.

What the processes do share — what they actually have in common — is the underlying physical seat, which has a row, a number, an identifier, a state, and a category, persisted in the database in whatever form the persistence layer needs. The database is the convergence point. The three processes meet at the persistence layer; they do not meet at the type layer. The structural sharing happens where shared structure naturally lives, not where the design pretended it lived.

This is the move that removes the entity-first failure modes. There is no god-object Seat because there is no shared Seat. There is no anemic Seat because each process owns its own types and the behavior naturally lives with the types. The mapping layer between request DTOs and entity classes goes away because there are no entity classes to map to — the request DTOs *are* the types the process uses. The aggregate-boundary debate goes away because there are no aggregates to draw boundaries around; each process has its own scope, and the scope is the process itself.

The reframe trades one structural assumption for another. Entity-first assumes nouns have shared definitions. Process-first assumes verbs do. The trade pays off because business reality matches the second assumption more often than the first.

---

## What stays shared

The reframe is sometimes mistaken for a position that nothing should be shared across processes. That is not the position. Some types are genuinely shared because they genuinely mean the same thing across processes. The reframe distinguishes the genuinely shared from the speculatively shared.

An email address means the same thing in registration as it does in login as it does in password reset. The validation rules are the same. The textual representation is the same. The invariants — non-empty, syntactically valid, normalized to lowercase — apply uniformly. A shared `EmailAddress` value object is appropriate. The sharing reflects real common meaning, not a design assumption that hopes for commonality.

A monetary amount means the same thing in pricing as it does in payment as it does in refund processing. The amount has a currency, follows the same arithmetic rules, supports the same comparisons. A shared `Money` value object is appropriate.

An identifier — for a customer, an order, an account — means the same thing wherever it appears, as long as the identifier is used opaquely. A `CustomerId` that is just a typed wrapper around a string or a UUID can be shared safely; any process can hold one without depending on what the rest of the system thinks customers are. Identifiers travel; the things they identify do not need to.

These shared types tend to be small. They have a few fields, well-defined invariants, and no behavior beyond enforcing those invariants and supporting basic operations. They are value objects in the term-of-art sense — equality is by content, instances are immutable, construction is validated, the type carries one piece of domain meaning and no more. The shared type system at any given altitude is a small set of these, plus whatever the local processes contribute as process-owned types.

The distinction the reframe makes is between *value objects*, which can be shared freely because they carry one well-defined piece of domain meaning, and *entities*, which cannot be shared because the same noun in different processes is not the same thing. Value objects are sharable; entities are not. The discipline is recognizing the difference, and it is usually obvious once the question is asked: does this concept carry one piece of validated meaning, or does it carry different meanings in different processes? The first is a value object; the second is an entity, and it should not be a shared type.

Persistence design is not subordinated to nothing by this reframe — it is sequenced. Process semantics are specified first; the persistence model is derived from process needs once those needs are stable. Where multiple processes converge on the same physical records, persistence design captures that genuine convergence — the shared table, the shared schema, the write-through semantics that the processes really do require. Where processes do not genuinely converge, the persistence layer honors the separation rather than forcing it. For data architects, the work is not denied; the sequence is different. The persistence model is derived evidence of process structure, not the premise from which process structure is inferred.

---

## Composition is the design

When processes are the design unit, the composition of steps inside a process is the design. Not a layer of code on top of a separately-specified design — the composition itself.

This has consequences for how design artifacts work. In entity-first design, the design is captured in a class diagram or an aggregate boundary diagram or a database schema or some combination, with the implementation derived afterward. The design and the implementation are separate artifacts; the design has to be kept in sync with the implementation, and the synchronization is a known source of failure.

In process-first design, the composition of steps is visible in the code itself. A process implementation reads as a sequence of named steps, with the composition pattern (sequential, parallel, conditional, iterative) showing in the syntax. The design and the implementation are the same artifact. There is no separate design document that can drift out of sync; the code is the design.

This works because the composition patterns are themselves named. A sequential composition is a Sequencer, recognizable by the chained dependency structure. A parallel composition is a Fork-Join, recognizable by the joining of independent results. A conditional composition is a Condition, recognizable by the branching on a typed decision. An iterative composition is an Iteration, recognizable by the repeated application of a step to a collection. Each pattern has a structural signature in the code, and the signature is what the pattern is named for.

A reader looking at a process implementation sees: a sequence of steps, in a recognizable composition pattern, each step typed in the process's own type vocabulary, with failure modes propagating through the type system. The implementation is legible at the design level because the design level is what the implementation actually expresses. The reader does not have to consult an external design document to understand the structure; the structure is explicit in the code.

This is what makes process-first design distinctive: the code reads like a description of the work itself, using the same words the team already uses to talk about it. There is no separate specification to maintain — the implementation is the specification.

Durable-execution runtimes and workflow engines are substrate choices for certain Phase-5 deployment vectors; they are addressed in Part IV and are not the process-design unit itself.

---

## How design conversations change

The reframe changes the conversation between developers and stakeholders in a specific and visible way.

In entity-first design, the design conversation is usually about nouns. *What is a Customer? What fields does an Order have? Where do we draw the line between an Order and an Invoice? Should a Booking know about the Reservation it created, or only the other way around?* These conversations are abstract; they require the stakeholder to think about the system in terms of its data structures rather than its behavior; they tend to produce design decisions that look reasonable on a whiteboard and produce structural problems several months into implementation.

In process-first design, the conversation is about verbs. *What happens when a customer places an order? What can go wrong, and what should happen in each case? How do we know the order succeeded? What information do we need to start? What information does the caller get back?* These conversations are concrete. The stakeholder thinks about them in terms of the business process they already manage; the developer hears them in terms of the type signature they are going to write. The conversation produces design decisions that map directly to code.

The shift is not just about which questions get asked. It is about which questions are *answerable* by the stakeholder. A stakeholder asked what a Customer is can give a list of attributes, and the list is shaped by the stakeholder's incomplete knowledge of what the system needs. A stakeholder asked what happens when a customer places an order can give an account of the process they manage, and the account is shaped by their direct experience of the work. The conversation about verbs is grounded in the stakeholder's expertise. The conversation about nouns is grounded in the developer's assumptions about how to represent that expertise.

The shift to verbs-first conversations is what the reframe buys at the design-conversation layer. A stakeholder asked what their team does describes work they manage. A stakeholder asked what shape their entities take produces a translation rather than a description. The verb conversation is grounded in the stakeholder's expertise; the noun conversation is grounded in the developer's modeling choices. What happens after the conversation — design quality, verification outcomes, project trajectory — depends on factors no methodology controls.

The shift, when it happens, is not because the team got better at meetings. It is because the methodology asks the right question first, and the right question produces answers the stakeholder can give.

---

## Where this came from

The process-first reframe is a discovery rather than an invention. The previous chapter surveyed six practitioners across five languages who arrived at structurally similar conclusions independently. They were not following a methodology when they did this. They were running into the same structural problems entity-first design produces, applying their own engineering judgment to the problems, and arriving at process-first as the response that made the problems tractable.

The convergence indicates that the reframe is robust under independent rediscovery. Senior practitioners working in different ecosystems, on different problems, without coordination, kept arriving in the same place. That is the empirical signal that the reframe is identifying something real about how software at the application layer naturally wants to be structured, rather than a stylistic preference that depends on the methodology's marketing.

PFD formalizes the reframe with explicit vocabulary. The six properties of a process, the per-process type discipline, the named composition patterns, the distinction between value objects and entities — these give working teams a way to talk about the reframe precisely, train new members on it, and detect when their implementation has drifted from it. The formalization does not replace the engineering judgment that produced the reframe independently in many places; it lowers the cost of acquiring the judgment to where smaller, less senior teams can adopt the discipline without first having to rediscover it.

---

## What the move buys

Process-first design buys, in order: a starting question whose answer comes from the stakeholder rather than the developer, a type discipline that scales linearly with the number of processes rather than combinatorially with the number of process-entity intersections, an implementation that reads as a description of the work it does, design conversations grounded in business reality, and a structural assumption that matches how teams that have grown past entity-first friction already think about their systems.

What it does not buy is freedom from design judgment. A team using process-first design still has to identify the right processes, decompose them into the right steps, manage the right boundaries between processes that share resources, and make the architectural trade-offs that follow from the situations they are actually in. The methodology does not remove the work. It changes what the work is about. The work shifts from compensating for entity-first structural problems to making the design decisions a methodology is supposed to help with.

This is what an industrialized vocabulary at the application layer offers when its primary unit is correctly chosen. The reframe described in this chapter is the choice. The vocabulary and the patterns that operate on processes designed this way are what the rest of this book describes.
