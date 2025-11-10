# Java Backend Coding Technology: Rationale

The [Java Backend Coding Technology]() (referenced as **JBCT** below) is a densely packed reference guide. This article explains the reasoning behind key decisions.

## A Bit Of History

The journey began in 2016 when I realized traditional Java imperative style had no clear path to improvement. Every codebase developed its own conventions. Code reviews debated subjective preferences.

I started looking around and discovered functional programming. Many concepts appeared easier to grasp than the specific terminology around them. Monads are probably the most prominent example. This did lead me to the decision to mostly avoid specific terminology (except "monad").
The first experiments showed very promising results. Then came the disappointment: no functional library for Java had all tools I felt necessary. Several iterations later, Pragmatica Lite got its current shape.

Somewhere along this route I discovered that several patterns appeared repeatedly. We all know them. I didn't invent anything new. I just described them. Once I realized I had all the ingredients I needed, technology became a reality.

## Evaluation Criteria

Every decision in JBCT is evaluated against five objective criteria:

1. **Mental Overhead** - Items you must remember because the compiler can't catch them.
2. **Business/Technical Ratio** - Domain concepts vs. framework noise. The lower the level of technical details in code, the better business is visible.
3. **Design Impact** - Whether an approach improves design consistency or breaks it. Does it enforce good patterns or allow bad ones?
4. **Reliability** - Does the compiler catch mistakes, or must you remember? Type safety that makes invalid states unrepresentable eliminates entire classes of bugs.
5. **Complexity** - Number of elements, connections, and especially hidden coupling. Fewer moving parts and explicit dependencies are better.

The word **Complexity** will be mentioned a lot.

## Core Design Principles

**Reducing Complexity:** Behind each choice you will see at least a shadow of this goal. Sometimes it means losing traditional flexibility and limiting choices.

**Reducing Mental Overhead:** Clarity, precise and explicit domain semantics expression in code. The price for this is complete elimination of personal style. It also saves time by eliminating internal style debates.

**Balance and Consistency:**
- The simpler, the better. Minimal implementation, minimal complexity, minimal and clearly visible dependencies.
- Balance between brevity and context preservation. It's tempting to write concise code, and functional style can be great at it. But this easily can result in write-only code. Many rules intentionally focus on preventing this.
- Consistent approach. Equal rules are used to make decisions. Rationale behind every decision.

## Key Design Decisions

### Functional Programming

Optional, Stream, and CompletableFuture are everyday tools for most Java developers. These are monads. JBCT adds Result and Promise with the same familiar patterns.

Once traditional pain points like nulls and exceptions are eliminated, functional style code gets extremely simple.

### Patterns

Contrary to traditional imperative code, the Sequencer pattern represents business processes as linear chains of named steps. Use cases become readable because each step name reflects business language (validate, reserve, confirmBooking).

Technical patterns (Fork-Join, Aspects, Condition) handle structural concerns consistently, reducing technical noise.

When discussing requirements with domain experts, you can ask direct questions that map to code structure: "What happens if this step fails?" maps to Result types. "Can these run in parallel?" maps to Fork-Join vs. Sequencer.

### Mechanical Rules

Most structural decisions in backend code follow similar patterns: how to handle errors, where to validate, how to compose steps. Standardization replaces subjective judgment with mechanical rules, eliminating debates about style or "the right way."

The goal is not aesthetic beauty but predictable structure. When validation always happens in value object factories and errors always flow through Result types, teams gain shared mental models. Code reviews focus on business logic correctness, not structural choices. Onboarding becomes faster because developers recognize patterns immediately across the entire codebase.


