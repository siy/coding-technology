# Chapter 4 — OO vs FP and Why Neither Wins Alone

*Threads: 5 (legibility asymmetry), 11 (the interesting work), 14 (telescopic composition)*

---

## The paradigm wars are over and nobody noticed

For most of the past forty years, the field has been arguing about how to structure code. The argument has carried different names at different times — structured versus unstructured, procedural versus object-oriented, object-oriented versus functional — but the underlying question has been the same: which paradigm is the right one? Which way of organizing programs corresponds to how programs should be?

The argument has produced enormous quantities of advocacy, several generations of textbooks, and conference circuits dedicated to defending whichever paradigm the conference was named after. It has also produced two specific schools — object-oriented programming and functional programming — that each promised to be the final answer and each spent the past two decades discovering that the final answer is a longer story than either school's original framing suggested.

Meanwhile, the languages that working teams actually write code in have stopped picking sides. The languages that arrived or matured in the past ten years — TypeScript, Kotlin, Rust, Swift, modern C#, modern Java, modern Scala — all have first-class functions, immutable-by-default data, sealed type hierarchies, pattern matching, algebraic data types, and explicit failure modeling. None of these features are exclusively OO. None of them are exclusively FP. They are the features that working programmers wanted in the languages they use every day, and the languages absorbed them regardless of which paradigm originally articulated them.

The paradigm war ended in a draw the participants did not announce. This chapter is about what each side actually delivered, what each side promised and did not deliver, and what survived the convergence the languages have already made.

---

## What OO promised, what OO delivered

The original promise of object-oriented programming was domain modeling. Combine data with the behavior that acts on it; let those combinations correspond to concepts in the problem domain; structure programs as conversations between objects that each represent something in the world. The promise was attractive because it suggested that programs could become legible by mirroring the domains they served. A program about banking would have account objects, transaction objects, customer objects, and the code would read like a description of banking — recognizable to a banker reading it, not just to the programmer who wrote it.

What OO delivered was less than this in a specific direction. The domain-modeling promise required that the objects in code carry both the structure and the behavior of the domain concepts they represented. In practice, the behavior tended to migrate elsewhere. As enterprise applications grew, persistent storage became the dominant concern, and persistent storage in the 2000s converged on relational databases mediated by object-relational mappers. The mappers required that domain objects be loaded from rows and saved back to rows; the loading and saving constrained what the objects could be; the constraints favored objects with predictable shape — fields, getters, setters — over objects with rich behavior. The behavior moved out into services, controllers, managers, helpers, processors. The domain objects became data carriers. The mappers were satisfied. The domain-modeling promise quietly went unmet.

This is the failure that produced the anemic domain model warning that has accompanied object-oriented enterprise development for two decades. The warning is correct in observation and incomplete in diagnosis. The objects are anemic not because the developers writing them are insufficiently committed to object-oriented principles; the objects are anemic because the surrounding system — the ORM, the database schema, the framework conventions, the team structure — exerts continuous pressure toward anemia, and resisting that pressure costs more than most teams can sustain. The pressure is structural. It comes from the gap between OO's domain-modeling promise and the persistence-and-framework reality the promise had to operate inside.

OO also delivered, separately from the domain-modeling story, a body of structural patterns — the catalog that emerged in the late 1990s and is associated with the *Design Patterns* tradition. These patterns named real recurring structures in object-oriented code, gave them shared vocabulary, and let developers across teams discuss structural choices with terms everyone recognized. The contribution was real. It also acquired a specific failure mode within a decade of its publication: the patterns became targets rather than descriptions. Developers learned the patterns first and then looked for places to apply them, rather than recognizing the patterns when they emerged from the problem. Code acquired class names ending in "Factory" or "Visitor" or "Strategy" because the developer was reaching for the pattern, not because the situation called for it. The patterns themselves were not at fault. The relationship developers had with the patterns — pattern as target rather than pattern as recognition — was.

The net of OO: real contribution at the vocabulary level (we can discuss object structure precisely), structural pressure that defeated the domain-modeling promise in most enterprise contexts, and a patterns culture that drifted from descriptive to prescriptive in a way that produced its own residue.

---

## What FP promised, what FP delivered

The original promise of functional programming was composability and equational reasoning. Programs as compositions of functions; functions as values; behavior expressed as transformations of immutable data; correctness verified by reasoning about expressions rather than tracking state through time. The promise was attractive because it suggested that programs could become reliable in a way that imperative programs could not — that whole categories of bugs (race conditions, mutation-order dependencies, hidden state) could be eliminated by structural means rather than by careful programmer discipline.

What FP delivered, at the level of language features, was real. Immutable data structures became table stakes. First-class functions became universal. Algebraic data types — sum types, product types, sealed hierarchies — entered the mainstream. Pattern matching arrived as a primary control flow construct. Explicit handling of failure through types like `Result` and `Option` replaced ad-hoc exception throwing. Each of these is a genuine improvement, and each has propagated across languages that did not originate as functional.

What FP delivered, at the level of full paradigmatic adoption, was less generous. Pure functional programming, in the form that the language theorists promoted, required that side effects be lifted into types, that those types be composed through structured combinators (monads, applicatives, functors), and that programs be structured as sequences of pure transformations punctuated by effect handlers. The mathematical foundations were elegant. The practical adoption was hard. Teams that committed to the full paradigm acquired a new vocabulary — monad transformers, effect systems, free monads, tagless final — that was internally consistent and externally opaque. A working developer joining such a team needed to learn the meta-machinery before they could read business code. The learning curve was steep enough that pure-FP teams tended to recruit for the paradigm rather than train for it, which limited adoption to a small subset of organizations willing to make that hiring trade-off.

