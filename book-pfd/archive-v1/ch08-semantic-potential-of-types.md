# Chapter 8 — Semantic Potential of Types

*Threads: 5 (legibility asymmetry), 6 (knowledge preservation), 11 (the interesting work), 14 (telescopic composition)*

---

## The language problem

Software has a language problem that is older than most of the methodologies that try to fix it. The problem is the distance between the language a domain expert speaks and the language the program uses to represent what the expert said. The expert says *"a customer may not exist"*; the program flattens this into a null check. The expert says *"placing the order might fail"*; the program flattens this into a try/catch block. The expert says *"fulfillment happens later"*; the program flattens this into a callback or a thread-pool submission.

The flattening is not malicious. It is what programs have to do to run on machines. The cost of the flattening is invisible day-to-day, paid in small increments every time someone reads the code and has to reconstruct the domain statement that the flat representation buried. A senior developer can do the reconstruction quickly; a junior developer cannot. A domain expert cannot do it at all. The cost compounds as the team grows and as the system ages, and it shows up most clearly when someone joins the team and tries to understand what the code actually says about the business.

Most attempts to fix the language problem have approached it from one side or the other. Object-oriented design tried to fix it by naming things in the domain's vocabulary — `Customer`, `Order`, `Invoice` — and attaching behavior to those names. Functional programming tried to fix it by making the type system precise enough to track every effect a computation performs. Each approach made progress on the part of the problem it focused on. Neither finished, because neither was looking at the same part of the gap.

This chapter is about a different way of thinking about types — not as a machine-correctness checker and not as a domain-noun naming convention, but as a vocabulary that says what the business itself would say about the values flowing through the system. The middle ground is not a compromise between OO and FP. It is a third position that takes from each what serves legibility and declines what doesn't.

---

## What OO promised about types, and didn't deliver

Object-oriented design's bet on types was that classes would carry domain meaning. A class named `Customer` would represent a customer; a class named `Order` would represent an order; reading code about customers and orders would feel like reading about the business.

The bet was reasonable. It also failed in a specific way that earlier chapters have documented from several angles. The classes acquired the shape forced on them by the surrounding system — ORM constraints, framework conventions, persistence requirements, the gravitational pull of shared use across many features. By the time the classes were stable enough to ship, their names referenced the domain but their contents referenced machine concerns: fields shaped by storage, methods shaped by framework lifecycles, relationships shaped by how the persistence layer wanted to lay things out.

A `Customer` class in this tradition typically contains an identifier (a database concern), several text fields (storage shapes), a few timestamps (audit requirements), a collection of orders (an ORM relationship), and a handful of methods that mostly translate between the in-memory representation and various wire formats. The class's name says *customer*. The class's contents say *row in a database table that we sometimes serialize to JSON*. The gap between the name and the contents is the gap between what the domain expert was talking about and what the program ended up representing.

The class-as-domain-noun approach got the *naming* part of the language problem right. It did not get the *semantic* part right — what the values actually mean in the domain — because the semantics kept being supplied by something other than the domain. The semantics came from the database, the framework, or the wire protocol, and the class's contents reflected those sources more than the domain itself. This is what produces the well-documented phenomenon of code where the type names are familiar but the type behaviors are not what a domain expert would predict from the names.

---

## What pure FP promised about types, and got partly right

Functional programming made a different bet on types. Instead of mirroring the domain's nouns, it would track everything a computation might do — its effects, its failure modes, its environmental dependencies — and encode all of it in the type system. A function's type signature would tell the reader precisely what could happen during execution, without the reader having to look inside the function's body.

