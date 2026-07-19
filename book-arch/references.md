# References

*Works engaged with, grouped by the role they play. Evidence sources for the blind derivations and the brownfield case are listed by system, since their citations anchor specific graded claims.*

## The shelf this book sits on

- Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly, 2017) — the physics this book's ledger presupposes; also the source of the discipline against one-bit consistency labels.
- Mark Richards & Neal Ford, *Fundamentals of Software Architecture* (O'Reilly, 2020) — the modern catalog, engaged as the genre's best exemplar.
- Denys Poltorak, *Architectural Metapatterns: The Pattern Language of Software Architecture*, v1.2 (2026), metapatterns.io, CC BY 4.0 — the transitions catalog Chapter 10's edge list is revoiced from, with attribution and gratitude.
- Juval Löwy, *Righting Software* (Addison-Wesley, 2019) — volatility-based decomposition, the nearest ancestor of change-driver reasoning.
- Gregor Hohpe, *The Software Architect Elevator* (O'Reilly, 2020) — the first-derivative framing of the architect's role.
- Sergiy Yevtushenko, *Process-First Design* (Leanpub) — the companion volume: the design methodology whose architecture-synthesis module this book supersedes and extends.
- SEI: Quality Attribute Workshop and ATAM method documentation (Software Engineering Institute, CMU) — the mechanized front and back doors of Chapter 1's middle room.

## Reliability lineage (Chapter 12)

- John Allspaw, "MTTR is more important than MTBF (for most types of F)" (2010), and his subsequent retraction of the mean as a metric.
- The VOID (Verica Open Incident Database) reports and Courtney Nash's analyses — the empirical case against central-tendency incident metrics.
- Štěpán Davidovič, *Incident Metrics in SRE* (O'Reilly, 2021) — the Monte Carlo confirmation.
- Google CRE, "Available... or not?" (Google Cloud blog) — error budgets as priced availability answers; MTBF/MTTR as derived planning levers.
- Werner Vogels' "everything fails all the time" operational stance; GameDay / resilience-engineering literature (Robbins, Krishnan, Allspaw; Hollnagel's four cornerstones) — the socio-technical boundary this book cites and does not annex.

## Evidence: Stack Overflow (Chapter 7)

- Nick Craver, "Stack Overflow: The Architecture — 2016 Edition"; "What it takes to run Stack Overflow" (2013); "Stack Overflow: How We Do Deployment — 2016 Edition" (nickcraver.com).
- High Scalability: "StackOverflow Update: 560M Pageviews a Month, 25 Servers" (2014); "StackExchange's Performance Dashboard".

## Evidence: Shopify (Chapter 7)

- Shopify Engineering: "E-Commerce at Scale: Inside Shopify's Tech Stack"; "A Pods Architecture to Allow Shopify to Scale"; "Surviving Flashes of High-Write Traffic Using Scriptable Load Balancers" (Parts I–II); "Deconstructing the Monolith"; "How Shopify Reduced Storefront Response Times"; BFCM 2021 engineering retrospective; "Capacity Planning at Scale".
- InfoQ: "Shopify's Architecture to Handle Flash Sales" (conference presentation).

## Evidence: Discord (Chapter 7)

- Discord Engineering: "How Discord Stores Billions of Messages" (2017); "How Discord Stores Trillions of Messages" (2023); "How Discord Scaled Elixir to 5,000,000 Concurrent Users"; "Why Discord is Switching from Go to Rust"; "How Discord Supercharges Network Disks for Extreme Low Latency".
- ScyllaDB tech talk: "How Discord Migrated Trillions of Messages from Cassandra to ScyllaDB".

## Evidence: Companies House (Chapter 7)

- Companies House annual reports and accounts (2023–24, 2024–25); the ECCTA 2023 outline transition plan (gov.uk); Companies Act 2006 (legislation.gov.uk), notably ss. 853A, 1084, 1096–1097 and Part 35; the Registrar (Annotation, Removal and Disclosure Restrictions) Regulations 2024.
- companieshouse GitHub organization — service documentation cited in grading; companieshouse.blog.gov.uk engineering posts (2019) — the projection pipeline and platform self-description.
- GOV.UK guidance: second filings (RP04), registrar's rules and powers, personal information on the public register.

## Replication artifacts (Chapter 7)

- github.com/siy/derivation-artifacts — the replication kit: registered predictions, answer sheets, quarantine rules, grading rubrics, the fourth run's derivation transcript and operator prompts verbatim, and the answer-sheet schema in summary form (the full specification tracks the engine work). The four pre-repository runs are attested (their registered-before-graded ordering is documented internally, not externally timestamped); every subsequent run is registered prospectively, by commit, before outcomes are checked. Counterexamples are invited there as issues: a filled sheet whose derivation diverges from a system you know.

## Evidence: Universal Credit (Chapter 11)

- National Audit Office: "Universal Credit: Early Progress" (2013, HC 621); "Rolling Out Universal Credit" (2018); "Progress in Implementing Universal Credit" (2024).
- "Universal Credit: welfare that works" (White Paper, Cm 7957, 2010) and its launch statements; Welfare Reform Act 2012 and Commencement Order No. 9 (the 29 April 2013 pathfinder).
- Computer Weekly's Universal Credit reporting (2013–2016) — contract structure, write-offs, the waterfall-contract testimony; Public Accounts Committee oral evidence (2013–2024).
- DWP Digital, "DWP's agile response to COVID-19: scaling Universal Credit to meet demand" (December 2020) — the surge record.
- "UC Project Zora — Application Decomposition & Microservices Transition" (PIN notice, April 2026); PublicTechnology coverage (June 2026).

## A note on one absent citation

Yannick Loth's self-published papers on the Independent Variation Principle and cohesion are engaged in the acknowledgments rather than cited as corroborating evidence: his theory is still under active development by his own account, and this book cites as evidence only what its evidence chapters can grade. The convergence on change-driver partitioning is acknowledged as convergence; readers interested in the relation can read both bodies of work and judge.