The failure mode in FP's full-adoption story was symmetric to OO's failure mode. OO promised domain modeling and delivered data plumbing because the surrounding pressure pushed toward anemia. FP promised domain composability and delivered, in its full-adoption form, machinery that obscured the domain behind layers of effect-type plumbing. A function in a pure-FP enterprise codebase often spent more of its signature describing its effect context than describing what it did to the domain. The precision was real. The legibility for someone outside the paradigm was poor. Domain experts reading the code could not parse it; new engineers joining the team faced a long ramp-up; existing engineers spent meaningful fractions of their time on the meta-machinery rather than on the work the machinery was supposed to enable.

Pure FP at the application layer is a small market. Most teams that adopt some functional thinking do so partially — using `Option` and `Result` and pattern matching and immutable data, while declining the full effect-system machinery. The partial adoption gets most of the practical benefits without the legibility cost. The pattern is so consistent across teams that it is worth naming: partial-functional adoption is the convergent equilibrium that working enterprise teams have arrived at, regardless of which paradigm they originally identified with.

---

## The ecosystem moved while the writing kept arguing

The clearest evidence that the paradigm war is over lives in the language ecosystem.

Twenty years ago, the choice of programming language correlated strongly with paradigm commitment. Java was OO; Haskell was FP; the languages between them were either compromise positions or transitional. Today, the correlation has dissolved. Java has records, sealed interfaces, pattern matching, lambdas, and stream pipelines. Kotlin has sum types, extension functions, scope functions, and first-class immutability. Scala has always been hybrid by design and has, in its recent versions, become more so. C# has records, pattern matching, switch expressions, and discriminated unions. Rust has enums, traits, closures, ownership-based handling of state, and `Result` as the default failure type. TypeScript has discriminated unions, mapped types, conditional types, and a structural type system flexible enough to express most of the algebraic-data-type patterns the FP tradition cares about.

None of these languages picked a paradigm. They picked features. The features they picked came from both traditions because both traditions had identified real things that working programmers wanted. The ones that did not propagate — deep inheritance hierarchies, monad transformer stacks, full pattern catalogs of behavioral patterns, free-monad encoding of effects — were the ones whose value did not survive contact with day-to-day development pressure. The features that propagated are the ones whose value held up under that pressure.

This is the convergence that methodology writing has been slow to catch up with. A book or article positioning itself as "the OO answer" or "the FP answer" is now arguing for a world that the languages have already moved past. The question is not which paradigm wins. The question is which subset of features, drawn from both traditions, serves a methodology that scales. The answer is visible in the languages themselves. The methodology writing has to absorb that answer rather than continuing the argument the languages stopped having.

---

## What survived from each tradition

PFD uses a small subset of what each tradition delivered, and declines most of what each tradition tried to add on top.

From the OO tradition, the methodology keeps the original insight: types should carry domain meaning. A type that represents a customer should be specifically a customer — a `Customer`, not a generic record or a string-keyed map. The type's name, its fields, its construction discipline, and the operations defined on it should all communicate something about the customer concept in the domain. This is what OO promised at its best. What the methodology declines from the OO tradition is the rest: deep inheritance hierarchies, the GoF pattern catalog as a prescription rather than a description, the entity-as-shared-class assumption that produced the structural problems Chapter 3 examined.

From the FP tradition, the methodology keeps the type-honest shapes. `T` for values that exist unconditionally. `Option<T>` for values that may or may not exist. `Result<T>` for values that may or may not be computable. `Promise<T>` for values that arrive later. Each of these is a type with a small, well-defined behavior, and each makes possible a structural choice that ad-hoc nullability and exception handling cannot. The shapes propagate through compositions in ways that keep the propagation visible. They also keep the compositions readable, because the shapes themselves are familiar from working code in nearly every modern language. What the methodology declines from the FP tradition is the meta-machinery: monad transformers, effect systems, free-monad encodings, the categorical-theory framing. None of those is needed to express the structural choices the methodology asks for. All of them raise the cost of reading the code to a level that domain experts cannot bear.

The hybrid the methodology articulates is therefore small and concrete. Types that carry domain meaning (from OO). Shapes that carry failure and async modality (from FP). Composition through chained transformations rather than mutation through shared state (from FP, partially). Behavior defined on types rather than separated into services (from OO, partially). No deep hierarchies. No catalog of behavioral patterns to apply. No effect-system machinery. The result is a vocabulary that a domain expert can read, an engineer can write, and a reviewer can verify without first learning a meta-language.

---

## Why neither tradition was going to win alone

The deeper reason neither paradigm won is that neither paradigm was a complete description of what software does at the application layer.

OO described the domain-modeling part. FP described the composition part. Both parts are real. A program that models its domain badly but composes cleanly is still hard to understand; a program that composes badly but models its domain well is still hard to maintain. The two concerns are orthogonal, and a methodology that addresses only one of them is going to leave the other unaddressed and produce a recognizable failure mode — the OO version that becomes data-plumbing, the FP version that becomes machine-precision-without-domain-readability.

PFD treats domain modeling and composition as independent design dimensions. Each is solved on its own terms. Types carry the domain. Composition is expressed through the six primitives. Failure and async are carried by the shapes. The dimensions interact, but they do not collapse into one another, and the methodology does not require choosing a paradigmatic side. It takes from both traditions what each tradition got right, and declines the part each tradition tried to extend into territory the other tradition was already handling better.

The argument that any single paradigm could have won alone was itself a category error. Programs at the application layer have multiple structural concerns, those concerns are not all of the same kind, and the methodology that addresses them needs vocabulary drawn from wherever the vocabulary fits. The languages have already absorbed this lesson. The methodology layer is what remains for the field to catch up on.
