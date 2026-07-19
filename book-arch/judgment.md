# The Judgment That Stays Human

A book that spends twelve chapters mechanizing decisions owes its last argumentative chapter to the decisions it cannot mechanize — stated precisely, because the credibility of every "derived, not chosen" so far depends on this boundary being real rather than rhetorical. The claim was never that judgment shrinks. The claim is that judgment *relocates*: stripped from the steps that never deserved it, where it was taste with tenure, and concentrated where it is genuinely owed. This chapter is the inventory of where it is owed.

## The judgment inventory

Each entry has the same shape: what the mechanics produce, and what a human decides with it.

**The answers themselves.** The sheet elicits and prices; the business sets every number. The derivation owns *consequences*, never targets — and the pricing discipline cuts both ways: pricing is the method's job, and wanting the expensive thing anyway, eyes open, is legitimately the business's. A priced wish that survives pricing is called a commitment, and the method salutes it.

**Recovery ties.** Where the domain offers both a defined inverse and tolerable degradation, the ledger prices both and stops. Restored consistency versus continued liveness is a business preference wearing a technical costume — money usually compensates, availability usually degrades forward, and the choice between those characters belongs to whoever owns the outcome. Corollary from the field: when the inverse must be *designed* (an off-cycle correction, a clawback process), compensation is a use case of its own, with its own targets, and deciding it is worth building is a product decision the method can only price.

**The renegotiation menu.** A contradiction's menu is derived and priced; choosing which commitment bends is the business call *by definition* — the commitments were theirs. Chapter 8's global order book ended with four branches; no procedure picks among them, and one that claimed to would be lying about whose money it is.

**The conscious second driver.** The method's boundaries fall where pressures diverge, and occasionally a team decides — knowingly — to let one component serve two drivers: a boundary blurred on purpose, for reasons the matrix can record and cannot weigh. Permitted, priced, and *named*: the sin was never the decision; it was the unconsciousness.

**Enterprise-altitude inputs.** Vision, strategy, and organizational bets enter the sheet as answers — release structure, cost envelopes, multi-X — and the book takes them as inputs honestly rather than pretending to model where they come from. The derivation starts where the business's self-knowledge ends its first draft.

The stance sentence for the whole inventory: **the derivation does not shrink judgment; it removes judgment's counterfeit.** What was defended by seniority now needs no defense, and what genuinely needs deciding now arrives at the decider priced.

## The MTTR/MTBF dissolution: a worked example of the boundary

One live industry argument makes the inventory concrete, because this book's instruments dissolve most of it and hand back the remainder — visibly split.

The trend is familiar from every reliability deck of the last decade: *failure is inevitable; stop maximizing time-between-failures and start minimizing time-to-recovery.* The stance descends from the everything-fails school of operations and John Allspaw's influential 2010 essay, whose title contained a scope qualifier, "for most types of failures," that the ensuing decade dropped in transit. The essay's own author named the exception class: failures that must never happen, accidental data loss the canonical case. The slogan erased its own boundary; the recovery axis restores it, *per failure class*: degrade-and-continue is the recover-fast stance formalized; compensate is the there-is-an-inverse stance priced; and **design-out transcends the dichotomy entirely — the failure class stops existing, and both metrics go undefined on it.** Repair-versus-prevent was never one question; it was one question per failure class, and the classes have a derivation.

The metrics half of the trend died separately, and the record deserves its citations: the essay's author retracted the *mean* himself — incidents are not comparable, start and stop times are negotiated attributions; the VOID (Verica Open Incident Database) project confirmed it empirically at corpus scale (duration distributions are heavily skewed; central-tendency measures misrepresent them; duration correlates poorly with severity); and independent statistical work reached the same verdict by Monte Carlo: you cannot reliably demonstrate improvement through a mean of incident durations. This book files the lesson with Chapter 5's: **means lie about incident durations for the same reason they lie about latency — scalars hide scope and shape.** One discipline, both chapters.

What remains standing after the dissolution is instructive, because each piece lands on one side of this chapter's boundary. *Mechanized:* per-operation failure budgets — the error-budget arithmetic that Google's reliability literature states as "target a given availability figure, rather than particular MTBF or MTTR figures," which is Chapter 2's failure budget in an operator's voice, with the two old metrics demoted to derived planning levers underneath a priced target. *Mechanized:* verification by injection — game days and fault drills as the recovery axis's test suite, per Chapter 5. *Human:* which failure classes get which recovery class at what price: the inventory's second entry, arrived at from the field.

## The scope boundary

The last honesty is about the book itself, and it has four walls.

**Enterprise backend.** The hard-real-time tripwire fired at elicitation, in Chapter 2, and this is the chapter that owns the why: a deadline whose breach is a *correctness* failure — the brakes, the pacemaker, the trading circuit-breaker — belongs to a different physics regime with a different literature and a harder bar. Percentile budgets and containment arithmetic are the wrong instruments there, and a method that will not name its regime is selling something.

**The socio-technical half.** Resilience engineering, the study of how *organizations* anticipate, monitor, respond, and learn, owns the human side of every incident this book's structures merely survive. The recovery axis is the meeting point: this book derives what the *system's structure* offers a failure; the organization's capacity to use that offer is a discipline with its own giants, cited here and not annexed. One import does cross the border with full honors, because it is measurement rather than sociology: availability accounting must match user-visible operations — a fleet at 99.99% behind a broken login is a broken product, whatever the dashboard says. The consistency lens, pointed at metrics.

**What the method optimizes for is not what every organization wants.** A derivation produces the forced minimum, and Chapter 7's fourth run showed a real organization living deliberately above it. Some of that gap is unpriced option value, some is hiring-market signaling, some is fashion — and sorting a given case into those bins is *owner's judgment about the owner's money*, which the audit can inform and must not usurp.

**Acting on the vector.** The derivation produces the next correct step; whether an organization can take it is answered by its contracts and its politics, not by its answer sheet. Universal Credit's correct 2013 vector — isolate the paying path from the changing rules — was derivable on the day; acting on it meant redrawing seams that four signed contracts had already fixed, an authority no architecture document confers. The method delivers the diagnosis at the moment it is cheapest to have; the authority to spend it belongs to whoever owns the contracts. A method that promised otherwise would be claiming to derive its way out of a negotiation.

The boundaries drawn, one chapter remains: what to do with all of this on Monday, and what this book asks of its readers in return.

*Rules exercised: the judgment inventory · per-class dissolution of a one-bit trend · budgets over means, twice · verification by injection · the four walls of scope.*
