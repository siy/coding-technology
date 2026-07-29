# Ch. 11 material — The Universal Credit case (worked brownfield derivation)

*Assembled 2026-07-11. Structure complete; facts marked [CORPUS] await verification/precision from `CH11-UC-CORPUS.md` (agent in flight); facts marked [RECONSTRUCTION] are labeled inference the chapter must present as such. The chapter's frame: run `next_step` at the 2013 reset point — the inheritor's chair — then grade the derivation against eleven years of NAO record. Sources index: BROWNFIELD-CANDIDATES.md entry 1; demand-side NAO/PAC material verified in the earlier hunts.*

## Why this case (the chapter's opening move)

Most worked examples in architecture books are systems the author built. This one is a system nobody reading the chapter built, documented for over a decade by an auditor with no stake in the narrative — four NAO reports (2013/2014/2018/2024), Public Accounts Committee evidence, and the rare thing: an *admitted* failure with its reset on the public record. Better still, the system has now been through **two full derivation cycles with a third running** (the 2013 reset → the 2013–2019 rebuild; Project Zora since June 2026) — so "architecture as a derivative" stops being a metaphor and becomes a timeline.

## 1 · The inheritance — V₀, named honestly

It is 2013. You inherit the Universal Credit "live service" (Pathfinder): built 2011–2013 under waterfall contracts by four SIs (£1.12bn let across HP, Accenture, Capgemini, IBM; ceilings IBM £525m, Accenture ~£500m, HP £100m; actual spend by March 2013: Accenture £125m, IBM £75m, HP £49m, BT £16m — NAO 2013). £638m had gone to UC IT by end-2012, £441m of it on design and development (Computer Weekly). The January 2013 Capgemini review and the April 2013 reset stocktake found "limited extensibility," **no detailed blueprint, no target architecture, no operating model** (NAO 2013); the Major Projects Authority's Norma Wood told the PAC that much of the IT was "not fit for purpose" and unlikely to be reusable; up to £130m of IT work was headed for the scrap heap, £34–40m formally written off. (The oft-repeated claim that a specific commercial case-management product sat at the core is UNVERIFIED at primary level — the chapter does not assert it; the finding record carries the argument without it.)

Run the four brownfield failure modes against it:

- **Boundaries that predate their reasons** — the system's seams are the *SI contract* seams: four vendors' delivery boundaries, not change-driver boundaries. Nobody derived them; procurement did. The record supplies the verbatim: a consultant on the project — **"We were effectively on a waterfall project, because it was a waterfall contract."** The contract shape WAS the architecture shape.
- **A model that was never a model** — "no blueprint or target architecture ever produced" is the NAO's own language: V₀'s positions answer to no recorded demands. In the method's terms: **every axis position is uncited** — the F10 detector fires on the whole vector at once.
- **Legacy persistence swallowed the domain** — the calculation rules (the volatile part — policy changes with politics) welded to the stored case-record shape (the stable part), which is what "limited extensibility" means operationally: a rule change becomes a schema-and-system change. The change-locality inversion, at nation scale. [RECONSTRUCTION — argued from the extensibility finding and the waterfall-contract structure, labeled as such; the product identity is unverified and unnecessary]
- **Microservices that deploy together** — n/a; V₀ fails differently (monolith with vendor seams). The chapter says so: failure modes are a checklist, not a prophecy.

**V₀ named honestly means: mostly underivable.** Not "bad" — *uncited*. The audit direction (ch. 9) makes this mechanical rather than rhetorical: ask each position for the answer that forces it; silence is the finding.

## 2 · The answers, as they stood in 2013 (hindsight-clean)

The discipline: only commitments on record *before or at* the reset. (Corpus: `CH11-UC-CORPUS.md` §1, each with URL + quote.)

