# Brownfield Long-Case Candidates

**Task:** 3 candidate source systems for ONE long worked brownfield case study (ch. 11). Not blind derivation — full documentation of V₀ and constraints wanted. Ranked below.

---

## 1. UK Universal Credit — DWP/GDS (2011–2026) — **BOOK-DEPTH**

**System + era.** DWP's welfare-benefits calculation and payment platform. Built 2011–2013 by large SIs (contract ceilings: IBM £525m, Accenture ~£500m, HP £100m; actual spend by March 2013 per NAO: Accenture £125m, IBM £75m, HP £49m, BT £16m) under a £1.12bn program; catastrophically reset in 2013; rebuilt in-house under GDS influence 2013–2018 as a parallel "digital service"; legacy "live service" decommissioned 2019. A second reform, Project Zora, is live as of June 2026.

**V₀.** The original "live service" (codename Pathfinder) was a waterfall-contracted, SI-built case-management system (IBM Cúram widely reported as the underlying product, not fully confirmed here). A Jan. 2013 Capgemini review and an April 2013 reset stocktake found the architecture "of limited extensibility," with no detailed blueprint or target operating model ever produced.

**Constraints.** Couldn't stop paying existing claimants; a Parliament-mandated rollout schedule; £34–40m written off at the 2013 reset, £91m more over five years; a deliberate shift from large-SI to small in-house ownership; later, a legally gated "managed migration" mechanism with statutory deadlines — a calendar wall structurally close to the book's own payroll year-end-close wall.

