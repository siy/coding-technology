# Chapter 6 — The Quiet Consensus

*Threads: 3 (industrialization), 5 (legibility asymmetry), 14 (telescopic composition), 15 (standardization)*

---

## The convergence nobody organized

Something has been happening in software design that nobody organized.

Practitioners from different languages, different domains, and different methodological traditions have been arriving at the same conclusion — independently, without coordination, often without knowing about each other's work. The conclusion is that business processes, not data entities, are the natural unit of software decomposition. The recommendation that follows from that conclusion is to design around what a system does, not around what a system has.

This was not a manifesto. There was no conference keynote, no working group, no organized announcement that a paradigm shift was underway. There was a slowly growing body of work from senior practitioners solving real problems who kept ending up in the same place. The work was published in different forms, in different venues, in different languages, addressed to different communities. Anyone reading widely across these communities would have noticed the family resemblance years ago. Anyone reading inside one community would have seen only their own author's particular framing of what they took to be a local insight. The convergence was hiding in plain sight.

This chapter is about that convergence. It surveys six practitioners whose published work, taken together, demonstrates the same structural adaptation across languages and traditions that had no reason to converge by coincidence. It then steps back from the individual treatments to name the shared pattern, and looks at the environmental pressures driving practitioners independently toward the same answer.

The point is not that these practitioners are correct because they agree. The point is that when senior people working in very different contexts arrive at structurally similar conclusions through independent paths, the conclusion has probably been examined under enough load to be worth taking seriously. The quiet consensus is what's left after a decade of methodology fashion has burned through. It's evidence of where the field has actually been going, regardless of where the discourse claimed it was going.

---

## The standard starting point

Before surveying what's changed, it's worth being precise about what's been changing from.

The dominant approach to backend design for the past two decades has been data-first. Identify the entities — User, Order, Product. Define their attributes and relationships. Build services that operate on shared definitions of those entities. The approach was formalized in the tactical patterns of Domain-Driven Design and reinforced by an entire generation of frameworks built around object-relational mapping. The pattern works in the sense that it produced shipped software. It produced enormous quantities of shipped software.

What it also produced, reliably, was a set of friction points that practitioners working at scale kept describing in similar terms. Entities grew into god-objects because every feature needed something different from the same concept, and the shared definition had to accommodate all of them. Mapping layers accumulated — request DTOs to entities to response DTOs — because the entity rarely fit any specific feature perfectly. Architecture discussions became long-running debates about aggregate boundaries: who owns what, how big should each aggregate be, where does this behavior belong, why is it suddenly a problem that two aggregates need to be updated in the same transaction. The "where does domain logic live?" question never settled — rich domain model, anemic domain model, transaction scripts, domain services — and each team picked differently, each project mixed approaches, and the answer changed depending on whom you asked.

These were not implementation failures. They were structural consequences of starting with data. The entity-first approach builds a system around shared definitions; behavior that does not fit cleanly inside a single entity has to live somewhere outside the entity layer; the somewhere keeps getting renamed and reorganized because nothing about entity-first design tells you where it should be.

The practitioners surveyed below all encountered these friction points in their own work. They all responded by inverting the starting assumption. They started with the process — the thing the system does — and let the data shape itself to the process. The inversion is small in description. It produces dramatically different code, and dramatically different conversations about code, when followed through consistently.

---

## Six practitioners, five languages, one structural answer

### Scott Wlaschin (F#)

Scott Wlaschin's work in the F# community is the clearest articulation of the type-driven version of the convergence. His book *Domain Modeling Made Functional* takes the position that domains are best modeled as workflows — pipelines of small functions, each with typed inputs and typed outputs — and that the type system itself carries most of what would otherwise need to be expressed as defensive coding or documentation.

The phrase most closely associated with his work, "make illegal states unrepresentable," captures the approach in five words. A type that admits no invalid values does not need code to defend against invalid values. A workflow built from such types, composed step by step, produces a system whose correctness is largely guaranteed by the types it threads together. Failure modes are explicit because they appear in the types; success paths are equally explicit; the workflow's shape is visible in its signature. A reader looking at the workflow definition sees what it does, what can fail, and what shape the output takes, before reading a single line of internal logic.

Wlaschin's framing was developed in F#, a functional-first language with deep support for algebraic data types and pattern matching. His examples are usually given in F# syntax. The underlying approach — workflows as the unit of design, types as the carriers of domain meaning, composition as the structural primitive — is language-independent. Working teams in Scala, Kotlin, modern C#, and increasingly Java have absorbed his framing and adapted it to their own ecosystems. The adaptation is straightforward. The conceptual move is what travels; the syntax follows.

### Debasish Ghosh (Scala)

