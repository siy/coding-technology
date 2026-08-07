---
tags: [testing, java, softwaredevelopment, architecture]
canonical_url: https://pragmatica.dev/articles/every-test-can-name-why-it-exists
description: A complete backend test strategy - four kinds of test, each one derived from a property of the code rather than chosen from a convention, plus the rules that fall out and why the result beats picking a ratio.
published: true
---

# Every Test Can Name Why It Exists

**Four kinds of test, each derived from a property of the code**

---

Most test strategies arrive as a shape. The pyramid: lots of unit tests, fewer integration
tests, a handful of end-to-end. Seventy, twenty, ten. The proportions are the input, and
your code is expected to conform to them.

This is the opposite. Start from what the code is, derive what the tests must be, and let
the proportions come out wherever they come out.

Here is the whole strategy up front:

- **Value object tests** -- cover one type's invariant. No isolation needed; the thing is pure.
- **Complex leaf tests** -- cover one rule's decision space. No isolation needed; the thing is pure.
- **Use case tests** -- cover the composition: ordering, propagation, branching. Adapters stubbed, everything else real.
- **Adapter contract tests** -- cover success, failure, and the translation between worlds. Run against the real dependency.

Four kinds. Nothing else. The rest of this is where each one comes from, and why the list
is not longer or shorter.

---

## The one premise

Everything below follows from a single structural fact, and if your code does not have it,
none of this applies.

**The code is a set of typed steps, composed into use cases, with errors as values and I/O
confined to adapters.** A use case does not reach out to a database; it takes a step that
does, and that step is a parameter. Failures do not throw; they travel back through the
composition as values.

```java
public interface RegisterUser {
    Result<Response> execute(Request request);

    static RegisterUser registerUser(CheckEmailUniqueness checkEmail,
                                     CreateValidUser createUser,
                                     SaveUser saveUser,        // <- the only I/O in here
                                     GenerateToken generateToken) { ... }
}
```

That shape is what makes the strategy derivable. Every decision below reads a property of
it.

---

## 1. Value object tests

**The code fact:** a value object is pure and has zero dependencies. `Email.email(raw)`
takes a string and returns a `Result<Email>`. There is nothing to stub because there is
nothing to reach.

**Therefore:** test it directly. Not because unit tests are virtuous, but because isolation
is free here -- there is no assembly to do and nothing to fake.

**How many tests, though?** That is the question people answer by habit, and habit is
where the gaps come from. Count the decision space first, and let the count choose the
shape:

- **Small and enumerable** -- a status enum, a three-way branch. Write examples: the space
  *is* the examples.
- **A finite grid** -- an enum against an enum, banded ranges. Write a table, one row per
  cell: the cell count is known, so a missing row is a hole you can see.
- **Unbounded** -- any string, any `BigDecimal`, any timestamp. State the invariant: four
  examples sample an infinite space as arbitrarily as one does.

`Quantity` accepting 1..100 is the first kind: boundary examples genuinely cover it.
`Email` is the third. Four malformed strings do not cover the space of malformed
addresses; they cover four of them. The honest test states what the parser guarantees --
normalization is idempotent, nothing accepted violates the invariant -- which is what
property-based testing libraries automate by generating inputs instead of listing them.

**Do not use coverage to check yourself here.** Four hand-picked strings reach 100% line
coverage of `Email`. So would two. A metric that reports the same number for a careful
suite and a lucky one is measuring the paths the code has, not the space it decides over.

---

## 2. Complex leaf tests

**The code fact:** most business leaves are trivial -- one calculation, one transformation
-- and are exercised whenever the use case runs. A few are not.

**Therefore:** a leaf earns its own tests when the assembled use case cannot reach its
decision space at a price worth paying.

Here is a real one. An order price calculator with three rules: a volume discount by item
count, an order-value discount, a shipping rule that depends on the discounted total. Plus
the rule that the two discounts do not stack -- the customer gets the better of them.

Three volume bands, two value bands, three shipping outcomes: **eighteen combinations.**

Two things fall out of that number, and both arrive before any test is written. First,
three of the eighteen are *impossible*: an order over the large-order threshold, discounted
by at most 10%, always clears free shipping, so a large order can never pay flat shipping.
That is a fact about the rules, and counting is how you find it. Second, the fifteen that
remain want a table:

```java
@ParameterizedTest
@CsvSource({
    // unit,  items, oversized, expected   -- subtotal / volume / value / shipping
    "  20.00,     5, false,      109.99",  //   100 / none / low  / flat
    "   4.00,    25, false,      104.99",  //   100 / 5%   / low  / flat
    "   2.00,    50, false,       99.99",  //   100 / 10%  / low  / flat
    // ... twelve more
    "  40.00,    25, false,      950.00",  //  1000 / 5% vs 5%: equal, so no stacking
    "  20.00,    50, false,      900.00",  //  1000 / 10% beats 5%: volume wins
})
void calculate_computesTotal_acrossTheDecisionSpace(...) { ... }
```

Now compare that with testing the same fifteen through the use case. Each vector there
needs six stubs, a request with lines and an address, and an `await()` -- roughly fourteen
lines against one row. Two hundred lines of assembly to check a multiplication, and every
failure reports "PlaceOrder failed" rather than naming the rule that broke.

