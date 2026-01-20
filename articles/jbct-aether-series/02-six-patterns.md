---
title: "The Six Patterns That Cover Everything"
tags: [java, functionalprogramming, architecture, backend]
canonical_url: https://pragmatica.dev/articles/six-patterns-that-cover-everything
published: true
description: "Six patterns describe every possible data flow. They also describe every business process. This isn't coincidence - it's why they work as a shared language between developers and business."
---

# The Six Patterns That Cover Everything

## The Complete Vocabulary

Every data transformation you'll ever write falls into one of six patterns:

- **Leaf** - One thing. No substeps. Atomic.
- **Sequencer** - This, then that. Output becomes input.
- **Fork-Join** - These together, then combine. Independent operations merging.
- **Condition** - Which path? Route based on value.
- **Iteration** - Same thing, many times. Transform a collection.
- **Aspects** - Wrap it. Add retry, timeout, logging around an operation.

That's it. Six patterns. They cover everything.

Not "cover most cases." Not "work well for common scenarios." Everything. Every piece of request processing logic you'll ever write is one of these six, or a composition of them.

## Why Only Six?

These aren't design patterns someone invented. They're the fundamental ways data can flow:

1. **Transform a value** (Leaf)
2. **Chain dependent transforms** (Sequencer)
3. **Combine independent transforms** (Fork-Join)
4. **Choose between transforms** (Condition)
5. **Apply transform to many values** (Iteration)
6. **Enhance a transform** (Aspects)

There's no seventh option. Data either transforms, chains, combines, branches, iterates, or gets wrapped. That's the complete set of possibilities.

This is why learning six patterns gives you everything. Not because JBCT is comprehensive - because reality is constrained.

## The Strange Coincidence

Here's what's remarkable: these same six patterns describe every business process.

Think about any workflow in your domain:

- **Leaf**: "Validate the email format" - one check, atomic
- **Sequencer**: "First verify identity, then check permissions, then grant access" - dependent chain
- **Fork-Join**: "Get user profile, account balance, and recent transactions, then build the dashboard" - independent data gathering
- **Condition**: "If premium user, apply discount; otherwise, standard pricing" - routing
- **Iteration**: "For each item in cart, calculate tax" - collection processing
- **Aspects**: "Log every payment attempt" - cross-cutting concern

Business processes and code patterns use the same vocabulary. This isn't coincidence. It's because both describe how information flows and transforms. Business logic IS data transformation - we just use different words for it.

## The Common Language

This equivalence creates something powerful: a shared language between developers and business stakeholders.

Watch the precision gain:

> **Before:** "Get the user's stuff and show it"
>
> **After:** "Fork-Join: fetch profile, preferences, and history in parallel, then combine into dashboard view"

Same requirement. One is vague. One is implementable.

When a developer asks "Can these operations run in parallel?" they're really asking "Do these steps depend on each other's results?"

When business says "First we verify, then we process, then we notify" - that's a Sequencer. Directly translatable to code.

When business says "We need the user's profile, their preferences, and their history to show the dashboard" - that's a Fork-Join. Three independent fetches, one combined result.

The translation becomes mechanical:

- "Check if..." → **Leaf** → Single validation
- "First... then... then..." → **Sequencer** → `.flatMap()` chain
- "Get X and Y and Z, then..." → **Fork-Join** → `Promise.all()`
- "If... otherwise..." → **Condition** → Ternary/switch
- "For each..." → **Iteration** → `.map()` / loop
- "Always log/retry/timeout..." → **Aspects** → Wrapper function

No translation layer. No impedance mismatch. The same six concepts, different vocabulary.

## Gap Detection

Here's where it gets interesting. When you model business processes using these patterns, gaps become visible.

**Missing validation:**
You're building a Sequencer: verify -> process -> notify. But what validates the input before "verify"? The pattern demands something produces the input for step one. If nothing does, you've found a gap.

**Unclear dependencies:**
Business describes five things that need to happen. Are they a Sequencer (dependent chain) or Fork-Join (independent operations)? If they can't tell you which outputs feed which inputs, the process isn't fully defined.

**Missing error handling:**
Every Leaf can fail. Every step in a Sequencer can fail. When you map business process to patterns, you naturally ask: "What happens when this fails?" If they don't know, you've found a gap.

**Inefficient flows:**
Business describes a sequential process: get A, then get B, then get C, then combine. But if A, B, and C don't depend on each other, this should be Fork-Join, not Sequencer. The pattern reveals the inefficiency.

The patterns don't just implement requirements - they validate them.

## The Right Questions

Once you think in patterns, the right questions emerge naturally:

**At the start (Leaf/Validation):**
- "How do we know this request is valid?"
- "What makes an email/phone/amount valid in your domain?"
- "What's the first thing we need to verify?"

**For sequences (Sequencer):**
- "What do we need from step 1 to perform step 2?"
- "Can step 3 ever happen if step 2 fails?"
- "Is this order fixed, or could steps be reordered?"

**For parallel work (Fork-Join):**
- "Do these operations depend on each other?"
- "Can we fetch user profile while also fetching their orders?"
- "What do we do if one succeeds and another fails?"

**For branching (Condition):**
- "What determines which path we take?"
- "Are these paths mutually exclusive?"
- "Is there a default path?"

**For collections (Iteration):**
- "Do we process all items or stop at first failure?"
- "Does order matter?"
- "Can items be processed independently (in parallel)?"

**For cross-cutting concerns (Aspects):**
- "Should we retry on failure? How many times?"
- "Is there a timeout?"
- "What needs to be logged/measured?"

You're not inventing questions. The patterns generate them. Each pattern has a fixed set of things that must be defined. If they're not defined, you ask.

## From Patterns to Process Design

The flow works both ways.

**Forward:** Business describes a process -> you identify patterns -> you implement code

**Backward:** You see the patterns -> you notice gaps -> you ask questions -> business clarifies -> process improves

This backward flow is underrated. Developers who think in patterns become process consultants. They don't just implement what they're told - they improve what they're told by making implicit assumptions explicit.

"You said first A, then B, then C. But B doesn't use A's output. Can B and A happen at the same time? That would be faster."

"You said validate the request. What exactly are we validating? Email format? Email exists in system? User is active? Each is a separate check."

"You said handle the error. Which error? Network timeout? Invalid data? User not found? Each might need different handling."

The patterns force precision. Vague requirements become concrete when you have to place them in one of six boxes.

## The Result

When developers and business share this vocabulary:

- Requirements discussions become technical design sessions
- Gaps surface during conversation, not during implementation
- Code structure mirrors business process (because they're the same thing)
- Changes in business process map directly to code changes
- New team members understand both business and code faster

Six patterns. Complete coverage. Shared language. Gap detection built in.

This is why pattern-based thinking isn't just a coding technique. It's a communication framework that makes the implicit explicit and the vague precise.

The irony? You'll spend an hour asking the right questions. The coding takes 30 seconds. Turns out the "coding technology" is mostly about not coding.

---

*Part of [Java Backend Coding Technology](https://pragmatica.dev) - a methodology for writing predictable, testable backend code.*

**Previous:** [The Underlying Process of Request Processing](https://dev.to/siy/the-underlying-process-of-request-processing-1od4)
