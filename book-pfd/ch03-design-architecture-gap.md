# Chapter 3 — The Design-Architecture Gap

*Threads: 5 (legibility asymmetry), 6 (knowledge preservation), 15 (standardization)*

---

## What DDD got right

Domain-Driven Design was, in its original articulation, a serious engagement with the methodology question. It supplied names software practice had been needing: bounded contexts, ubiquitous language, context maps, the strategic-versus-tactical distinction, anti-corruption layers between subsystems whose models did not align. These were not minor contributions. They identified real phenomena working teams had been encountering without vocabulary, and gave the field a way to talk about them precisely.

The strategic layer of DDD was the more important contribution. Software design, the strategic argument ran, is about modeling business reality, and that modeling has to happen at scales above the level of individual classes. A system serves many business concerns; each concern has its own coherence; the boundaries between concerns are load-bearing architectural facts. Bounded contexts named those boundaries. Context maps named the relationships between them. Ubiquitous language named the discipline of using domain terms consistently within each context, with translation happening at the boundaries rather than within. The strategic vocabulary brought new precision to conversations about domain modeling.

The strategic layer also named, indirectly, the methodology question this book is built around: software design is not a single-altitude activity. It happens at the scale of an individual operation, at the scale of a coherent concern, at the scale of an entire system, and at scales above. Each altitude needs its own vocabulary and its own derivation. DDD recognized this. The recognition mattered. Without it, the field would have stayed stuck on tactical concerns far longer than it did.

This chapter is not a criticism of DDD's contributions. The contributions were real and the field is better for them. The chapter is about a specific gap between the contributions and what was needed to make them productive at scale, and about the consequences of that gap as the methodology entered widespread adoption.

---

## Strategic vocabulary without strategic practice

The gap is in the methodology's strategic layer, and it is specific. DDD gave the field the *vocabulary* of strategic design without giving it a *procedure* for strategic design.

A team that absorbs DDD's strategic content learns to ask: what are our bounded contexts? Where are the seams between them? Which contexts are core domains, supporting domains, generic? What is the ubiquitous language inside each context? These are the right questions. They are also questions for which DDD's own materials offer little procedural guidance. The materials describe *what* a bounded context is; they do not describe *how* a team finds theirs. They describe what a context map looks like; they do not describe how a team derives one from the actual situation in front of them. They describe ubiquitous language as a goal; they do not describe the mechanism by which a team converges on one.

The strategic layer was, in effect, descriptive. It named good outcomes — well-chosen contexts, accurate maps, consistent language — without specifying the steps that produced those outcomes. Teams reading the strategic material were left to fill in the procedure themselves. Some teams, especially small senior ones with strong domain expertise, did this competently. They had enough taste and experience to make strategic judgments by intuition, and DDD's vocabulary gave them a way to communicate those judgments to others. For teams without that depth on the bench, the strategic material was harder to use. They knew what good outcomes looked like. They did not know how to get there.

The natural response to a vocabulary without a procedure is to substitute taste for procedure. The teams that adopted DDD strategically generally meant well; their strategic decisions were typically informed by some combination of the technical lead's instincts, the architecture review board's preferences, and whatever the most recently-read book happened to recommend. The decisions were often defensible. They were almost never derivable in a way that another team could reproduce. Strategic DDD became, in practice, a discipline of senior judgment with shared vocabulary — a real improvement over no shared vocabulary, but not the systematic strategic practice the methodology's framing implied.

This is the strategic gap. The vocabulary delivered. The practice did not. The shortfall was not in DDD's intellectual content; it was in the absence of procedure that would have made the content reproducible.

---

## The tactical layer became load-bearing

When a methodology's strategic layer is descriptive and its tactical layer is prescriptive, teams gravitate to the tactical layer. The tactical layer offers concrete instruction: aggregates, entities, value objects, repositories, domain services, factories, application services. Each tactical pattern has a definition, a purpose, and a recognizable shape in code. A developer can read a chapter on aggregates and produce code that looks like an aggregate. A developer reading a chapter on bounded contexts cannot produce a bounded context the same way; the bounded context has to come from elsewhere, from the strategic work the team is supposed to have already done.

