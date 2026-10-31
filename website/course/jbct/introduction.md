---
reviewed-at: 1ab9aa897e15120c9fa5533754eafa23f13270af
---

## blurb
Why JBCT exists, the problems it fixes, and how the rest of the course is organized.

## learn
- Why code unification matters in the AI era
- The problems JBCT solves
- The five evaluation criteria for design decisions
- Foundational concepts: side effects, composition, monads

## note
No code changes yet - this lesson sets the vocabulary the rest of the course builds on.

## exercise
### Spot the Problems | ~10 min
In your own codebase, find one place that uses `orElse(null)` with `Optional`, one method that throws
an exception for a business failure, and one `CompletableFuture` chain with tangled error handling.
Don't change anything yet - just note where each of the four return types from the next lesson would apply.
