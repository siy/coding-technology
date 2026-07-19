## blurb
Workflows emerge when use cases multiply and start sharing a change driver - compensation, saga, and time-as-decay follow from that emergence.

## learn
- Workflows as clusters of use cases sharing one change driver
- Compensation: domain-internal versus domain-escaping, and the residue each leaves
- Saga as a composite shape, not a primitive
- Time-as-decay versus time-as-trigger versus time-as-condition
- Recovery-class selection once a use case becomes a workflow

## exercise
### Classify a Workflow's Compensation | ~15 min
Name one workflow you maintain that spans several use cases - a cancellation-and-refund path, a multi-step signup. Identify what has to be undone if it fails partway, and whether that undo stays inside your own domain or escapes into someone else's (an email, a third-party charge).
