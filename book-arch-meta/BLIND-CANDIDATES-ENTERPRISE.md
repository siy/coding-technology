# Blind Derivation Candidates — Boring Enterprise

Three UK government-adjacent systems. All share a structural advantage for separability: independent bodies (Treasury, Parliament, National Audit Office equivalents) publish scale/deadline/compliance material with zero technical content, while the operating agency's own engineering blog publishes technical material with zero budget/deadline content — different authors, different venues, rarely cross-referenced.

Per the blinding protocol: outcome sources below are URL + neutral label + a yes/no attestation only. No content summaries.

## 1. Companies House — UK Dept for Business & Trade, 2017–2025

**Business profile:** UK's statutory company registrar (~5m companies). The Economic Crime and Corporate Transparency Act 2023 (Royal Assent 26 Oct 2023) gave the registrar new query/rejection powers and mandated phased identity-verification rollout from March 2024, with a departmental impact evaluation due by 2028. The public register is queried at very high and steadily growing volume. A separate, unplanned cloud re-migration was forced by EU-exit data-residency requirements.

**Answer-sheet sources:**
- gov.uk, "Economic Crime and Corporate Transparency Act: outline transition plan for Companies House" — Royal Assent date, phased reform timetable, new registrar powers. Quote: "received Royal Assent on 26 October 2023."
- gov.uk, Companies House Annual Report and Accounts 2024-25 — statutory budget/performance figures (cited for scope; exact figures not independently quote-verified in this pass, flag for follow-up).

**Outcome sources:**
- companieshouse.blog.gov.uk, Oct 2019 post, ~1000 words, on a public API service — read-path question settled: NO.
- companieshouse.blog.gov.uk, Jul 2019 post, ~900 words, on infrastructure operations — read-path question settled: NO.
- companieshouse.blog.gov.uk, Mar 2019 post, ~1200 words, by the then Director of Digital — read-path question settled: NO (contains a suggestive but non-dispositive lead).

**Separability: WORKABLE.** Demand-side and outcome-side sources are cleanly published in different venues, but the outcome-side blog posts embed some usage/growth figures alongside infrastructure narrative — a reader building the demand profile needs to consciously avoid those posts rather than being unable to find them there.

**Discrimination (read/write axis): WEAK.** No source states the read-serving design for the core register. One post contains a phrase that a sharp reader could treat as a lead, but it stops short of settling the question.

## 2. HM Land Registry — UK Government executive agency/trading fund, 2013–2025

**Business profile:** Local Land Charges Programme, statutory basis Infrastructure Act 2015, Treasury approval Jan 2018, live since Jul 2018, mandated migration of all 331 English local authorities by 2028; ~26m local land charges records. Business Strategy 2017–2022 set a 95%-automation target. FY2024-25 accounts show a missed backlog KPI (636,000 vs 572,000 target), 815,000 requisitions (19% of applications), ~6,900 staff, £399.2m revenue.

**Answer-sheet sources:**
- gov.uk, Accounting Officer Assessment: Local Land Charges Programme — approval dates, budget, fee structure. Quote: "received approval to implement its initial phase from the Chief Secretary of the Treasury on 26 January 2018."
- gov.uk, HM Land Registry Annual Report and Accounts 2024-25, Performance Report — KPI/staffing/revenue figures. Quote: "we had to respond to more than 815,000 (19%) with requests for further information."
- gov.uk, HM Land Registry Business Strategy 2017–2022 — automation target. Quote: "We aim to digitise and automate 95% of our daily transactions by 2022."

