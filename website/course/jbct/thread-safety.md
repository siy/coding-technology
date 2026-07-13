## blurb
Why immutability makes JBCT code thread-safe by default, pattern by pattern.

## learn
- Core thread safety principles in JBCT
- Pattern-by-pattern safety guarantees
- Promise resolution semantics
- Common mistakes and how to avoid them

## exercise
### Find the Shared Mutable State | ~15 min
Find a class in your codebase that mutates shared fields inside a callback or lambda (a counter, a
list append, an accumulator). Identify the race and refactor to remove the shared mutable state,
returning immutable results instead. Solution discussion in the book's Appendix B (Exercise 3.5).