Debasish Ghosh's *Functional and Reactive Domain Modeling* arrives at a similar place from inside the Scala community. His starting point is that domain behavior is most naturally expressed as compositions of pure functions over immutable data, with side effects made explicit through types rather than allowed to leak through method calls. The entity-service-repository pattern that Scala teams had inherited from Java was, in his analysis, a structural obstacle rather than a help; the work it took to make that pattern feel functional in Scala was work that the underlying functional approach made unnecessary.

His proposal centers on algebraic types and composition. A bank account is not a class with methods; it is a value with operations that produce new values. A transfer is not an event dispatched to a stateful service; it is a function that takes the current state and a transfer request, and returns the new state plus the effects required to make it durable. The composition of small functions produces the workflow. The workflow's shape is the design.

Ghosh's work is technically more demanding than Wlaschin's in places — Scala admits more sophisticated type-level machinery than F# does, and his book explores some of it — but the core proposal is the same one Wlaschin makes. The system is a composition of typed transformations. The transformations are the design. The entities, if they appear at all, are projections of what the transformations produce. The shared concept is not Account or Transfer; the shared concept is *workflow over typed values*.

### Jimmy Bogard (.NET)

Jimmy Bogard's contribution, developed in the .NET community, comes at the convergence from a different angle. His Vertical Slice Architecture argues that the right way to organize an application is by feature — each feature self-contained, with its own request and response types, its own validation, its own data access, its own composition — rather than by layer.

The traditional layered architecture organizes code horizontally: controllers in one folder, services in another, repositories in a third, domain in a fourth. A change to a single feature touches all four layers; a change that affects multiple features touches all four layers many times. The coupling is horizontal: every feature shares every layer with every other feature, and the shared layers acquire the union of every feature's needs. Bogard's argument is that this is exactly backward. Coupling within a feature is desirable; coupling across features is the problem. Organizing code by feature concentrates the within-feature coupling and minimizes the across-feature coupling, which is the inverse of what layered architecture does.

Each vertical slice in Bogard's framing is, in effect, a process. It has a request that triggers it, a sequence of steps it performs, and a response it produces. Shared abstractions are extracted only when proven necessary, not designed in advance based on speculation about what might be reused. The slice owns its types. The slice owns its composition. The slice is the unit of design.

His framing does not use the vocabulary of functional programming, and his examples are typically given in C# in a style that .NET developers from object-oriented backgrounds find immediately readable. The underlying structural move — process as the design unit, types per process, composition rather than layering — lands in the same place as Wlaschin's and Ghosh's, expressed in vocabulary that a mainstream .NET team can adopt without paradigm conversion.

### Sandro Mancuso (Java)

Sandro Mancuso, working in the Java community within the software craftsmanship tradition, articulates the convergence from yet another direction. His Interaction-Driven Design starts with external usage. What does the system have to do? Who interacts with it, and how? Once those interactions are pinned down, the internal structure of the system emerges from satisfying them. The domain model is not specified in advance and then expressed in code; it is discovered through the implementation of the interactions the system has to support.

This is a methodological inversion of the entity-first approach. Entity-first design assumes the domain has a structure that can be modeled before behavior is considered. Interaction-driven design assumes the structure is whatever supports the behavior the system needs to have. The behavior is the input. The structure is the output. A team designing interaction-first ends up with types and operations that exactly fit the interactions they are supporting, with no excess structure carried for hypothetical uses that may never materialize.

Mancuso's framing was developed inside the craftsmanship tradition, which emphasizes responsible practice — clean code, professional discipline, sustainable pace — and is sometimes treated as adjacent to but distinct from the more architectural or methodological work surveyed elsewhere in this chapter. The structural conclusion he reaches is the same conclusion, reached through different reasoning: the process is the primary unit; the structure follows the process; the entities, if they exist as separate concepts at all, are emergent rather than designed.

### Roman Weis (Java)

Roman Weis, also working in Java, takes a position that is in some ways the sharpest statement of the convergence: focus one hundred percent on behavior — the commands the system has to execute — rather than on the perfect aggregate root. The aggregate-versus-no-aggregate debate that has consumed enterprise Java for two decades is, in his analysis, a side effect of starting with the wrong question. The right question is what the system does. The answer to that question is a set of commands, each with inputs, outputs, and failure modes. Once the commands are specified, the data structures they need are determined; the aggregates, if any, are derived from the commands rather than designed in advance.

His framing is recognizable to teams that have absorbed CQRS principles, but it goes further than typical CQRS adoption. CQRS as usually practiced separates reads and writes while leaving the write side organized around aggregates; Weis's proposal is that the write side should be organized around commands directly, with aggregates becoming an implementation detail of specific commands rather than a primary design construct. The shift in emphasis — from "what shape are the entities" to "what does the system do" — moves the entire design conversation onto more productive ground.

