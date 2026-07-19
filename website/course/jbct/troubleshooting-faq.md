## blurb
Debugging monadic chains, common mistakes, and quick answers to the questions that come up most.

## learn
- Adding onSuccess/onFailure for visibility in chains
- Extracting to named methods for breakpoints
- Common mistakes: nested Result, ignored Result, throwing in lambdas
- Using explicit types when inference fails

## note
Reference lesson - bookmark it rather than reading straight through. Come back when a chain fails
silently.

## exercise
### Instrument a Silent Failure | ~10 min
Take a flatMap chain in your codebase that's hard to debug. Add onSuccess/onFailure logging at each
step, or extract each step to a named method for breakpoints, until you can see exactly where it
fails. Solution discussion in the book's Appendix B (Exercise 6.3).
