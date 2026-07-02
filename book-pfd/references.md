# References

Works cited in the text, alphabetical by author.

**King, Alexis.** *Parse, Don't Validate.* 2019. <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/>
The discipline of parsing input into a type whose existence proves its validity, so that illegal states cannot be represented. Applied at every step boundary from Spiral Pass 1 onward.

**Loth, Yannick.** *The Independent Variation Principle as a Thought Framework.* Dev.to, 2025. <https://dev.to/yannick555/the-principle-of-independent-variation-as-a-thought-framework-4aaa>. Formal version: *The Independent Variation Principle (IVP).* Zenodo, 2025. DOI [10.5281/zenodo.17677316](https://doi.org/10.5281/zenodo.17677316) (CC BY 4.0). See also *Process-First Design and the Independent Variation Principle: Two Paths to the Same Territory* (Dev.to). And *On the Nature of Cohesion: Cohesion as a two-axis schema.* Zenodo, 2026. DOI [10.5281/zenodo.20785752](https://doi.org/10.5281/zenodo.20785752) (CC BY 4.0).
The Independent Variation Principle is the change-driver partitioning criterion the methodology recognizes as the formal, independently-derived counterpart to its own process-cohesion account; *On the Nature of Cohesion* gives the two-axis account of cohesion itself (purity and completeness) that the book's recognition test instantiates. Used from Foundations through the spiral and Brownfield.

**Poltorak, Denys.** *Architectural Metapatterns.* CC BY 4.0. <https://metapatterns.io/>
A catalog of architectural structures and the transitions between them, argued complete on geometric grounds. Recognized as corroboration for the deployment axis in Architecture Synthesis and for the transition shapes in Brownfield.

**Yevtushenko, Sergiy.** *Saga Is Not a Pattern.* 2026. <https://medium.com/@sergiy-yevtushenko/saga-is-not-a-pattern-6973bdcebde5>
The argument that the saga is a composite of simpler patterns (Sequencer, Condition, Aspect) rather than a primitive worth introducing on its own. The reduction is used in Spiral Pass 2.

**Yevtushenko, Sergiy.** *The Saga is Antipattern.* 2026. <https://dev.to/siy/the-saga-is-antipattern-1354>
The companion argument at the other scope: across services that share no transactional substrate, a saga substitutes compensation for the consensus the services lack, so a cross-service saga signals a decomposition that cut through a transaction. With *Saga Is Not a Pattern*, the pair fixes the scope: a saga is a legitimate within-boundary composition and an antipattern across service boundaries.