What Weis shares with the other practitioners surveyed in this chapter is the inversion of the starting assumption. He starts with behavior; structure follows. The vocabulary he uses (commands, tasks) is different from Wlaschin's (workflows) or Bogard's (vertical slices) or Mancuso's (interactions), but the structural move is identical. They are all describing the same change in how the design conversation is sequenced, in vocabulary borrowed from whichever tradition they came up through.

### Rico Fritzsche (Rust/TypeScript)

Rico Fritzsche's contribution, working across Rust and TypeScript, focuses on what happens to entities when the process-first inversion is taken to its full extent. His position is that entities, in the sense the entity-first tradition meant them, do not exist as fixed structures at all. What exists are contextual manifestations — different views of "the same thing" needed by different processes — and the shared entity is a useful fiction that creates more coupling than it resolves.

His often-cited example is a Seat in a venue-booking system. A Seat in the booking process is a location to select — row and number, available or not. A Seat in the reservation process is a time-limited hold — identifier and expiration time. A Seat in the pricing process is a cost input — category and base price. These are three different types serving three different processes, sharing only a name and a referent. Forcing them into one Seat entity, as the entity-first tradition would require, either produces a god-object that no individual process actually wants or pushes the differences out into mapping code that has to be maintained as the processes evolve.

Fritzsche's framing is structurally identical to what the other practitioners describe, surfaced from a slightly different angle. Where Wlaschin emphasizes typed workflows, Ghosh emphasizes algebraic composition, Bogard emphasizes feature slices, Mancuso emphasizes interaction-driven discovery, and Weis emphasizes command focus, Fritzsche emphasizes the consequence for types: per-process types are not optional; the same noun in different processes is not the same thing; treating it as the same thing is a category error that produces the structural problems all the practitioners surveyed here have spent their careers documenting from one angle or another.

---

## What they share

Strip away the language-specific details and the individual vocabulary, and the shared structure becomes legible.

**Processes as the primary unit.** The decomposition unit of the system is a business operation with a trigger, inputs, outputs, and failure modes — not a data entity with attributes and relationships. The process is named after what it does, not what it manipulates. A process is *book cargo*, not *Cargo*; *transfer funds*, not *Account*; *publish article*, not *Article*. The verb-shape of the naming is itself a tell.

**Types belong to processes, not to the domain.** The data structures the process uses are shaped by what the process needs, not by what some abstract notion of the domain says exists. A User in registration has different fields than a User in authentication; an Order in placement has different fields than an Order in fulfillment. The shared name persists in the domain vocabulary; the shared definition does not persist in the code. Each process owns its types.

**Composition is the structural primitive.** Small, well-typed operations compose into larger workflows. The composition itself is the design — not a layer of code on top of a separately-specified design. A reader following the composition can see what the system does at the altitude they care about; the composition's shape carries the methodology's structural commitments.

**No shared domain model in the entity-first sense.** Domain knowledge is distributed across processes rather than centralized in entity classes. Genuinely shared types — email addresses, monetary amounts, identifiers — exist as small value objects with their own validation, but they are the exception, not the architecture. The default is per-process types; the shared types emerge from evidence of actual sharing, not from speculative design.

Each of these four commitments shows up in all six practitioners' work. The vocabulary differs. The technical mechanisms differ. The structural commitments are the same. That sameness, arrived at independently by people who were not coordinating, is the convergence this chapter is about.

---

## What's driving the convergence

Independent convergence implies shared environmental pressure. Several forces have been pushing practitioners toward process-first design simultaneously, regardless of which community or language they came up through.

The first force is the rise of distributed architectures. Microservices and serverless adoption have made it operationally costly to maintain shared entity models across deployment boundaries; the entity that everyone shares is the entity that requires coordinated change every time anyone needs a field different from what the entity currently has. Teams adopting these architectures discover that process-aligned boundaries work better than entity-aligned boundaries for the simple reason that processes are bounded by their inputs and outputs, while entities are bounded only by their definition, which keeps drifting as new consumers acquire new needs.

The second force is what scale reveals about entity-first friction. A small system with five services can share entity models without operational pain; the coordination cost is bounded by the number of teams. A system with fifty services pays the coordination cost on every entity change, and the cost compounds with the number of consumers. By the time a system reaches five hundred services — which is the scale several of the practitioners surveyed in this chapter have worked at — entity-first design is no longer feasible. Teams that grow past a certain inflection point independently discover that processes are the only boundary that scales, because process boundaries are local while entity boundaries are global.

