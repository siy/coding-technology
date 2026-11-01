---
reviewed-at: 0b5f276f53e795577637b25d0c64bce0d1cc961c
---

## blurb
Errors as typed Cause values instead of exceptions, with exhaustive switches and clean composition.

## learn
- Why business logic never throws exceptions
- Typed error hierarchies with Cause and sealed interfaces
- The construction idiom: data components, a trailing message, and the FACTORY
- Translating a failure without losing it: mapError carries the original cause
- Rendering user text at the boundary with an exhaustive switch
- Error accumulation vs fail-fast semantics
- Monadic composition rules

## exercise
### flatMap vs Result.all() | ~10 min
Take a validation chain in your codebase that checks two independent fields with flatMap. Rewrite it
with Result.all() instead. Given bad input in both fields, compare what each version reports to the
caller. Solution discussion in the book's Appendix B (Exercise 2.3).
