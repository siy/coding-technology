## blurb
Growing context between pipeline steps, and the mapWith family that keeps each stage to one line.

## learn
- Growing context: threading accumulated knowledge forward as a typed proof of progress
- The mapWith / flatMapWith / ensureWith family (Pragmatica Core 1.0.0-rc1)
- Gating vs. evidence: when a check may discard its result vs must accrete it

## exercise
### Grow a Context Record | ~20 min
Take a multi-step pipeline in your codebase where each step needs data from the previous ones. Replace
ad-hoc parameter passing with a single context record that each step enriches, using mapWith or
flatMapWith to keep each stage to one line.
