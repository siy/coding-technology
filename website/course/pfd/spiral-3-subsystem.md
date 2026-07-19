## blurb
Subsystems emerge from workflows that change together, and business cross-cutting - the audit ledger, the compliance check - becomes a design decision instead of runtime plumbing.

## learn
- The change-driver test applied one altitude up, from workflows to subsystems
- Thin, explicitly versioned boundary contracts between subsystems
- Business cross-cutting versus technical cross-cutting, named as a real distinction
- Audit-as-data versus audit-as-Aspect, and when each fits
- Recovery-class selection when compensation has to cross a subsystem boundary

## exercise
### Locate a Boundary-Crossing Concern | ~15 min
Pick a subsystem you own and find one business-driven concern - an audit trail, a compliance check, a cross-cutting business rule - that currently crosses its boundary. Decide whether it belongs as data your workflows produce, or as a wrapper applied uniformly around them, and say why.
