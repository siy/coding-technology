# Service Boundaries Fall Where No Saga Crosses

I have written about the saga twice. In "Saga Is Not a Pattern" I argued it is not a primitive at all - it is a composition of simpler patterns (a sequence, a condition, a wrapped step) that we reified into a thing and then taught as if it were fundamental. In "The Saga is Antipattern" I argued the harder point: across microservices, the saga is compensation standing in for a consensus the services do not have, and it cannot deliver what a transaction would. If you need a saga across services, you most likely drew the boundaries wrong.

Both articles say what not to do. The question I kept getting back was fair: fine - then how do I draw the boundaries right?

This is the constructive answer. It is grounded in Process-First Design (PFD), and it turns "where do I split my services?" from taste into something you can derive.

## The rule, in one sentence

A deployable boundary must never cut through a transaction or a saga.

That is the whole rule. Everything below is where it comes from and how to apply it.

## Three altitudes, and where consistency lives

PFD organizes a system as a telescope of altitudes: a use case (one trigger, one outcome), a workflow (use cases composed toward one business outcome), a subsystem (a cluster of workflows), and the system. Ask one question at each altitude - where does consistency live? - and the answer is sharp and different at each level.

The use case is the transaction boundary. It is one trigger and one outcome: the largest all-or-nothing unit the system has. So it is the natural unit of atomicity - one use case, one commit, one rollback. This is the ceiling of ACID. Nothing larger is a single transaction.

The workflow is where coordination begins. A workflow is several use cases, each committing separately, usually over time, coordinated through persisted state - a state machine. The moment you have more than one independently committed transaction to reconcile, you need coordination, and that coordination is the saga. So the saga is a workflow-altitude phenomenon: it appears exactly when use cases compose into a workflow, and not before. (Keep external services out of it for clarity; inside a single use case writing one store, there is nothing to coordinate.)

Across subsystems, there is no transaction at all. Subsystems exchange typed facts - events - and each one manages its own consistency. There is nothing to coordinate transactionally across a subsystem boundary, so no saga forms there either. Eventual consistency, not a distributed transaction.

Put those together and the boundary rule falls out. A service is a deployable. If a transaction or a saga has to span two services, you have cut through a consistency boundary, and now you are using compensation to fake the consensus you gave away. So:

- The largest must-stay-consistent unit - a subsystem holding its workflow sagas - is the natural service.
- Splits fall at the seams where only facts cross, where eventual consistency is acceptable.
- The number of cross-service sagas you are forced into is an inverse measure of decomposition quality. Zero is not always reachable, but every one is a question.

## How to find the seams: change drivers

"Cut where only facts cross" tells you the shape of a good boundary. It does not tell you where the seams are. The seams are where the change drivers differ.

A change driver is a reason code changes - a force that, when it moves, forces the code to move with it. Group what changes for the same reason; separate what changes for different reasons. This is not a new idea; it is a criterion that independent thinkers keep rediscovering. Parnas, in 1972, said to decompose by hiding the design decisions most likely to change. Juval Löwy says to decompose by volatility, not by function. Yannick Loth's Independent Variation Principle partitions by change-driver assignment and shows the partition is a fact about causal structure rather than a preference. Five decades, three directions, one conclusion.

One limit belongs up front, because it bites hardest on service boundaries: the criterion governs where change is what governs. A trust boundary can require splitting things that change together, since merging them by change attribution would be the vulnerability itself. A concern that co-changes with everything - telemetry is the standard case - partitions nothing at all. Neither is a failure of the criterion; both are places where a different relation governs, and the honest move is to say which.

Where do you find the drivers? Two ways.

At the desk, ask: who, or what, would ask for this to change? Each independent authority is a driver - a team, a regulator, a partner on its own release schedule, a pricing policy. If two independent authorities can each demand changes to the same unit, that unit has two drivers and wants to split. Supporting questions sharpen it: what is the riskiest assumption that would ripple if it changed (Parnas); what varies over time for one customer and across customers now (Löwy); would a competitor use this component identically, or is the difference the driver (Löwy).

