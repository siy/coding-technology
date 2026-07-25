// examples.js — sheets the playground loads. Kept out of the page so the tests can
// assert against the same text a visitor sees.

export const CLEAN_SHEET = `schema_version = "0.1"

[meta]
system = "companies-house"
era    = "2017-2025"
mode   = "greenfield"

# --- Q1 Time budget: per operation, priced, triaged to a clock ---
[[answers.q1]]
scope     = "path:company-search"
statement = "P95 <= 200 ms at the register's read peak"
shape     = "system-clock"
price     = "read-path engineering; charged against the Q8 envelope"

# --- Q2 Failure budget: per operation, priced ---
[[answers.q2]]
scope     = "operation:accept-filing"
statement = "99.9% monthly, tier-1 criticality"
price     = "filing backlog plus statutory penalty exposure"

# --- Q3 Loss budget: per data class ---
[[answers.q3]]
scope     = "data-class:filings"
statement = "RPO 0, retention 20 years, never-lose set = accepted filings"

# --- Q4 Consistency contract: per data class or path ---
[[answers.q4]]
scope     = "data-class:filings"
statement = "strict on accept; read-your-writes for the filer's own view within 1 s"

# --- Q5 Load: per path, with a shape ---
[[answers.q5]]
scope     = "path:company-search"
statement = "50k req/s peak, concentrated in the 09:00 filing window"
shape     = "volume"

# --- Q6 External constraints: audit and replay are different demands ---
[[answers.q6]]
scope     = "data-class:filings"
kind      = "audit"
statement = "who filed what and when, retained 20 years"

# --- Q7 Release structure: divergence is what presses ---
[[answers.q7]]
scope     = "system"
statement = "search ships weekly; the filing engine ships 3 times a year"

# --- Q8 Envelope: money and who operates ---
[[answers.q8]]
scope     = "system"
statement = "4 engineers, no platform team, 250k GBP/yr infrastructure"

# --- Q9 Multi-X ---
[[answers.q9]]
scope     = "system"
statement = "1 country, 1 currency, no tenancy split"

# --- Second row source: domain shape per effectful operation ---
[[domain_shape]]
operation   = "accept-filing"
inverse     = "none"
decays      = false
reshapeable = ["append-only"]
`;

export const GAPPY_SHEET = `schema_version = "0.1"

[meta]
system = "order-platform"
mode   = "greenfield"
# era is missing: a sheet without an era cannot be compared to an outcome

# Unpriced, and no clock: is 200 ms a statutory window or a response target?
[[answers.q1]]
scope     = "operation:checkout"
statement = "checkout should respond in 200 ms"

# An observed failure is not a stated target, and the nine has no price
[[answers.q2]]
scope     = "operation:checkout"
statement = "we saw 99.2% last quarter"
observed  = true

# Answered at system scope; the loss budget is per data class
[[answers.q3]]
scope     = "system"
statement = "we cannot lose orders"

# A bare adjective wearing digits
[[answers.q5]]
scope     = "path:catalog-browse"
statement = "needs high availability and 99.9% scalability"

# "audit" without a kind bundles two different demands
[[answers.q6]]
scope     = "data-class:orders"
statement = "we need a full audit trail"

# A bundled organisational answer
[[answers.q7]]
scope     = "system"
statement = "we need team independence across 4 squads"

# An honest UNKNOWN: valid input, recorded, never guessed
[[answers.q8]]
scope  = "system"
status = "UNKNOWN"

# checkout is effectful but has no domain-shape row, so recovery cannot be derived
`;
