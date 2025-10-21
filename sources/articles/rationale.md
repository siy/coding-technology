# Java Backend Coding Technology: Rationale

Almost exactly 4 years ago I wrote a blog post [We Should Write Java Code Differently](https://dev.to/siy/we-should-write-java-code-differently-210b).
It was my first attempt to explain what I understood about the code and why it is important. 
This article is similar attempt to explain rationale behind highly technical reference guide details explained in the [previous article](../../CODING_GUIDE.md).

## First And Foremost
I tried my best to make every decision as rational as possible. Using criteria as a tool to make measurable or, at least, comparable decisions.
I'll do my best to explain why I made every particular decision.

## Criteria
(from the previous article)
(TBD insert link to the previous article but provide full quote of the criteria)

## Reducing Complexity
You'll notice it behind basically every decision. Sometimes it means loosing current flexibility by limiting choices. 

## Reducing Mental Overhead
Clarity, precise and explicit domain semantics expression in code. Again, the price for this is complete dilution of the personal style. It also saves tons of time by eliminating internal style debates. 

## Basic Considerations
- The simpler - the better. Minimal implementation, minimal complexity, minimal dependencies. Limited set of middle level design choices removes everyday hurdle to invent the wheel. You have ready to use wheels already. 
- Balance between brevity and context preservation. It's tempting to write concise code and functional style can be very good at it. But this easily can result in write-only code. Many rules intentionally focused on prevention this to happen. 
- Consistent approach. Equal rules used to make decisions. Rationale behind every decision.

Let's look at them closer.

## Why 