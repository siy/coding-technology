---
reviewed-at: 0fb119ca8d741cc974298ac4877f22f6e85d072a
---

## blurb
A phased playbook for adopting JBCT in an existing codebase without a big-bang rewrite.

## learn
- Assessing whether your codebase is ready
- Phase 1: value objects only
- Phase 2: Result in new code
- Phase 3: extract use cases; Phase 4: I/O isolation

## note
For an existing codebase, not a greenfield one. If you're starting fresh, the four phases still show a
sensible build order.

## exercise
### Plan Your Migration | ~20 min
Pick one service in your codebase with scattered validation, thrown exceptions, and mixed concerns.
Write a four-phase migration plan (value objects, Result in new code, extract use case, I/O
isolation) with one commit per step. Solution discussion in the book's Appendix B (Exercise 6.2).
