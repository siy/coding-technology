# Java Backend Coding Technology

JBCT is a deterministic, AI-friendly way to write backend Java: a small set of patterns and rules that reduce the space of valid choices until there's essentially one good way to structure a use case. Code ends up reading like the business process it implements, whether a person wrote it or an AI assistant did, because the structure is the same either way.

The method rests on typed failures instead of exceptions, parse-don't-validate at every boundary, functional composition (`map`/`flatMap` over `Result`, `Option`, `Promise`), and a fixed catalog of six structural patterns: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects. Every decision in the method is checked against five criteria — mental overhead, business/technical ratio, design impact, reliability, complexity — not against taste.

The pitch is usually told as noise removal — technical detail pushed to the edges so the business flow stands out. The stronger half is what survives: the business facts live in the types. A return type states whether a step can fail; an `Option` parameter states that the domain allows absence; `all()` states that steps are independent; a sealed error type states the complete failure catalog. **Hide the machinery, keep the meaning** — the code executes and testifies at once, and the compiler keeps the testimony true.

The [free course](/java/jbct/course/) on this site walks the whole method with worked examples. The book, *Java Backend Coding Technology*, is the complete argument, on [Leanpub](https://leanpub.com/jbct-book). [Pragmatica Core](/java/pragmatica/) is the library the method is written against.
