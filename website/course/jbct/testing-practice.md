## blurb
Organizing large test suites, what to test where, and migrating from traditional unit tests.

## learn
- Organizing large test counts without drowning in complexity
- What to test where: value objects, leaves, use cases, adapters
- Complete worked example: RegisterUser from stub to production
- Migrating from traditional unit testing

## exercise
### Write Stubs for a Use Case | ~15 min
Take a use case with two or three step interfaces. Write lambda stubs for the success path and for
each distinct failure path, then write one test per stub combination using `.await()` before
assertions. Solution discussion in the book's Appendix B (Exercise 4.2).