**Outcome sources:**
- scottlogic.com, delivery-partner case study — read-path question settled: NO.
- hmlandregistry.blog.gov.uk, Sep 2025 modernization post — read-path question settled: NO.
- landregistry.github.io, public developer API reference documentation — read-path question settled: NO (implies service separation, doesn't state design intent).
- github.com, archived README of a decommissioned predecessor system — read-path question settled: NO for the current production system (this source describes a superseded system, not the live one).

**Separability: CLEAN.** No demand/deadline/budget content found in any technical source reviewed, and no architecture content found in any Treasury/accounts-report source reviewed.

**Discrimination (read/write axis): WEAK.** No public source found states the read-serving design of the live production system. One lead exists but applies only to a decommissioned predecessor, not the current system.

## 3. DWP Universal Credit — UK Department for Work and Pensions, 2011–2020

**Business profile:** Consolidates six legacy means-tested benefits into one. National Audit Office, "Universal Credit: Early Progress" (2013): £425m spent, over 70% on IT, £34m of systems written off, original Oct 2013 national rollout abandoned. NAO's 2018 follow-up: £1.3bn invested, £600m running costs, 815,000 claimants against an original forecast exceeding 7m households. Public Accounts Committee hearings (2016, 2018, 2024) track repeated timetable slippage (2017 target pushed past 2023) under sustained parliamentary scrutiny. Separately, the live service absorbed a roughly fivefold demand surge during the 2020 COVID-19 pandemic (950,000 applications in one fortnight) without any change to legislative deadlines.

**Answer-sheet sources:**
- nao.org.uk, "Universal Credit: Early Progress" (2013), HC 621. Quote: "over 70 per cent of the £425 million spent to date" was on IT systems.
- nao.org.uk, "Rolling Out Universal Credit" (2018) — investment/claimant-volume figures.
- committees.parliament.uk, PAC oral evidence (9 Jul 2018) — legacy-benefit consolidation, timetable slippage.

**Outcome sources:**
- dwpdigital.blog.gov.uk, Dec 2020 post, ~1800 words, by two named DWP Digital engineering leads — read-path question settled: NO.
- Vendor customer case study featuring direct quotes from the same two engineering leads — read-path question settled: NO.
- Independent trade-press article corroborating the above — read-path question settled: NO.

**Separability: WORKABLE.** Claimant-scale figures (millions of households/claims) appear on both sides as different kinds of numbers (audit totals vs. live-traffic figures) — no direct leakage, but a sharp reader could triangulate rough scale across the two sets.

**Discrimination (read/write axis): WEAK.** Three independent, detailed technical sources are uniformly silent on how reads are served; public record does not settle the read-path question.

## Ranked recommendation

1. **Companies House** — best available (non-dispositive) lead on the read-path question among the three; worth a supplementary source-hunt (conference talk) before committing.
2. **HM Land Registry** — cleanest separability of the three, but no lead at all on read-path for the live system.
3. **DWP Universal Credit** — richest and most independently corroborated outcome documentation, but most thoroughly confirmed as silent on read-path, and separability is only WORKABLE, not CLEAN.

None of the three has documentation that currently *settles* the read/write-model axis outright — all three grade WEAK on discrimination. If a settled answer is a hard requirement rather than a nice-to-have, none should be used as-is without further source-hunting.

---

## Orchestrator addendum (2026-07-11, post-delivery)

1. **Contamination record:** outcome details for DWP UC, Companies House, and HMRC MTD (a 4th candidate the hunter dropped; full research later arrived directly) leaked into the orchestrating session via sub-agent completion reports. The orchestrating session is contaminated as a deriver for ALL candidates. Consequence already adopted: the **isolated-operator protocol** — separate fresh agents for answer-sheet assembly (demand-side sources only), derivation (answer sheet + method docs only), and grading (derivation + outcome sources); the orchestrator writes content-free prompts and audits only after the derivation is registered.
2. **Companies House discrimination is under-graded above.** The hunter's own sub-agent found first-party evidence (official org repositories) that settles the read-path question decisively; it is not listed in this file because the evidence cannot be named blinding-safely (identifiers reveal the answer). Grader-side, CH's read-path prediction IS gradeable — treat CH discrimination as STRONG for grading purposes. The blog-post-only outcome list above stands for what it is.
3. **The 4-of-4 WEAK-in-prose finding is itself a result:** boring-enterprise systems, as a class, do not narrate their read-serving design in prose — the axis the blind derivations never moved is also the axis enterprises never write about. Candidate reading (a): the read path is usually the default, and defaults go undocumented — silence weakly corroborates the null value. Reading (b): prose-based grading can't reach this axis on this system class; repository-level evidence (as in CH's case) is the grading instrument that can. Book-relevant either way (ch. 7 cross-findings; the fold-into-storage watch item).