**The common heuristic -- three or more branches, write dedicated tests -- works.** Keep
it. Just know that it cannot see a decision expressed as *data*: a limit resolved by
looking up two enumerations, seven types against five tiers, is thirty-five answers wrapped
in four conditionals, and rates borderline on a branch count while being the most
combinatorial rule in the system.

---

## 3. Use case tests

**The code fact:** the use case is a composition. Its steps are parameters. The only thing
on the path that cannot run in a test is I/O, and I/O lives at adapters.

**Therefore:** assemble the whole use case, stub only the adapters, and test the behavior.
The stub set is not a preference -- it is the minimum that makes the test runnable, and
anyone with the same code would compute the same set.

```java
@Test
void execute_fails_whenEmailAlreadyExists() {
    CheckEmailUniqueness checkEmail = req -> EMAIL_ALREADY_REGISTERED.promise();
    // remaining steps stubbed for success

    useCase.execute(validRequest())
           .await()
           .onSuccess(Assertions::fail);
}
```

This is where behavior lives, so this is where most of the interesting tests are: happy
path, each step's failure, each branch condition, error propagation through the chain.

Two rules make this level work, and both are easy to get wrong.

**Assert on the outcome, except where the effect is invisible in it.** A transfer that
retried twice looks identical to one that never retried. A transfer that wrote an audit
entry looks identical to one that dropped it. There, capturing the call is the only oracle
that can see the behavior:

```java
@Test
void execute_auditsSuccessfulTransfer() {
    var audited = new ArrayList<AuditEntry>();
    AuditLog auditLog = entry -> { audited.add(entry); return Promise.success(unit()); };
    // ...
    assertEquals(1, audited.size());
}
```

Everywhere else, capturing calls couples the test to the implementation for nothing. The
rule is neither "avoid mocks" nor "verify interactions": **assert on the effect where the
effect is visible, and on the call only where it is not.** That produces far fewer
interaction assertions than a mock-first habit, and a firmly non-zero number, which a
no-mocks rule gets wrong.

**One composition test for propagation, N cheap vectors for the space.** When validation
lives in its own type, test it there -- that is where the vectors are cheap -- and keep
exactly one use case test proving that a validation failure short-circuits the remaining
steps. That fact is a property of the chain and exists nowhere else. Everything beyond it
is duplication that breaks twice on every change.

---

## 4. Adapter contract tests

**The code fact:** an adapter is the one place two worlds meet. It converts a domain call
into SQL or HTTP, and converts what comes back -- including exceptions -- into typed
domain values.

**Therefore:** it needs tests against the real dependency, and it needs exactly three
kinds: it succeeds, it fails the way the domain expects, and it translates a transport
exception into a typed failure.

```java
@Test
void findById_wrapsException_whenDatabaseFails() {
    var repo = new JooqUserRepository(failingConnection(new SQLException("reset")));

    repo.findById(SOME_ID)
        .await()
        .onSuccess(Assertions::fail)
        .onFailure(cause -> assertInstanceOf(UserError.StorageUnavailable.class, cause));
}
```

**This is the layer most often missing, and skipping it undermines everything above it.**
Every stub in every use case test is an assumption about a boundary: that the real adapter
succeeds that way, fails that way, translates that way. Nothing in the use case tests
checks any of it. The contract test is what makes the stub honest, and a suite of
integration-first tests without contract tests is a suite whose stubs nobody has verified.

The third case is the one that matters most and the one usually absent. Translation is the
adapter's entire job, and no use case test can reach it.

---

## Why this is better than choosing a ratio

**Every test can name why it exists.** Not "we needed coverage" -- a property of the code
put it there. That makes tests reviewable on a basis other than taste, and it makes
deleting one a decision you can argue about with evidence.

**The proportions become an output.** You never argue about whether you have enough unit
tests. You have as many as the pure-and-combinatorial parts warrant, as many use case tests
as the compositions warrant, and if that comes out diamond-shaped rather than pyramid
shaped, that is information about your code, not a violation of a rule.

**Nothing is tested twice.** Each fact is tested where it lives: invariants in the type,
decision spaces in the rule, propagation in the composition, translation in the adapter.
Duplication is what makes suites brittle, and duplication is what a shape-first strategy
produces, because the shape does not know what is already covered.

**Refactoring stops breaking tests.** Tests assert on outcomes, and stubs sit at boundaries
that only move when the architecture moves. Rename an internal method and nothing turns
red.

**Gaps become visible.** A table with a known cell count shows its holes. A decision count
gives you a target before you start. Neither line coverage nor a branch count can do that,
because both measure the shape of the code rather than the size of what it decides.

---

## What this needs from you, and what it does not

It needs the premise. If your business logic reaches out to a database directly, the stub
set is not "the adapters" and the derivation does not run. Fixing that is a design change,
not a testing change -- which is the honest answer, and also the useful one, since a branch
you cannot reach in a test is usually telling you about a hidden dependency rather than
about your test suite.

It does not need a new framework. Everything here is JUnit and parameterized tests, apart
from the one place property-based testing earns its keep.

And it does not need the pyramid. Count what your code decides, put each test where the
fact it checks actually lives, and let the shape fall out.

---

*The structure assumed here -- typed steps, errors as values, use cases composed from small
pieces, I/O confined to adapters -- is described in
[Java Backend Coding Technology](https://leanpub.com/jbct-book), along with the worked
examples the tests above are drawn from.*