In an existing codebase, measure it. Your version-control history records how the system actually changed. Files that change together in the same commits share a driver; if they live in different modules, a driver is cutting across your boundary. Rank files by change-frequency times size to find the hotspots where drivers concentrate. Tools like code-maat automate the coupling analysis - the measurement is not new, going back to Gall in 1998 and Zimmermann in 2004, with Tornhill later productizing it as change coupling. Read it with one correction: co-change is partly endogenous, because files change together partly since the current structure forces them to, which makes raw co-change downstream of the very boundaries you are checking. Measure the co-change that crosses a boundary, and trust the coupling that survives a known restructure. With that correction it turns "where are the seams?" from an argument into a measurement.

## The example everyone has shipped: Order, Stock, Catalog

Here is the cut almost every team makes, and why it manufactures the saga it then cannot solve.

Checkout needs to create an order, reserve stock, and price from the catalog. The instinct - reinforced by a by-the-book reading of bounded contexts - is to make a service per noun: OrderService, StockService, ProductCatalogService. Now a single business outcome, checkout, spans three services. To hold it together you reach for a cross-service saga: reserve stock, create order, compensate on failure. And OrderService becomes the heaviest-changed code in the system, because promotions, fulfillment, and payment retries all touch "Order" while answering to entirely different drivers.

The saga is the symptom. The cut is the cause.

Look at the words. "Order", "Stock", "Catalog" are nouns - data. "Checkout", "replenish", "reprice" are verbs - change drivers. Cutting by noun fragments one change driver (checkout) across three services. Cut by driver instead and the picture inverts. The checkout transaction - reserve and place - stays whole inside one consistency boundary, a single use case, so its data stays co-governed and there is no saga. Pricing changes on the pricing team's cadence, so it becomes its own subsystem that publishes price facts. Replenishment changes on operations' cadence, so it becomes its own. The cross-service saga is gone - not because we engineered it away, but because the transaction no longer crosses a boundary.

Cutting by noun fragments a change driver across services. Cutting by driver keeps it whole.

## A fair word about bounded contexts

This is not a takedown of Domain-Driven Design. DDD's principle is exactly right: a consistency boundary should be a service boundary, and strategic design tells you to find subdomains, which - done well - are close to change drivers. What fails is the common practice of carving contexts by CRUD nouns. The same word "Order" means different things to checkout, to fulfillment, and to returns; forcing them into one context because they share a noun collapses three drivers into one service. Change-driver decomposition is the mechanical derivation that DDD's ideal aims at and its CRUD-context habit misses.

## The boundary you cannot see in the code

There is a second boundary that decides whether any of this survives contact with reality: your org chart.

Conway's Law says systems come to mirror the communication structure of the organizations that build them. Ruth Malan's sharper version: when the system and the organization disagree, the organization wins. So if your change-driver decomposition and your team boundaries diverge, the org boundary reasserts itself - as cross-team coordination for every feature, as co-change clusters that straddle teams, and, most tellingly, as sagas forced across team-owned services. The saga map is the org-misalignment map.

The good news is you can see it. Run the co-change analysis, map the clusters to teams, and a cluster that straddles two teams is a Conway signal: the wrong unit is being treated as the boundary of ownership. The fix is the inverse-Conway maneuver - shape the teams to the change-driver boundaries you want, rather than letting the existing chart shape the architecture.

And here is the uncomfortable, liberating consequence: most organizations have far fewer truly independent domains than they have "microservices". Often they have one. A single domain sliced into a dozen services along noun lines is a distributed monolith - paying network latency for the privilege of needing sagas. For most teams the right default is a modulith: one deployable, decomposed internally by change driver, that splits into services later, exactly where a distinct trigger, a distinct SLO, genuine independent operation, or a hard scaling difference justifies it. Because the internal boundaries already sit at the fact seams, that later split is a deployment decision, not a rewrite. (This is the bet behind Aether, the runtime in this ecosystem: write the business code boundary-agnostic, and defer the physical split until something earns it.)

## The whole thing, compressed

- The transaction boundary is the use case.
- Coordination - the saga - is a workflow concern, and it belongs inside a subsystem.
- Across subsystems there are only facts, never transactions.
- So a service boundary must never cut through a transaction or a saga; cut where only facts cross.
- Find those seams by change driver: who would ask for this to change, what varies, what the git history shows changing together.
- Cut by noun and you fragment a driver across services and need a saga to reassemble it. Cut by driver and the saga was never necessary.

Cut by change driver, and the avoidable sagas disappear. The ones that remain are the essential ones - and those were never the problem.
