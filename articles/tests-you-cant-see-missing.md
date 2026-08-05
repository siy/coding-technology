---
tags: [testing, java, softwaredevelopment, architecture]
canonical_url: https://pragmatica.dev/articles/tests-you-cant-see-missing
description: Line coverage and branch counts both measure the shape of your code. Neither can see how much it decides, which is why the missing tests are the ones nobody notices.
published: false
---

# The Tests You Can't See Missing

**Both of your instruments are blind to the same thing**

---

Thirty-five cells.

The rule decides the maximum debt-to-income ratio a borrower may carry. It decides by looking up two enumerations: seven loan types, five credit tiers. Seven times five. Thirty-five distinct answers.

Its test suite has thirty-three test methods.

That sounds close. It isn't. The thirty-three cover two columns.

---

## This is a good codebase

That is the part worth sitting with.

212 source files, 569 tests, written to a strict functional discipline. The value objects are exhaustively tested. The use cases are tested as compositions, with only adapters stubbed. Where an effect could not be observed from a return value, the tests capture the call instead -- which is correct, and which most codebases get wrong in both directions.

Nobody was lazy here. Nobody skipped the tests. Someone sat down and wrote thirty-three careful test methods for that rule.

And the pattern is not local to it. Across the whole codebase: **536 plain test methods, 33 parameterized ones.** Every single parameterized test is in a value object -- the one place the team's own written guidance recommended them.

If your system has a rule keyed on two enums -- a pricing matrix, a permission check, a shipping table, a routing decision -- you have one of these too.

The question is whether you would know.

---

## Start with what they got right

Because they got most of it right, and the reason matters.

If your code has a particular shape, several testing decisions stop being preferences and start being consequences.

**The default is to isolate nothing.** The cheapest test instantiates the thing and calls it. You depart from that only when something on the path *cannot run* -- it does I/O, opens a socket, reads a clock. So the set of things you must fake is not a matter of taste. If your I/O lives at adapters, that set is the adapters. Someone with completely different opinions about testing would compute the same set.

**Error-path tests can only live at the composition.** If failures short-circuit through a `Result` chain, then "step three fails, so the use case returns that failure" is a fact about the chain. Testing step three alone cannot observe it. Propagation does not exist inside one step.

**Interaction assertions are forced exactly when the effect is invisible from the outcome.** A successful transfer looks identical whether it retried twice or not at all. An audited transfer looks identical whether the audit entry was written or dropped. There, capturing the call is the only oracle that can see the behaviour. Everywhere else it couples your test to the implementation for nothing.

That last one inverts the usual advice, and it is worth saying plainly. "Don't mock" is a preference. *Mock exactly when the effect is unobservable* is a rule with a reason -- and it yields a much smaller number of interaction assertions than most codebases carry, and a firmly non-zero one, which the anti-mock camp gets wrong.

The loan codebase follows all three. Consistently.

So how do you write thirty-three tests for thirty-five cells and never notice?

---

## Because you checked, and both instruments said yes

You have two ways to find out whether a suite is thin. Reach for either one.

**Reach for coverage first.**

Consider a value object that accepts an integer between 1 and 100. A typical suite has five tests: a valid value, the maximum, zero, a negative, one over the limit. Careful boundary thinking. It reports **100% line coverage**.

It would also report 100% line coverage with two tests.

The code has two paths. The decision space has one boundary condition across an unbounded input range. Coverage measured the paths, because paths are what code is made of. It never asked what the code *decides*.

A metric that gives the same answer for a careful suite and a lucky one is not measuring care.

**Reach for the branch count instead.**

The common heuristic: three or more branches, write dedicated tests. Run it against the thirty-five-cell rule.

It scores four.

Not thirty-five. Four -- because the decisions are a switch expression over two enums returning constants, and there are only a handful of conditionals wrapped around it.

A branch count cannot see a decision expressed as data.

By that instrument, the most combinatorial rule in the entire system rates as borderline. It cleared the "three or more" bar by luck, not by measurement.

So: both instruments were consulted. Both said fine. The suite tests two columns of thirty-five.

They agree because they share a blind spot. **Line coverage and branch counting both measure the shape of the code. Neither one can see the size of what it decides.**

---

## Count the decision space

The fix is not a methodology. It is one question, asked before you write a single vector:

> **How many distinct decisions can this thing make?**

Not lines. Not conditionals. Distinct reachable outcomes, and across what input space.

- A range check on an integer: one boundary condition, unbounded inputs.
- A lookup keyed on two enumerations: the product of their sizes. Seven times five. You can count that before writing anything.
- A rule combining a volume discount, a customer tier and a promo code: the product of all three, plus the overlaps where they interact.

Thirty seconds per unit. And once you have the number, the strategy follows from it:

| Decision space | Write | Because |
|---|---|---|
| Small and enumerable | Examples | The space *is* the examples |
| A finite grid | A table, one row per cell | The cell count is known, so a gap is visible |
| Unbounded over a property | A property test | Examples sample an infinite space arbitrarily |

That middle row is the whole article.

Write the thirty-five-cell rule as a table and the missing rows are *missing*. They are a hole you can see, in a structure whose size you declared. Write it as thirty-three hand-picked methods and the hole is invisible -- and it stayed invisible through code review, through a green coverage report, and through a heuristic that rated the rule borderline.

Same tests. Same coverage number. Completely different chance of noticing.

---

## What I am not claiming

I checked one codebase carefully, and it did not falsify the branch-count heuristic. On the isolate-or-not question it predicted every decision correctly. If you came for an argument that your boundaries are wrong: they are probably fine, and that is the more useful result.

Hand-written examples are not always the wrong answer either. Where the space is genuinely small, examples are the clearest thing you can write, and a table for three cases is ceremony.

The claim is narrower. In a well-structured codebase the boundary decisions are already derived from the structure, and teams get them right. The coverage decisions are derived from nothing at all -- and that is where the gaps live, protected by two instruments that agree with each other because they are blind to the same thing.

---

Go and look at the most combinatorial rule in your system. The pricing matrix, the permission table, the one keyed on two enums.

Count its cells. Then count its tests.

---

*The functional discipline assumed here -- typed steps, errors as values, use cases composed from small pieces, I/O confined to adapters -- is described in [Java Backend Coding Technology](https://leanpub.com/jbct-book). The boundary rules fall out of that structure. They are not a testing philosophy layered on top of it.*