- **Continuity (prune-grade):** existing claimants must be paid, every period, throughout any transformation. The one non-negotiable — and the record shows it surviving verbatim into all three cycles (Zora 2026: "maintaining continuity of service").
- **Parliamentary schedule:** national rollout from Oct 2013, completion 2017; politically committed. (Calendar answer — and a *requester's-clock* deadline in F22 terms: it binds the programme, becomes a path constraint, not a latency answer.)
- **Volume projection:** 7m+ households at full scale (business case, per NAO retrospective). Steady-state load, not launch load — a *projected* number, which the method treats as a demand with a date, not a day-one requirement.
- **Fraud/error reduction targets:** the White Paper's own numbers — "reduce administrative costs by more than half a billion pounds a year, and to reduce levels of fraud and error by £1 billion a year," against a £5.2bn/year baseline (Cm 7957 launch, Nov 2010). This is a *consistency/verification* demand on the calculation core (correct entitlement per rule version), not an infrastructure demand.
- **Policy volatility (the load-bearing answer):** six benefits merged, each with live amendment history; the Welfare Reform Act 2012 trailed a 2012–2015 regulations series before the first pathfinder claim was taken. The change driver on the calculation core is *permanent and external*. [Argued from the regulations record — no single frequency statistic exists; labeled]
- **Digital by default** mandate (White Paper) — with the demand's reality check already in the record: eight public computers at the first jobcentre, 130 more in Tameside libraries.
- **Security/identity** requirements ([corpus gap 4: NAO 2013 documents identity assurance as a live problem; exact wording pulled at prose time]).
- **Cost envelope:** ~£2.4bn programme budget (December 2012 business case, via NAO); bounded departmental ops capability (the SIs existed because DWP had not built in-house for 20 years).

## 3 · The audit — deriving the NAO's findings

Run the reverse derivation: what do the 2013 answers force, and what did V₀ hold?

- Continuity + policy volatility force **isolation between the paying path and the changing rules** — pay this period's claims while next period's rules change. V₀ welded them. *Uncontained.*
- Fraud/error targets force **entitlement computed per rule version, reconstructably** — a replay-shaped demand on one data class (the decision record). V₀'s case-record shape holds current state only. *Uncontained.* [RECONSTRUCTION at mechanism level]
- The volume projection, decomposed (F2-style), presses *nothing yet* in 2013 — the pathfinder was deliberately capped at ~1,500 straightforward single-claimant cases per month. It is a demand with a date. Building day-one for 7m+ households is the classic unforced position — and the record shows the SIs did exactly that (£638m by end-2012, £425m by mid-2013 with 70%+ on IT, for a caseload the pathfinder cap describes).
- **The audit's output reads like the NAO's findings because it is the NAO's findings, derived:** "limited extensibility" = the volatility driver uncontained; "no blueprint" = no position citations; the write-off = the price of unforced positions. The chapter's punchline: *the auditors ran the F10 detector by hand and called it a stocktake.*

## 4 · next_step at the reset — the renegotiation menu

The 2013 position is the method's **contradiction case** (ch. 8's machinery, live): parliamentary schedule × continuity × an unusable V₀ cannot all hold. The menu as history actually faced it:

1. **Patch forward** — keep building on V₀. Price: the volatility driver stays uncontained; debt compounds at £Xm/quarter. (The record shows this was the pre-reset default — and its price was the write-off.)
2. **Big-bang replace** — stop, rebuild, cut over. Price: an *infeasible intermediate state* — the moment of cutover risks payment continuity, the one prune-grade answer. The method rejects this on path constraints, not on taste; note this is exactly the failure mode that had just happened once.
3. **Twin-track** — keep the live service paying (continuity honored), build the digital service beside it at the narrowest scope, migrate by readiness. Price: **double-run cost, explicitly** — two systems, years of parallel operation. The boundary cost paid *in time* rather than risk.
4. **Renegotiate the schedule** — the menu's fourth entry is always the commitments themselves. The record shows this happened too: the 2017 target slid, repeatedly, in public.

