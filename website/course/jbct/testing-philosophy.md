## blurb
Integration-first testing: stub everything, then implement incrementally toward production-ready.

## learn
- Why integration-first testing aligns with functional composition
- The evolutionary process: stub -> implement incrementally -> production-ready
- Counting the decision space: which leaves owe isolated tests, and what kind
- Handling complex test inputs with builders and factories

## note
The pattern here (stub, then implement one step at a time) is what the worked examples later in the
course follow.

## exercise
### Test a Value Object's Boundaries | ~15 min
Pick a value object factory in your codebase. Write tests for its boundary cases: minimum valid,
maximum valid, and the failure just outside each boundary, using functional assertions
(onSuccess/onFailure) instead of exception matchers. Solution discussion in the book's Appendix B
(Exercise 4.1).
