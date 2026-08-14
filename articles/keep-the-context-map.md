---
tags: [ddd, architecture, softwaredesign, programming]
canonical_url: https://pragmatica.dev/articles/keep-the-context-map
description: Strategic DDD does not rest on tactical DDD, which means you can keep one and replace the other. Here is how to annotate a context map so it feeds a change-driver decomposition instead of an aggregate model.
published: true
---

# Keep the Context Map. Replace the Aggregates.


**Strategic DDD is nearly orthogonal to tactical DDD, so you can take one and swap the other**

---

Domain-Driven Design ships as one book, and most people treat it as one method. It is two.

The strategic half -- bounded contexts, context maps, core and supporting and generic subdomains -- is about *where the boundaries in a business are*. The tactical half -- aggregates, entities, value objects, repositories -- is about *how you build inside one*.

Notice what does not connect them. Nothing in a context map presupposes an aggregate. Nothing in an aggregate presupposes a context map. You can draw the first without committing to the second, and teams do it constantly in both directions: shops that map their contexts carefully and then build anemic services inside them, shops that build textbook aggregates with no map above them at all.

The halves come apart. And that has a consequence people rarely take: **you can keep one and replace the other.**

This matters because the contested half is the tactical one. Arguments about DDD are almost always arguments about aggregates -- their size, their transactional boundary, whether they belong in an application with a relational database underneath. Very few people argue that bounded contexts are a bad idea.

So here is the proposition. Keep the context map. It is doing real work and nothing below it depends on how you decompose inside a context. Then, inside each context, decompose by change driver rather than by aggregate.

The rest of this is what that requires -- three annotations on a map you already have -- and what it buys.

---

## What you need to know about the other half

Process-First Design is a decomposition method for the inside of a boundary. Four ideas carry the whole argument here.

**A change driver is a reason code changes** -- a force that, when it moves, forces the code to move with it. Not a feature, not a module: a *reason*. A pricing policy is a driver. A regulator is a driver. A storage decision is a driver.

**You find drivers by asking who would ask for this to change.** Each independent decision authority is a driver: a team, a regulator, an external partner on its own release schedule. Two independent authorities able to demand changes to one unit means two drivers, and a split.

**The artifact is a register** -- a plain table, use case against driver. It does triple duty: it is the grouping itself; it is a completeness-and-purity checklist, asking whether a driver's column holds all and only its use cases; and it is checkable against version
control, because use cases that share a driver should change together in the commits.

**Cohesion is the test.** Does one change force all of these, and only these? Everything inside a unit should change for the same reason, and nothing outside should change for that reason.

There is no aggregate in that list. Decomposition falls out of driver attribution, and data is the residue of the processes rather than the thing you model first. That is where PFD and tactical DDD genuinely conflict, and it is the only place they do.

One more thing, and it is why this article exists: **PFD stops below the enterprise, on purpose.** The level above a system is composed by forces the code does not express -- Conway's law, the shape of the organization, who funds what. PFD does not claim that level. It consumes the strategic framing from wherever the enterprise already produces it.

Strategic DDD is the best-known way to produce it. So the two are not competitors. One produces what the other consumes -- once you add three things the map does not currently carry.

---

## Annotation 1: the authority behind each context

A context map records the relationships *between* contexts. It does not systematically record who can demand a change *inside* one.

That is the question the whole driver method runs on, so write it down. For each context: **which independent authorities can demand change here?**

Be strict about what counts. An authority is an agent that can require you to move: a team, a regulator, a vendor, a compliance regime, a named stakeholder. It is not a *concern* -- "pricing" is not an authority, the pricing team is. This distinction is easy to lose, and losing it is what makes the next two annotations impossible.

Written down, most contexts turn out to have two or three authorities, not one. That is already useful: a context with four independent authorities is a context that will fork, and you have found it before it does.

---

## Annotation 2: cadence

For each authority: **how often does it actually demand change?** Weekly, quarterly, annually, when the law changes, never in five years.

You can measure this rather than guess it. The commits are right there.

Cadence buys two things. The first is that **core, supporting and generic stop being a judgment call.** They fall out of two axes you are now tracking:

- Business-owned, and moves fast -- **core**. Build it, staff it, keep it inside.
- Externally owned, moves slowly -- **generic**. Buy or conform; it is somebody else's problem and they change it rarely.
- Business-owned, moves slowly -- **supporting**. Build it once, cheaply, and stop thinking about it.
- Externally owned, and moves fast -- **generic, but defend it**. A vendor API on its own aggressive release schedule is the painful cell, and it is the one that most needs an anti-corruption layer, because the churn is real and none of it is yours.

That last quadrant is usually missing from the discussion, and it is the one that hurts.

The second thing cadence buys: it tells you where release independence is genuinely demanded rather than assumed. Two contexts owned by different teams that both ship on the same weekly train do not need separate deployables. Cadence *divergence* is what forces that, not the count of teams.

---

## Annotation 3: what actually crosses

Context maps name relationships -- conformist, customer/supplier, shared kernel, published language, anti-corruption layer. Underneath each one, something concrete crosses the boundary: an id, a status enum, the value type of a field both sides touch.

**Write down the primitives, not just the relationship.** That list is the coupling inventory, and it is what the decomposition inside each context has to respect.

The relationship names then read as a taxonomy of power over change, which is what they were always describing:

- **Conformist** -- the foreign authority governs the shared primitive. You have no seat.
- **Anti-corruption layer** -- a refusal to let a foreign driver propagate into your register. The ACL is where you absorb their cadence so it does not become yours.
- **Shared kernel** -- a genuinely joint primitive under joint authority. Rare, expensive, and worth confirming that the authority really is joint.
- **Published language** -- a shared primitive whose owner has committed to a cadence. That commitment is the whole difference between this and conformist.

Read that way, the map is already about authority and cadence. The annotations do not add a new idea. They make explicit what the relationship names were compressing.

---

## What you have when you are done

A context map with an authority set and a cadence per context, and a primitive inventory per crossing.

That is a PFD input. Inside each context, the authorities are your candidate drivers, you build the register by attributing use cases to them, and the crossing primitives are the coupling you are not allowed to dissolve because it is real. The decomposition proceeds from there, and no aggregate is required at any point.

What you gain over carrying on into tactical DDD is a boundary that is checkable. The register can be tested against version-control history: use cases that share a driver should change together in the commits. A context map cannot be tested against anything, and neither can an aggregate.

What you keep is everything strategic DDD gave you. The map, the relationships, the subdomain classification, the language. None of it is invalidated by swapping the tactical half, because none of it rested on the tactical half.

---

## This has not been tested at scale

I have not run this on a large multi-team system, because I do not have one and, as far as I know, neither does anybody else yet. Every methodology passes through this stage; saying so is not a disclaimer, it is a request.

Here is exactly what would falsify it, so you do not have to take my word for any of it:

**Build the register, then compare it against the org chart.** If the derivation holds, driver boundaries and team boundaries should mostly coincide, and where they diverge, you should be able to point at real cross-team coordination for a single change.

**Then compare the register against the commits.** Use cases attributed to the same driver should change together. Files that change together but sit in different contexts mean a driver is cutting across a boundary the map says is there.

Both are measurable, and both can come out against me. If you run either on a system you own and the boundaries do not line up, that is the interesting result, and I would like to hear about it.

---

*The decomposition method summarized here is described in full in
[Process-First Design](https://pragmatica.dev/method/pfd/), including the register, the cohesion test, and the scope bound that puts the enterprise deliberately out of reach.*
