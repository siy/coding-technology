---
reviewed-at: 52dd580b80a406f272b587baac26264d5b56ff41
---

## blurb
Fork-Join for parallel inventory checks, Sequencer for the payment flow, and compensation on failure.

## learn
- Fork-Join for parallel inventory checks
- Sequencer for dependent steps: reserve, pay, create
- Compensation pattern for rollback on failure
- Fire-and-forget for non-critical notifications

## exercise
### Implement Compensation | ~25 min
Implement a booking flow with three steps - reserve, charge, confirm - where a failure at any step
rolls back the ones before it: release the reservation if payment fails, refund and release if
confirmation fails. Solution discussion in the book's Appendix B (Exercise 5.2).
