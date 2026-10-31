---
reviewed-at: bb7668ba039d0fb4c34f50032a8d3536e99d4ff6
---

## blurb
Vertical slicing, the telescope rule for package growth, and where each type belongs.

## learn
- Vertical slicing philosophy and package organization
- The telescope rule: how the package tree grows with altitude
- Module promotion: when a package boundary becomes a compile-time boundary
- File structure: import ordering, member ordering, utility interfaces
- Integrating a database library: jOOQ in an `io` step

## exercise
### Organize Your Own Feature | ~15 min
Take a feature you've built (or RegisterUser from the earlier lesson) and lay out its package
structure as a package tree: the use case package, its steps (nested or moved out), `io` for its I/O
steps, and `shared` for anything a second use case needs. Give every type a business name. Solution discussion in the
book's Appendix B (Exercise 5.3).
