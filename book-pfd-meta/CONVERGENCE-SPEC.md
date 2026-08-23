# Specification — Issue Parking Permit

Implement ONE use case as Java source files. No build file, no tests, no README.

## The operation

**IssuePermit** — a resident applies for a residential parking permit for one vehicle in one zone.

## Input

- applicant tax identifier (string, 11 digits)
- vehicle registration (string, 2 letters followed by 4 digits)
- zone code (string, exactly 3 uppercase letters)
- requested start date

## Steps

1. Validate the input.
2. Look up the resident record by tax identifier. (external call)
3. Look up the vehicle record by registration. (external call)
4. Check remaining capacity for the zone. (external call)
5. Calculate the annual fee.
6. Persist the issued permit. (external call)
7. Send a confirmation notification. (external call)

## Rules

- Fee: base fee is 120 for zone codes beginning with A, 90 for B, 60 for anything else.
- Residents aged 65 or over receive a 50% discount.
- If the resident already holds a permit for another vehicle, add a surcharge of 40.
- A zone with no remaining capacity cannot issue a permit.
- A vehicle whose recorded weight exceeds 3500 kg is not eligible for a residential permit.

## Failures

Invalid input, resident not found, vehicle not found, vehicle ineligible, zone full,
persistence failure.

**Step 7 is best-effort: a failed notification must not fail the operation.**

## Output

The issued permit: permit id, zone code, vehicle registration, start date, end date
(one year after start), and the fee charged.