In the typical adoption of DDD, the strategic work did not get done — not at the depth the methodology presumed. The team adopted the tactical patterns, applied them to whatever architectural divisions already existed (often inherited from organizational structure or earlier technical decisions), and called the result DDD. Aggregates became the load-bearing structural unit. Entities and value objects organized the type system. Repositories sat between domain and persistence. Domain services held the behavior that did not fit cleanly inside aggregates. The tactical patterns were real and they were doing real work. They were also doing it in the absence of the strategic foundation that was supposed to be underneath them.

The consequence was that the tactical patterns became "DDD" in practice for most adopting teams. The strategic layer faded into a backdrop — invoked rhetorically, rarely applied. A team's "DDD project" was, predominantly, a project organized around aggregates and repositories. The bounded contexts were whatever the team's existing service boundaries already were. The ubiquitous language was whatever vocabulary the team happened to use. Strategic decisions that should have been derived were instead inherited from history.

The tactical patterns also acquired their own ecosystem of "how to do it badly" warnings within the first decade of adoption. Anemic domain models — entities reduced to data carriers without behavior — became the most-cited failure pattern. Repository misuse, aggregate boundaries drawn around the wrong concerns, and service classes that absorbed all behavior were the close runners-up. Each of these failure patterns had a real diagnosis. None of them had a clean fix that did not require strategic work the methodology had not equipped teams to do.

---

## Bounded contexts as microservices

The largest practical consequence of the strategic gap appeared when DDD's vocabulary collided with microservices adoption.

The collision was natural. Microservices needed a principle for drawing service boundaries; DDD had a vocabulary for boundaries between coherent concerns; therefore, bounded contexts became the recommended boundary unit for microservices. The recommendation was widely adopted, including in materials from authors who had been involved with both methodologies. The combined recommendation — "draw your microservices around your bounded contexts" — became an industry default within a few years of microservices' broader adoption.

The recommendation was correct in principle and disastrous in practice. Correct in principle, because if a team had done the strategic work to identify their actual bounded contexts, those would have been good service boundaries. Disastrous in practice, because most teams had not done the strategic work and did not have a procedure for doing it. The recommendation became, operationally: "draw your microservices around whatever you call your bounded contexts," and what teams called their bounded contexts was typically what they had already organized around — existing teams, existing modules, existing organizational fault lines.

The result was distributed monoliths. Services so tightly coupled to each other that they could not be deployed independently, scaled independently, or modified independently. Services whose interfaces required coordinated changes across team boundaries every time a feature traversed multiple of them. Services that paid every cost of microservice architecture — network overhead, distributed transaction problems, operational complexity, compatibility maintenance — without delivering any of the benefits the architecture was supposed to provide. The benefits of microservice architecture depend on services being genuinely independent. Distributed monoliths were services that were nominally independent and operationally inseparable.

The diagnosis at the time, when it was offered at all, was that teams had failed to find the right bounded contexts. The diagnosis was technically correct and methodologically empty. The teams had not failed to find anything; they had drawn their service boundaries with the procedure they had, which was the procedure DDD provided, which was no procedure at all. The strategic gap that was tolerable when the consequences were "your tactical patterns are working in a strategic vacuum" became severe when the consequences were "your services cannot be deployed independently and your organization is paying microservices costs for monolith outcomes."

The distributed-monolith failure pattern was not a misapplication of DDD. It was the predictable consequence of DDD's strategic gap meeting an architectural style that demanded strategic decisions DDD had not equipped teams to make.

---

## Where entity-first modeling breaks

The strategic gap is the first half of the diagnosis. The second half lives one altitude lower, in the tactical patterns themselves, and is harder to see because the tactical patterns are concrete enough that they appear to be working even when they are not.