**Transformation arc.** Pathfinder build (2011–13) → public reset, admitted near-write-off (2013) → twin-track: live service kept running while GDS/DWP built the digital service in-house, test-and-learn (2013–16) → national "full service" rollout (2016–18) → live service closed to new claims (2018), decommissioned (2019) → managed migration of remaining legacy claimants, still running per the Feb. 2024 NAO report (1 in 5 invited Tax Credit claimants didn't move and had benefits stopped).

**A second cycle, live now.** The rebuilt "full service" is documented at real architecture depth: Java microservices, 8 MongoDB clusters (5 nodes × 3 AWS AZs, ~110 TB/cluster, ~15k req/s peak), Kafka, Terraform — moved off a government datacentre onto AWS in 2017, stress-tested under the 2020 COVID surge (76 urgent stack-wide changes in two months vs. 6 before). **As of June 2026, "Project Zora" (£40m+) is reforming this same service again**, explicitly framed against "the constraints of a long-standing monolithic application estate." The 2017 answer is 2026's inherited mess — a second audit-and-delta cycle on the same system, 12 years after the first.

**Sources.** [NAO 2013 reset report](https://www.nao.org.uk/reports/universal-credit-early-progress-2/) · [NAO 2014 progress update](https://www.nao.org.uk/reports/universal-credit-progress-update-2/) · [NAO 2018 rollout history](https://www.nao.org.uk/wp-content/uploads/2018/06/Rolling-out-Universal-Credit.pdf) · [NAO 2024 long-tail migration](https://www.nao.org.uk/wp-content/uploads/2024/02/progress-in-implementing-universal-credit-report.pdf) — all BOOK-DEPTH. [Computer Weekly's multi-year UC series](https://www.computerweekly.com/news/2240187478/Why-agile-development-failed-for-Universal-Credit) — deep supplement. [DWP Digital's own rebuild account](https://dwpdigital.blog.gov.uk/2017/09/11/building-the-universal-credit-full-service/). [Diginomica's stack writeup](https://diginomica.com/how-dwp-managed-surge-demand-universal-credit-during-covid-19) — the one genuinely architecture-level technical source. [Project Zora coverage](https://www.publictechnology.net/2026/06/04/society-and-welfare/project-zora-dwp-seeks-market-input-on-40m-plan-to-reform-universal-credit-digital-services/) — the live second cycle.

**Fit note.** Strong on **boundaries that predate their reasons** (Pathfinder followed vendor/contract lines, not domain lines; Zora's framing suggests the 2017 rebuild's own boundaries have since drifted from the domain) and on audit discipline (Capgemini's stocktake is a real bounded, trigger-driven audit). The 2013 reset is a rare *publicly admitted* rewrite-reflex failure. Weakest on **legacy persistence swallowed the domain** and **the model that was never a model** at V₀ — no public Pathfinder-era code, so those two modes need light fictionalization over a real, well-sourced V₀ and constraint set. Diginomica and Zora partly offset this by documenting the *rebuilt* system's architecture in real detail and supplying a second live trigger.

---

## 2. IRS Individual Master File / CADE2 — US Treasury/IRS (1960s–present) — **BOOK-DEPTH, with a caveat**

**System + era.** The IMF, IRS's core taxpayer record, written in assembly/COBOL, built with IBM in the 1960s, still central to processing today. Modernization (CADE → CADE2 → "IMF Modernization") has run continuously since 2009; ~$2B spent through Sept. 2024, budgeted through FY2028.

**V₀ and constraints.** A batch-oriented, decades-accreted master file where each tax-law change patched directly into processing code alongside logic that must be preserved for historical returns — GAO calls it one of the oldest operational systems in government, held together by a shrinking pool of assembly/COBOL specialists. A hard annual filing-season deadline every year (a direct analog to the book's payroll "immovable wall"); a 1976 congressional block on hardware refresh still cited as a lingering constraint; repeated staff pulled off modernization onto crisis work (e.g., 2021 CARES Act processing sent wrong figures to 109,000+ people via a resurfaced 2007 code path).

**Transformation arc.** Tax Systems Modernization (1990s, cancelled) → Business Systems Modernization (troubled) → CADE (partial, effectively cancelled) → CADE2 (2009–, milestone slipped 9 years, revised 7 times 2016–19, suspended 2022, paused again 2025) → consolidated "IMF Modernization," ~90%+ of core return-processing code converted to Java by 2022.

**Sources.** [GAO-22-104387](https://www.gao.gov/products/gao-22-104387) (schedule slip) and [GAO-25-107611](https://www.gao.gov/assets/gao-25-107611.pdf) (consolidation, 2025 pause) — both BOOK-DEPTH but programme/cost audits, not architecture documents. [Atomic Object's software-audience retrospective](https://spin.atomicobject.com/modernize-individual-master-file/) is the one source that reads as engineering advice, not accounting.

**Depth caveat.** No public source code or call-graph-level description exists — the chapter's reverse-application exercise can't literally be performed here, only the *outcomes* of decades of audits.

**Fit note.** Best-in-class for **legacy persistence that swallowed the domain** (tax logic literally is the file format) and for the rewrite-reflex failure mode at federal scale, repeatedly. Strongest real-world echo of the book's own calendar-wall constraint.

---

## 3. DBS Bank technology transformation — Singapore (2009–2018) — **SUPPLEMENT-ONLY**

Decade-long move off a fully outsourced mainframe core toward Infosys Finacle and an internal API platform. V₀ (2009: outsourced mainframe, no in-house ownership) and constraints (multi-market regulation, 24/7 uptime) are named but never detailed to NAO/GAO specificity. Sources ([McKinsey interview](https://www.mckinsey.com/industries/financial-services/our-insights/transforming-a-bank-by-becoming-digital-to-the-core), DBS newsroom, vendor PDFs/talks) are uniformly leadership-narrative or vendor-sponsored — no admitted missteps, no domain/service-boundary detail. Texture only (the decommission/invest/retain triage echoes bounded-trigger audit discipline); not sufficient alone.

---

## Ranked pick

**#1 Universal Credit, #2 IRS IMF/CADE2, #3 DBS** (drop or one-line quote only).

**Universal Credit wins**: the richest public paper trail (four NAO reports, 2013–2024), a publicly admitted rewrite-reflex failure at the 2013 reset, a genuine calendar-wall constraint, a welfare/HR domain close enough to the book's own payroll platform to read as a legible parallel rather than a repeat, and a second audit-bounded derivation cycle (Project Zora) running on the same system right now — letting the chapter close on an open case instead of a settled one.
