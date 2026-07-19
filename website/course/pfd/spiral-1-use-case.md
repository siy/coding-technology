## blurb
One use case, buying a ticket, walked end to end - its types, its patterns, its recovery, and the questions it deliberately leaves open.

## learn
- Per-process types versus a shared entity model
- Value objects that genuinely mean the same thing everywhere
- How the six patterns distribute at use-case altitude
- Backward error recovery and designing a conflict out, in one worked example
- Per-use-case service-level targets
- What use-case altitude defers to later passes

## exercise
### Type One Use Case's Steps | ~20 min
Take one use case in a system you maintain and list its steps as typed operations - trigger, typed input, typed output, typed failures. Identify one place where you currently reuse a shared entity type that should instead be a type scoped only to this use case.
