---
reviewed-at: 0ad13223b0b3d1573eb6210468305ade29d446fa
---

## blurb
Installing Pragmatica Core and its shared vocabulary: map, flatMap, filter, and recover across all four types.

## learn
- Why Optional, CompletableFuture, and null fall short
- One consistent API across types: map, flatMap, filter, recover
- Lifting up is safe; lowering loses information
- Result.all() and Promise.all() accumulate failures; Promise.allOrCancel() fails fast

## note
Install the library (`org.pragmatica-lite:core`, 1.0.0-rc4) before continuing - every later lesson
assumes it's on your classpath.

## exercise
### Complete the Lifting Chain | ~15 min
Write a method that parses an id into a value object (Result), checks a cache (Option), and falls back
to a database call (Promise) - chaining all three into one Promise. Solution discussion in the book's
Appendix B (Exercise 1.3).
