# Chapter 2 — Best Practices as Cargo Cult

*Threads: 3 (industrialization), 5 (legibility asymmetry), 15 (standardization)*

---

## The contradictions are not bugs

Open three reputable books on software development from the past decade, picked at random, and read what each identifies as best practice. The contradictions arrive within the first chapter.

One book argues that microservices are how serious systems are built; the next argues that microservices are a mistake unless you have organizational scale most teams will never reach. One author advocates extensive comments to capture intent that code cannot express; the next argues that any comment is a sign that the code itself failed. One source defends rigorous unit-test coverage; another argues that unit tests reinforce premature design and recommends integration tests as the load-bearing safety net. Pick a topic — error handling, dependency injection, layering, persistence, configuration, deployment cadence — and the same pattern appears. Equally credible authorities recommend incompatible practices. They cite real experience. They are not all wrong.

The natural reaction is to treat the contradictions as immaturity — that with more thinking, more research, more case studies, the contradictions will resolve and a settled body of best practices will emerge. This reaction has been articulated, in roughly the same form, by every generation of software practitioners since the term "software engineering" was coined. The contradictions never resolve. They multiply.

They multiply because each best practice is a context-bound observation that the discourse strips of its context before propagating. The observation is real. The stripping is the problem.

---

## How the stripping happens

A team faces a specific problem. They try something. It works, in their context, against their constraints, with their tooling and staffing and tolerance for failure. They write it up. The write-up travels. Other teams, facing problems that look superficially similar, adopt the practice. Some adoptions work. Some do not. The successes get conference talks; the failures get private retrospectives. The practice's reputation grows on asymmetric evidence.

The asymmetric reputation reaches a team whose situation does not match the originating one. The team adopts. The practice's surface is reproduced — directory structure, deployment topology, organizational ritual, framework choice. The conditions that made the practice work originally — the scale, the talent density, the infrastructure investment, the operational risk profile — do not transfer. The practice fails.

The clearest version of this runs through practices originating at large platform companies. Some of them have published technical accounts of how they made monorepos work, how they made chaos engineering work, how they made their internal-tooling investments work. The accounts are honest about what was required: hundreds of engineering-years of dedicated build infrastructure, custom search and navigation tooling, dependency systems that do not exist in open source, on-call infrastructure that routes incidents to specialists in seconds, organizational practices that match the technical investment. A two-hundred-person company adopting the surface of any of these — one repository, deliberate failure injection, the signature directory layout — without the surrounding investment does not get the benefits the larger company reports. It gets the surface. The substrate that made the surface productive stays where it was.

This is the import failure mode. It is not the practitioners' fault. The practitioners are intelligent and well-intentioned and reading the same write-ups everyone else reads. The fault is in the discourse: it propagates the practice without propagating the conditions under which the practice applies.

---

## Cargo cult, precisely

The metaphor that names this failure mode comes from a specific historical phenomenon. During the Second World War, military forces operating in the Pacific built airstrips, control towers, and supply depots, around which substantial cargo arrived. The forces eventually departed. Local populations who had observed the surface of the operations sometimes constructed replicas — runways, "control towers," figures in uniform drilling — expecting cargo to follow. The cargo did not follow. The replicas had the form of the original operations without the underlying logistics that delivered cargo.

Richard Feynman generalized the metaphor in 1974, applying it to scientific work that adopted the surface of rigorous research — citation, statistical method, technical vocabulary — without the underlying skepticism and self-criticism that made the surface productive. He called it cargo cult science. The phrase entered general intellectual circulation.

The metaphor fits software development without modification. A team that imports a practice without its conditions reproduces the form. Cargo does not arrive. The team performs the ritual harder, or louder, or more visibly, and waits.

The metaphor is sometimes resisted on the grounds that it sounds dismissive of the practitioners. It is not. It is structural. Cargo cult is what intelligent practitioners produce when they imitate a practice that worked elsewhere without the conceptual tools to identify what made it work. Naming the failure precisely is the first step toward fixing it. The fix is not to recommend better practices. The fix is to make the conditions under which a practice applies legible enough that adopters can tell whether their situation matches.

---

## The missing predicate

Every working practice has a predicate. The practice is the consequent: *do this*. The predicate is the antecedent: *if these conditions are present*. Best-practice discourse routinely surfaces the consequent and routinely omits the antecedent.

When a team asks "what should I do here?" they are asking, implicitly, "given my situation, which advice applies?" Best-practice discourse answers the second half — *here is the advice* — without examining the first half. The team is given the consequent for someone else's predicates. Their actual question goes unanswered. They adopt; the predicates do not match; the practice fails. The team concludes that something must be wrong with their execution rather than with the recommendation. The discourse re-confirms its recommendation. The cycle persists.

A methodology, in the sense this book uses the word, is what replaces the unconditional advice with conditional reasoning. It supplies a vocabulary precise enough that a team can describe their actual situation without ambiguity, and a derivation procedure that produces architectural choices from the situation description rather than from imported templates. The output sometimes looks similar to a best-practice recommendation. The difference is that it was produced for the team's predicates rather than imported from someone else's. When the team's situation changes, the derivation reruns and the output adjusts. The recommendation is no longer a fixed artifact picked off a shelf; it is the current best-fit for current conditions, replaceable when conditions change.

This is the move best-practice culture has not yet made and PFD is one attempt at. The vocabulary, the derivation, and the predicates are what the rest of the book is for.

---

## What this is and isn't

The argument in this chapter is not that best practices are wrong. Most of them are right somewhere. The argument is that the discourse propagating them strips the conditions that determine where each one is right, and that decontextualized propagation reliably produces cargo-cult adoption at scale. The intent of best-practices culture — sharing learning across teams — is legitimate and worth preserving. The mechanism by which that culture currently shares learning is not adequate to the variety of situations the learning has to fit.

The remedy is not silence on what works. The remedy is restoring the predicates: making explicit what every recommendation is contingent on, so that adoption becomes a matter of matching rather than copying. A team that knows its own situation precisely, and has access to advice that surfaces its own conditions precisely, can adopt practices that fit and decline practices that do not. That is what an industrialized vocabulary at the application layer looks like. It is what this book describes.
