## blurb
Where JBCT sits among the functional options on the JVM: railway-oriented error handling, Vavr, and Arrow-kt.

## learn
- Railway-oriented programming for error handling
- Simpler than full FP libraries (Vavr, Arrow-kt)
- Structural patterns other approaches lack
- When a general-purpose functional library earns its place, and when it does not

## note
Reading/analysis lesson, no code. Useful when choosing between Pragmatica Core and a general-purpose
functional library.

## exercise
### Count Your Failure Channels | ~15 min
Take one method in your codebase that orchestrates several steps. Count the distinct ways it signals
failure: return codes, exceptions, nulls, logged-and-swallowed. Write down how many there are, then
how many a caller would have to know about to use the method safely.
