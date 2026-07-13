## blurb
Make invalid states unrepresentable: validation becomes construction, not a separate step.

## learn
- Why validation should be inseparable from construction
- Factory methods that return Result<T>
- Cross-field validation
- Incremental adoption in existing codebases

## exercise
### Convert a Validated Class | ~15 min
Take a class from your current codebase that carries an `isValid()` or `validate()` method. Convert it
to a Result-returning factory: private constructor, static factory, every invariant checked at the
single entry point. What call sites became impossible to write incorrectly?