The tactical patterns assume that an entity — a thing in the domain with identity, lifecycle, and behavior — has a single coherent definition. The Account entity. The Order entity. The Customer entity. Each has its attributes, its operations, its invariants. The tactical patterns then organize the rest of the system around these entities. Aggregates group related entities under a single consistency boundary. Repositories load and save them. Domain services coordinate behavior that crosses aggregate lines. The entire structure rests on the assumption that the entities themselves are stable, single-definition objects that the rest of the system can build around.

In real domains, entities are not single-definition. The same noun carries different obligations in different processes. An Account in a money-transfer flow needs balance, currency, and the rules governing whether a transfer can debit it. An Account in a fraud-screening flow needs identity-confidence signals, behavioral history, and the rules governing whether activity on it warrants a hold. An Account in regulatory reporting needs jurisdiction, account-type classification, and the rules governing what gets reported to which authority. The processes share a name. They do not share a definition. The information each process needs about "the same account" is different, the operations each process performs are different, the invariants each process enforces are different.

Entity-first modeling forces teams to reconcile these processes into a single entity definition, and the reconciliation has two failure modes. The first is over-specification: the Account entity acquires every attribute and operation that any process ever needed, becoming a god-object that no individual process actually wants and that everyone has to load to do anything. The second is under-specification: the Account entity becomes a thin data carrier with the behavior pushed out into services that each handle one process's needs. The first failure produces aggregates so large they violate every aggregate-design principle DDD itself articulated. The second failure produces the anemic domain models DDD's own literature warned against. Both failures were widely encountered. Neither has a clean fix within the entity-first framing.

The fix is not within the framing because the framing is the problem. The same noun in different processes is not the same thing. Treating it as the same thing — building one Account class that all processes use — is a category error that the tactical pattern requires teams to commit. The error is invisible while the system is small enough that one process dominates and the other processes are afterthoughts. It becomes load-bearing as soon as multiple processes have comparable importance and each is constrained by the entity-first reconciliation.

This is where PFD parts company with DDD's tactical layer most cleanly. Process-first modeling treats each process as the primary unit. The information each process needs becomes a type belonging to that process. The operations each process performs become functions belonging to that process. The "entity" — the shared underlying domain concept — becomes a projection of process behavior, not the source. The shared coupling that entity-first modeling requires disappears, because nothing is shared across processes except the database that persists results, which is the convergence point and not the entity.

The reframe is small in description and large in consequence. It removes the load-bearing assumption that produced the anemic-versus-god-object dilemma. It removes the coupling that made entity-first modeling brittle under process variation. And it lines up cleanly with how domain experts actually describe the work — as processes that have outcomes, not as entities that have lifecycles.

---

## What's missing is procedure

The shape of DDD's strategic gap is now clear. The methodology delivered vocabulary at every altitude — strategic and tactical alike — without delivering a procedure for moving from a team's actual situation to the choices the vocabulary names. The tactical patterns acquired procedural depth through extensive code examples and by getting baked into frameworks. The strategic layer never got that procedural depth, and the tactical patterns rested on strategic foundations that, in most adoptions, were not actually built.

The consequences propagated unevenly. Teams with strong senior intuition did fine; the vocabulary helped them communicate decisions they would have made anyway. Teams without that depth got the tactical patterns running on whatever strategic decisions they happened to inherit, and produced systems with the visible shape of DDD and the structural problems that the methodology's strategic layer was supposed to prevent. The microservices-as-bounded-contexts move concentrated the consequences in a single highly-visible failure pattern, but the failure pattern was a special case of a general issue: a methodology lacking strategic procedure cannot scale to teams that need procedure rather than vocabulary alone.

What replaces a methodology with this gap is not a different vocabulary. It is the same kinds of vocabulary plus the procedure that lets a team move from situation to decision without relying on senior intuition. The procedure has to be teachable, reproducible, and fitting enough to the variety of real situations that a team in any given context can apply it without first having become senior in the methodology itself. That is what an industrialized application-vocabulary layer offers, and what a strategic discipline without procedure could not.