This bet was partially correct. The precision is real, and the part of the bet that paid off is the part that has propagated widely: types that track failure (`Result<T, E>` in Rust, `Either` in Haskell, sealed result hierarchies in Java and Kotlin and C#), types that track absence (`Option<T>`, `Maybe<T>`), types that track deferred values (`Promise`, `Future`, `Task`). These constructs let a function's signature describe what the function does at a level of precision that older type systems could not match. A function returning `Result<Customer, NotFound>` is a function that, by its type alone, declares "this can return a customer, or it can fail because the customer was not found." The reader knows the failure mode without reading the function body.

The part of the bet that didn't pay off in full is the part that tried to extend this precision across every effect a computation might have — what state it reads or writes, what other computations it might depend on, what runtime environment it requires. The fully tracked type system became expressive enough to describe what computations *do* with mathematical precision, and opaque enough that reading it required learning a sub-discipline. A function signature in fully tracked FP carries a lot of information, and a domain expert looking at it sees mostly machine-level concerns — effect tags, monadic context, environment parameters — wrapped around what was supposed to be a domain operation.

The pure-FP type system became transparent to the programmer and opaque to the domain. The opposite of OO's failure mode, with the same net result on the language problem: a type system that doesn't speak the language the business speaks.

---

## The recent generation

The effect-system tradition has not stopped evolving. The most recent generation — algebraic-effects-based approaches appearing in Scala 3, OCaml 5's runtime, and languages built specifically around the model (Koka, Effekt) — represents a substantive improvement over the monad-transformer era. Algebraic effects answer the underlying question directly: an effect is a request a computation makes to its environment, a handler is whatever satisfies the request, and any number of these can be tracked and composed orthogonally. The older approaches start to look like special cases. That diagnostic — older approaches looking like special cases of a newer one — usually means a model has hit something foundational.

The model is foundational. It is also foundational about the *mechanism* of effect composition, not the *method* of designing systems. An effect system answers "how do I track and compose side effects in a strongly-typed language without losing my mind." A methodology answers "what is this code supposed to be doing in the business, and how do we make the code shape match the process shape so that humans can read it as the process." Both questions are legitimate; they operate at different altitudes. A team adopting a modern effect system has made an infrastructure choice. Whether they have also made a methodology choice is a separate matter, and the two decisions are mostly independent. PFD can coexist with any of these effect systems, or with none of them. What it declines is placing the program's primary structure inside a type-level inventory of effects rather than inside the named processes the system carries out.

The deeper observation is that algebraic effects and process-first methodology are philosophically aligned even though they look nothing alike on the page. Both are bets that the right primitives, named honestly, in the right shape, eliminate whole categories of accidental complexity the industry has learned to tolerate. Algebraic effects make that bet at the level of effect composition. PFD makes the same bet at the level of process composition. The surface vocabularies differ; the underlying conviction does not. Practitioners working in either tradition are pulling in the same direction at different altitudes.

---

## The middle position

The two traditions were looking at different parts of the same gap. OO wanted types to *name* domain things. FP wanted types to *describe what can happen* during computation. Neither, taken alone, produced a type system that speaks the domain's language about the values it handles. But the two halves, taken together and pruned of what each tradition tried to extend into the other's territory, point at a third position.

What if types carried domain-level semantics — not just nominal ("this is a Customer") but structural ("looking up a customer might fail to find one")? What if the structural facts the type system expresses were the same facts the domain expert states out loud, in the same vocabulary?

This is the move that closes the language gap. It is not OO, because behavior doesn't live on the entity classes. It is not pure FP, because the type system doesn't track machine-level effects. It is a position that uses types to carry *domain modalities* — facts about what can happen in the domain, expressed in terms the domain itself uses.

A function that looks up a customer in this position has a signature like `Result<Customer> lookup(CustomerId id)`. The signature says, in the domain's own vocabulary, that this is a lookup that might fail to find the customer. The signature does not say what database is used, what protocol is involved, what timeout applies, or what runtime context the function executes in. Those are technical concerns that live behind named boundaries; the signature describes the domain operation. A domain expert reading the signature recognizes it as a sentence they would say themselves. A new developer reading the signature understands what the function does without consulting documentation. A compiler reading the signature knows that any caller has to handle both the success and the not-found case.

The position works because it picks up what each tradition got right and declines what each tradition tried to do beyond that. From OO, it keeps the principle that types should carry domain meaning — the names matter, and the names should be the domain's own. From FP, it keeps the structural shapes that let types describe what can happen during computation — the modalities (failure, absence, deferral) are real and worth naming. From neither tradition does it inherit the maximalist extension: not entity-as-shared-class, not effect-tracking-as-comprehensive-discipline. The result is a small type vocabulary with a large semantic payload, every element of which is a domain word.

---

## What "semantic potential" means

The phrase that names what this chapter is about — *semantic potential of types* — was coined by William Jackson in response to an earlier article that planted the framing this book grew from. The phrase is precise enough to be worth pulling apart.

*Potential*, in the physical sense, is energy that a system carries by virtue of its position or configuration but has not yet released. A type's potential is the meaning it carries by virtue of its shape, signature, and place in the program, before any specific value flows through it. A well-chosen type carries substantial potential: every time a value of that type appears, the meaning the type carries comes with the value. A poorly chosen type — a `String` standing in for what should have been a `CustomerId`, a `Map<String, Object>` standing in for what should have been a structured request type — carries almost no potential. The values still mean something in the domain, but the type does not express what they mean, and the meaning has to be reconstructed at every use site.

*Semantic*, here, means *carrying meaning relevant to the domain* — not just structural validity (is this a string of allowed length?) but domain validity (is this a syntactically valid email address that has been verified to belong to a real registered user?). A type with high semantic potential carries enough meaning that the reader doesn't need to consult outside documentation to know what the value is for; the type itself says.

A type with full semantic potential, then, is one whose name and shape together communicate what the value is, what it can do, how it can fail, and what state it represents in the domain. *Customer* might be a name with low potential — the reader knows it represents a customer but not which kind of customer, in which state, valid for which purposes. *VerifiedCustomer* has higher potential — the reader knows the customer has been verified and can be operated on as such. *PaymentEligibleCustomer* has higher potential still — the reader knows the customer has been validated specifically for payment operations, which depend on a set of conditions not all customers satisfy.

The discipline also has a specific failure mode worth naming. A raw `String` — or any null-permitting generic type — almost never carries a valid business value on its own: the business has no concept of "a string." Wrapping it in a type that carries only a technical name fixes nothing. `UserIdString` is still a string; `PersonName` defined as a transparent alias for `String` is still a string. The ceremony of renaming is not the discipline. The criterion is whether the type expresses a business role, with construction enforcing the minimum validity that role requires. A `CustomerId` that validates its format on construction and refuses to exist as blank is a business type. A `CustomerIdString` that accepts any string and happens to be named after a business concept is decoration. The distinction matters because decoration creates the appearance of semantic work without delivering the guarantee. The question to ask of any candidate type: does it carry a business role, and does construction enforce the minimum validity that role requires? If yes, the type earns its place. If no, it is a wrapper with no payload.

The semantic potential of a type is a design choice. It is also a discipline. A team that takes types seriously chooses names and shapes that carry maximum potential for the meaning they need to communicate, and accepts that this sometimes means inventing types that don't exist in any external schema or library. The inventory of domain types in a process-first codebase is usually larger than the inventory in an entity-first codebase, because each process invents the types it needs rather than reusing a smaller set of shared entities. The number of types is large; the meaning each one carries is dense; the cost of the larger inventory pays back at every use site in readability — and more substantively in decoupling. A process that owns its types can evolve them as its needs shift, without coordinating with other processes that happen to use a noun by the same name. Changes to a pricing rule do not propagate into booking. Changes to a booking field do not propagate into reporting. The system can be modified one process at a time, because no two processes share a type they did not deliberately choose to share.

This is what "high cohesion, low coupling" looks like when delivered as a structural property rather than as a stated goal. The principle is decades old. The discipline that produces it — per-process types, owned by the process they serve, shared only when the sharing is genuine — is what makes the principle real rather than aspirational.

---

## How types replace defensive coding

One of the visible consequences of taking semantic potential seriously is that whole categories of defensive coding disappear.

In a codebase where types carry low potential, defensive coding is the cost of staying safe. A function that takes a `String email` has to check that the string is non-empty, that it contains an `@`, that the domain part is well-formed, that the local part doesn't have illegal characters. It has to do this every time, because the type `String` makes no promise about any of these things. A different function, calling the first, also has to check, because the first function's type signature doesn't tell the caller anything about what the function will accept. The defensive checks proliferate; the checks become a substantial fraction of the code; the actual business logic gets diluted by validation code that has to run everywhere any value crosses any boundary.

In a codebase where types carry high potential, the defensive checks happen once, at the construction site of the type. A function that takes an `EmailAddress` does not check whether the email is valid. The `EmailAddress` type, by virtue of its construction, cannot exist as an invalid email address. Any function receiving an `EmailAddress` can trust that the value is valid, because the type system guarantees it. The validation is performed exactly once, when the value is first constructed; from that point onward, the type carries the validation as a property.

This pattern — sometimes called *parse, don't validate*, sometimes *make illegal states unrepresentable* — is one of the load-bearing techniques the type-honest approach provides. The pattern relies on the discipline of giving types enough potential that they make claims their construction enforces. A `VerifiedEmailAddress` that can only be constructed by passing through verification carries the verification fact in its type. A `PositiveQuantity` that cannot hold zero or negative values carries that constraint in its type. A `PaymentEligibleCustomer` that requires payment-eligibility validation to construct carries the eligibility in its type.

The discipline is small to state and substantial in effect. The number of validation checks in a codebase drops by an order of magnitude when types carry the validations they need. The validation logic that remains lives at the construction boundary, where it is concentrated, easy to find, easy to test. The business logic that uses the validated types reads as business logic, not as a sequence of defensive checks alternating with brief moments of actual computation.

---

## The compiler becomes a participant

In most type-system discourse, the compiler is positioned as an overseer of machine correctness. It catches type errors, prevents null dereferences, ensures method signatures match. The compiler is a gate the code has to pass through; the gate exists to prevent machine-level failures.

When the type system speaks the domain's language, the compiler's role shifts. It is no longer just a gate. It becomes a participant in the domain conversation.

Consider a function that looks up a customer and returns `Result<Customer>`. A caller that uses this function has to handle both the success case (a customer was found) and the failure case (no customer was found). If the caller forgets the failure case — writes code that only handles success — the compiler refuses to accept it. The refusal is not about machine safety in the usual sense. The customer-not-found case is a domain fact: the business has a possible state where a customer is not found, and the program has to account for it. The compiler is pointing out that the domain has a case the author hasn't addressed.

This shift is small but consequential. A compiler that catches null pointer errors is catching machine bugs. A compiler that catches unhandled domain cases is catching design bugs — the author hasn't finished thinking through what the domain says. The kind of feedback the compiler provides changes from "you have a bug in your code" to "you haven't accounted for something the domain told you about."

In a team that adopts this discipline seriously, compile-time feedback should become a more substantial part of the design process than it usually is. The compiler runs during code review, and the review can focus on whether the code expresses the domain correctly, with mechanical correctness handled by the compiler. The compiler runs during refactoring, and the refactoring can proceed without fear because the compiler will catch any case the refactoring missed. The compiler runs during onboarding, and a new team member can learn what the system does partly by watching the compiler tell them about the domain cases they haven't yet handled.

This is the property the title of this chapter is pointing at. The semantic potential of types is realized when the types carry enough meaning that the compiler can participate in the domain conversation. The conversation involves the programmer (who writes the types), the domain expert (who recognizes the types as saying what they would say), and the compiler (which enforces that the program is consistent with what the types claim). All three parties speak the same language. The translation step that used to live between them — between domain talk and program structure — stops being necessary.

The degree of participation the compiler offers varies. In some languages — Rust, F#, Haskell, Scala — the type system enforces invariants at compile time: an invalid state that cannot be constructed cannot reach a caller. In others — Java, TypeScript, Kotlin — enforcement is distributed across smart constructors that refuse to produce invalid instances, property tests that probe the invariant space, and convention-plus-review that the team upholds. Four levels exist in practice: compiler-enforced (the type system itself rejects violations), constructor-enforced (factory methods refuse to produce invalid instances), test-enforced (property or contract tests catch violations before release), and convention-enforced (code review, linting rules, and team discipline). The methodology's structural commitments are the same across all four levels. The discipline holds at constructor-plus-convention level when the compiler provides no direct help; it gains teeth with each stronger level the language makes available. Honest type design in any language means knowing which level you are operating at, and not pretending the compiler enforces what only the constructor or the test suite does.

---

## What this costs and what it doesn't

Taking semantic potential seriously costs effort up front. A team adopting the discipline has to identify which values in their domain deserve their own types, choose names that carry the potential the values are worth, define construction rules that enforce the properties the names claim, and accept that the type inventory will grow as the system grows. Each of these is real work. None of them is heavy on any given day, but the cumulative effect is that designing types takes longer than it would if the team were using `String` and `Map` and `Object` for everything.

The cost pays back in several specific ways. Defensive validation code drops sharply, because the types carry validations the code no longer has to repeat. Function signatures become more informative, because they say what they do at a higher resolution than less-potent types allow. Refactoring becomes safer, because the compiler can verify that domain-level invariants are preserved across the refactor. Onboarding becomes faster, because new team members can learn what the system does by reading types rather than by chasing through method bodies. Code review becomes less about mechanical correctness and more about whether the design expresses the domain well.

The cost does not include the things some teams fear it will include. The discipline does not require committing to a paradigm. It does not require learning category theory. It does not require monad transformers, free monads, effect systems, or any of the meta-machinery that the maximalist FP tradition accumulates. It uses a small set of structural shapes — covered in detail in the next chapters — that propagate through normal code without requiring developers to learn a new vocabulary outside the four shapes the methodology names. A team adopting the discipline writes code that looks recognizably like code in their language. The language gets used more carefully; nothing exotic gets introduced.

The discipline also does not require giving up readability for non-experts. The opposite is closer to what happens. A codebase where every type carries domain meaning is more readable to a domain expert than a codebase where types are mostly machine primitives. The expert can read function signatures and verify that the program represents the business correctly; the expert could not do this with a codebase full of `String` and `Map`. The semantic potential of types is, in this sense, a discipline that broadens the audience for code, not narrows it.

---

## What this enables

When the type system speaks the domain's language, several structural properties become available. Design conversations can be grounded in the actual values the system handles. Refactoring can proceed with the types as a check that domain invariants are preserved. The compiler can flag unhandled domain cases as a routine matter of completeness. The system's representation can be verified by reading types rather than running code.

These are not separate features but facets of the same underlying property — a type vocabulary chosen to carry domain meaning rather than machine concerns.
