---
reviewed-at: c05471978e8dc91ab6d7c5eeff91901a7bc13ada
---

## blurb
When null is acceptable, converting it to Option at the boundary, and the recovery triple.

## learn
- When null is acceptable (adapter boundaries only)
- Converting null to Option immediately
- Fallback, alternative-source, and conditional recovery
- The recovery triple: backward, forward, designing failure out

## exercise
### Eliminate Null, Add a Fallback | ~20 min
Refactor one method in your codebase that mixes null checks with thrown exceptions into a Result/Option
pipeline with no null returns. Then take one operation with an external dependency and add a recovery
chain: primary source, fallback source, default value. Solution discussion in the book's Appendix B
(Exercises 2.4-2.5).