History chose 3 + 4. The chapter's point is not that DWP ran our method — it is that **the feasible-path structure is derivable in advance**, and the two years and £34–40m spent discovering it were the price of not deriving it.

## 5 · The path — twin-track as pathfinding (ch. 10 machinery)

The executed delta sequence, each graded against the six indicators [CORPUS: dates]:

1. **Digital service pathfinder at one jobcentre** — Ashton-under-Lyne, 29 April 2013 (Commencement Order No. 9), capped ~1,500 claims/month, straightforward single claimants only; Wigan/Warrington/Oldham staged behind it (July). Narrowest-scope delta; fully reversible (close the pathfinder, live service still pays); the scope restriction was in the *demand* (eligibility rules), not just the deployment — IDS's own framing: "careful and controlled." Test-and-learn = *reversible deltas first* (F6's ordering, chosen by instinct here).
2. **Expansion by service maturity, not by calendar** — the rollout gates on the system demonstrating capacity, inverting the 2011–13 approach (calendar-driven build). Where the calendar reasserted itself (2018 NAO on rollout pace vs claimant hardship), the indicators name the violation: duration-in-dual-state costs were borne by claimants, not the programme. [CORPUS: 2018 findings]
3. **Live service closed to new claims (2018)** — the first hard-to-reverse delta, placed *late*, after the digital service carried the full intake load. Irreversibility ordering, textbook placement.
4. **Live service decommissioned (2019)** — cycle 1 closes: V₀ → reset → V₁, complete, graded.
5. **Managed migration of legacy claimants** — the statutory-calendar-constrained final delta, *still running* (NAO 2024: 1 in 5 invited tax-credit claimants did not move and had benefits stopped — the path's human cost recorded by the auditor; the chapter does not launder this).

**The grade on V₁:** the COVID-19 surge — 2m users to 5m active claims, 950k applications in a fortnight, 2.2m calls/day, release cadence 6 → 76 urgent changes in two months — absorbed without legislative-deadline changes (DWP Digital, Dec 2020). The rebuilt vector's load test, run by history. **Keep the two grades distinct:** the *architecture* absorbed COVID; the *business case's* fraud number did not land (later NAO: 9.4% of payments vs 6.4% forecast — worse than the 2010 target). A derivation answers for the vector, not for the policy.

## 6 · Coda — the derivative keeps deriving

April–June 2026: DWP opens **Project Zora** — the PIN notice is titled, verbatim, "UC Project Zora - Application Decomposition & Microservices Transition": a £40m programme against "the constraints of a long-standing monolithic application estate," to "progressively decompose elements of the Universal Credit application into more modular, loosely coupled components... while maintaining continuity of service." Cycle 3 begins while the chapter is in print — and the continuity answer survives verbatim into its founding document, sixteen years after the White Paper. (One neutral observation the record supports: Zora is itself a procurement seeking an external provider — the 2011 pattern, under a different contracting philosophy; the audit trail will say whether the seams follow change drivers this time.) The closing move: run the audit question once more — *which answers changed?* (post-COVID load shape; policy changes; the estate's own age) — and note that the method's output for a living system was never a destination. **The chapter closes on an open case, because every real system is one.**

## Assembly notes (not for prose)

- Overlap discipline (decision C): payroll (PFD Brownfield) carries the *mechanics teaching*; UC carries the *scale + external-audit evidence*. Cross-reference, don't re-teach.
- IRS IMF/CADE2 gets one contrast paragraph in §4: the patch-forward branch taken for decades — the menu entry UC declined, priced by a different government's record. (BROWNFIELD-CANDIDATES.md entry 2.)
- UK-public-sector concentration across the book's evidence: name it once, honestly — the NAO/PAC documentation regime is *why* these systems are gradeable at all (same structural note as the blind-candidates finding).
- Every [RECONSTRUCTION] survives into prose only with its label; that honesty is load-bearing for the chapter's authority (same posture as the blind-derivation misses).
