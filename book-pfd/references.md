# References

Works cited in the text, alphabetical by author.

**Amdahl, Gene M.** *Validity of the Single Processor Approach to Achieving Large Scale Computing Capabilities.* AFIPS Spring Joint Computer Conference, 1967.
The ceiling on parallel speedup set by the fraction of the work that stays serial. Governs the Closing's construction-scaling section once independence and uniformity have driven the communication and ramp-up terms down.

**Brooks, Frederick P.** *The Mythical Man-Month: Essays on Software Engineering.* Addison-Wesley, 1975; Anniversary edition 1995.
The law that adding people to coupled work makes it later, priced as ramp-up plus communication — and the stated escape: partitioning works where workers need no communication among them. The Closing's construction-scaling section meets that condition rather than contesting the law.

**Fritzsche, Rico.** *The Command Context Consistency Principle: How Event Stores and Relational Databases Guard Business Decisions.* Level Up Coding, 2026. <https://blog.ricofritzsche.de/the-command-context-consistency-principle-c16fc19e9454>
Dissolves the aggregate as a consistency boundary on concurrency grounds — a command reads facts in order to decide, and those facts must still hold when the outcome commits, a requirement with no inherent dependence on aggregates. Recognized in *Foundations* as an independent arrival at the same target this book reaches from change drivers, and the source of the read-write staleness section — including, in reply to a question about the predicate-over-a-set case, the guarded-counter reading that corrected this book's account of it.

**King, Alexis.** *Parse, Don't Validate.* 2019. <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/>
The discipline of parsing input into a type whose existence proves its validity, so that illegal states cannot be represented. Applied at every step boundary from Spiral Pass 1 onward.

**Loth, Yannick.** *The Independent Variation Principle as a Thought Framework.* Dev.to, 2025. <https://dev.to/yannick555/the-principle-of-independent-variation-as-a-thought-framework-4aaa>. Formal version: *The Independent Variation Principle (IVP).* Zenodo, 2025. DOI [10.5281/zenodo.17677316](https://doi.org/10.5281/zenodo.17677316) (CC BY 4.0). See also *Process-First Design and the Independent Variation Principle: Two Paths to the Same Territory* (Dev.to). And *On the Nature of Cohesion: Cohesion as a two-axis schema.* Zenodo, 2026. DOI [10.5281/zenodo.20785752](https://doi.org/10.5281/zenodo.20785752) (CC BY 4.0).
The Independent Variation Principle is the change-driver partitioning criterion the methodology recognizes as the formal, independently-derived counterpart to its own process-cohesion account; *On the Nature of Cohesion* gives the two-axis account of cohesion itself (purity and completeness) that the book's recognition test instantiates. Used from Foundations through the spiral and Brownfield.

**Poltorak, Denys.** *Architectural Metapatterns.* CC BY 4.0. <https://metapatterns.io/>
A catalog of architectural structures and the transitions between them, argued complete on geometric grounds. Recognized as corroboration for the deployment axis in Architecture Synthesis and for the transition shapes in Brownfield.

**Yevtushenko, Sergiy.** *Saga Is Not a Pattern.* 2026. <https://medium.com/@sergiy-yevtushenko/saga-is-not-a-pattern-6973bdcebde5>
The argument that the saga is a composite of simpler patterns (Sequencer, Condition, Aspect) rather than a primitive worth introducing on its own. The reduction is used in Spiral Pass 2.

**Yevtushenko, Sergiy.** *Software's Second Free Lunch.* 2026. <https://pragmatica.dev/articles/softwares-second-free-lunch/>
The development-scaling argument at article length: Brooks' law read as a coupling cost that adding AI does not touch, the GPU's two demands — uniform, independent — transferred to the act of building, and Amdahl as the governing ceiling once the communication term is driven toward zero. The Closing's construction-scaling section is its assembly inside the book.

**Yevtushenko, Sergiy.** *The Saga is Antipattern.* 2026. <https://dev.to/siy/the-saga-is-antipattern-1354>
The companion argument at the other scope: across services that share no transactional substrate, a saga substitutes compensation for the consensus the services lack, so a cross-service saga signals a decomposition that cut through a transaction. With *Saga Is Not a Pattern*, the pair fixes the scope: a saga is a legitimate within-boundary composition and an antipattern across service boundaries.
