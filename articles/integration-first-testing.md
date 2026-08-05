---
tags: [testing, java, softwaredevelopment, architecture]
canonical_url: https://pragmatica.dev/articles/counting-the-decision-space
description: Test boundaries follow from the shape of the code, and most teams already place them correctly. The failure is one level down, in how coverage gets decided once you are inside an isolated suite.
published: false
---

# 33 Tests for a 35-Cell Table

**Your test boundaries are derived. Your coverage is a guess.**

---

## An anomaly in a good codebase

A loan origination service. 212 source files, 569 tests, written to a strict functional discipline: typed steps, errors as values, use cases composed from small pieces.

One of its business rules decides the maximum debt-to-income ratio a borrower may carry. It decides by looking up two enumerations -- seven loan types, five credit tiers. Thirty-five cells.

Its test suite contains 33 hand-written test methods. They cover two columns.

Nothing else about this codebase is sloppy. The value objects are exhaustively tested. The use cases are tested as compositions, with only adapters stubbed. Where an effect could not be observed from a return value, the tests capture the call instead -- which is exactly right, and most codebases get that wrong.

And the pattern is not local to one rule. Across the whole codebase: **536 plain test methods, 33 parameterized ones.** Every parameterized test is in a value object -- the one place the team's own guidance explicitly recommended them.

So this is not a story about a team that does not know how to test. It is a story about the point where a good discipline stops giving answers, and judgment quietly takes over.

---

## The part that is derived

Most testing advice arrives as a shape: the pyramid, 70/20/10, "mostly unit tests." The ratio is the input, and your code is expected to conform.

But if your code has a particular shape, several testing decisions stop being preferences and start being consequences. Three of them:

**The default is to isolate nothing.** The cheapest possible test instantiates the thing and calls it. You depart from that only when something on the path *cannot run* -- it does I/O, opens a socket, reads a clock. So the set of things you must fake is not a matter of taste. Given a codebase whose I/O lives at adapters, that set is *the adapters*, and someone with different opinions about testing would compute the same set.

**Error-path tests can only live at the composition.** If failures short-circuit through a `Result` chain, then "step three fails, so the use case returns that failure" is a fact about the chain. Testing step three alone cannot observe it, because propagation does not exist inside one step.

**Interaction assertions are forced exactly when the effect is invisible from the outcome.** A successful money transfer looks identical whether it retried twice or not at all. An audited transfer looks identical whether the audit entry was written or dropped. In those cases, asserting on the return value cannot see the behaviour under test, and capturing the call is the only oracle that can. Everywhere else, capturing the call couples your test to the implementation for nothing.

That third rule is worth dwelling on, because it inverts the usual advice. "Don't mock" is a style preference. *Mock exactly when the effect is unobservable* is a rule with a reason, and it produces a much smaller number of interaction assertions than most codebases contain -- and a non-zero one, which the anti-mock camp gets wrong.

Here is the striking part. In the loan codebase, and in the worked examples of the methodology it follows, **these boundary decisions are made correctly and consistently.** Which leaves the isolate-or-not question, and the honest answer there is that the usual heuristic works too.

---

## The part that is a guess

The usual heuristic is a count: *if a unit has three or more branches, give it its own tests.* It is serviceable, and in the codebase above it predicts every isolation decision correctly.

Then you are inside the isolated suite, and the discipline has nothing more to say. How many test vectors? Which ones? Nothing forces the answer, so someone picks examples.

Picking examples is where it goes wrong, and it goes wrong invisibly, because **both of the instruments we use to check ourselves measure the shape of the code rather than the size of its decision space.**

Take a value object that accepts an integer between 1 and 100. A typical suite has five tests: a valid value, the maximum, zero, a negative, one over the limit. That is careful boundary thinking, and it will be reported at **100% line coverage**.

It would also be reported at 100% line coverage with **two** tests. The metric cannot distinguish the careful suite from the lucky one, because the code has two paths and the decision space has an infinite number of inputs across one boundary condition. Coverage measured what the code looks like. It never asked what the code decides.

Now take the 35-cell table. A branch count sees four conditionals, because the decisions do not live in control flow at all -- they live in a switch expression over two enums, returning constants. **A branch count cannot see a decision that is expressed as data.** By that instrument, the most combinatorial rule in the entire system rates as marginal. It cleared the "three or more" threshold by luck, not by measurement.

Both instruments agree the suite is fine. The suite tests two columns of thirty-five.

---

## Count the decision space

The fix is not a new methodology. It is one question, asked before you write vectors:

> **How many distinct decisions can this unit make?**

Not how many lines. Not how many `if` statements. How many distinct outcomes are reachable, and across what input space.

- A range check on an integer: one boundary condition, unbounded inputs.
- A lookup keyed on two enumerations: the product of their sizes. Seven times five is thirty-five, and you can count it before writing a single test.
- A rule that combines a volume discount, a customer tier and a promotional code: the product of the three, plus the interactions where they overlap.

Once you have the number, the vector strategy follows from it, and this is the second thing that stops being a preference:

| Decision space | Strategy | Why |
|---|---|---|
| Genuinely small and enumerable | Hand-written examples | The space *is* the examples |
| A finite grid over enums or ranges | A table -- parameterized, one row per cell | The cell count is known, so partial coverage is a visible omission rather than an invisible one |
| Unbounded over a property | A property test | Examples sample an infinite space arbitrarily; a property states the invariant that must hold across it |

The 35-cell table wants a table. Written as 35 rows, an omission is *visible* -- the rows are simply not there. Written as 33 hand-picked methods, the omission is invisible, and it stayed invisible through code review, through 100% coverage reporting, and through a branch-count heuristic that rated the rule marginal.

The range check wants a property: *every accepted value satisfies the invariant, and every rejected value violates it.* That is exhaustive over the stated bound in a way that five examples are not, and it does not go stale when the bound changes.

---

## What this does not claim

I checked one codebase, carefully, and it did not falsify the branch-count heuristic. The heuristic predicted every isolate-or-not decision correctly. If you came here expecting an argument that your boundary rules are wrong, they are probably fine, and that is the more useful finding.

I am also not claiming that hand-written examples are always wrong. Where the decision space is genuinely small, examples are the clearest thing you can write, and a table for three cases is ceremony.

The claim is narrower and, I think, more actionable: **the boundary decisions in a well-structured codebase are already derived from the structure, and teams get them right. The coverage decisions are not derived from anything, and that is where the gaps are.** Both of the instruments we use to reassure ourselves -- line coverage and branch counting -- measure the shape of the code and are blind to the size of what it decides.

Counting the decision space takes about thirty seconds per unit. It costs nothing, it happens before you write the tests, and it is the difference between a suite that covers two columns and one that covers thirty-five.

---

*The functional discipline this article assumes -- typed steps, errors as values, use cases composed from small pieces, I/O confined to adapters -- is described in [Java Backend Coding Technology](https://leanpub.com/jbct-book). The boundary rules discussed here fall out of that structure; they are not a testing philosophy layered on top of it.*