The third force is the maturation of functional programming features in mainstream languages. A decade ago, expressing process-first design idiomatically required a language that supported algebraic data types, pattern matching, immutable data structures, first-class functions, and explicit failure modeling. That set of features was rare. Today it is mainstream: Java, Kotlin, C#, TypeScript, Rust, Swift, and modern Scala all support it, with idiomatic syntax that working developers can write without ceremony. What was theoretical or expensive in 2015 is practical and cheap in 2025. The practitioners surveyed in this chapter were partly enabled by their languages catching up to the methodological move they were already making.

The fourth force is the AI-assisted development environment described in the previous chapter. AI assistants work better on code with consistent vocabulary, predictable composition, and explicit type structure — the same properties process-first design produces. None of the practitioners surveyed designed their methodologies with AI assistance in mind; AI assistance came later, and it found their methodologies already aligned with its requirements. The alignment is not a design goal of any of them. It is a consequence of writing for human readers in a way that AI assistants happen to inherit.

These four forces, taken together, account for the convergence. The forces are not going away. Distributed architecture, organizational scale, language feature maturation, and AI-assisted development all continue to apply increasing pressure on entity-first approaches, and decreasing friction against process-first approaches. The expected trajectory is that more practitioners arrive at process-first conclusions, independently or by reading the practitioners surveyed here, in the years ahead. The convergence is not yet complete. It is, however, robust.

---

## Other structural answers

The six practitioners surveyed here represent one structural family. They are not the whole field.

Other communities have been solving the same distributed-systems friction from genuinely different starting points and reaching different structural conclusions. Event-sourcing communities treat the append-only event log as the primary substrate: everything else — projections, aggregates, read models — is derived from it. That is a coherent answer that scales and is actively practiced. Actor-model communities treat coordinated message-passing as the primary structuring discipline: the system's shape emerges from how actors are arranged, supervised, and composed. Also coherent, also actively practiced. Pure CQRS traditions use the command-and-read-model split not as one pattern among many but as the complete architectural skeleton. Hexagonal architecture traditions place ports and adapters as the load-bearing decomposition unit, with everything inside defined only by what the ports require. More recently, typed-effect-system traditions in functional languages treat effect tracking as the architecture itself — what a function can do, not just what it returns.

These are not wrong answers. They are structurally different answers, and any of them can be practiced with rigor and yield durable, comprehensible systems.

The convergence claim in this chapter is narrow: a specific structural family — process-first, per-process types, composition as the primitive — has been independently rediscovered across five languages by practitioners who were not coordinating. That independent rediscovery is evidence of the answer's robustness under varied conditions. It is not a claim that this family is the only viable answer, or that the field as a whole is moving toward a single methodology. Other structural families are coherently practiced, continue to evolve, and represent genuine alternatives, not failed attempts. The survey in this chapter is a survey of one family. The conclusion that follows from that survey is about that family's particular coherence and its observed trajectory — nothing wider.

---

## Why the consensus is quiet

The reason the convergence has been quiet is structural. There is no organization sponsoring it. There is no certification program built around it. There is no foundation, no conference circuit dedicated to it, no industry consortium driving adoption. Each of the practitioners surveyed in this chapter publishes their own work in their own venue addressed to their own community, and the family resemblance across their work becomes visible only when a reader steps back from the individual communities to look across them.

This is what makes the convergence credible rather than otherwise. When one person proposes a new methodology, the proposal is an opinion. When six people from different communities arrive at structurally identical conclusions through independent paths, the conclusions have been examined under more load than any single proposal could have been. The environmental pressures — distributed systems, team scaling, language maturation, AI-assisted development — are producing the same structural adaptation across the industry, and the practitioners surveyed here are the visible markers of an adaptation that is happening at every layer of the field below the headline level.

The consensus is quiet because it does not need to be loud. It is not replacing entity-first design overnight. It is doing what mature methodologies do: spreading through the channels where senior practitioners learn from each other, getting adopted by teams that try it and don't go back, gradually shifting the default that newer engineers absorb. The shift takes years. It is already several years into its progression, and the pace appears to be accelerating rather than slowing.

What this book describes is one synthesis of the convergence. Other syntheses are possible. The ones that gain traction will share roughly the same structural commitments the practitioners surveyed here have already arrived at, because the design space at this layer is small and the pressures producing convergence are not arbitrary. The work this chapter has done is to make the convergence visible — to name what has been happening, to credit the practitioners who arrived at it before any synthesis was available, and to note that the field has been moving in this direction for longer than the discourse has been describing. The remaining chapters describe the synthesis. The chapter the reader has just finished describes why the synthesis is not arbitrary.
