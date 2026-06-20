# Reviewer Feedback — collection log (author reference — not shipped)

Living log of pre-publication reviewer feedback and the book changes derived from it.
Items are **pending** until implemented; nothing here is applied to the manuscript yet
(holding for more feedback before a consolidated pass). Tags: `[PFD]`, `[JBCT]`, `[build]`.

Reviewer roles (panel balance):
- **Poltorak** — adversarial / orthodoxy stress-test (asserts & defensive-programming background)
- **Fritzsche** — RPU characterization, practitioner read
- **Loth** — cohesion + IVP integration; reviewer only, not foreword (author + cofounder decision 2026-06-18)
- **Hetland** — outside-observer / potential-user read (not cited in book); **outreach-sent 2026-06-18** (book attached); also leading foreword candidate, gate on his read
- **Wlaschin** — cited (*Domain Modeling Made Functional*; "make illegal states unrepresentable"); **outreach-sent 2026-06-18**, citation-verify + blurb/resonance

**Foreword:** Loth ruled out; candidate = Hetland (gate on his actual read), Fritzsche backup, or ship without. Poltorak → blurb, not foreword.

---

## DECIDED — book changes distilled from the Poltorak thread

Editorial call on what to *borrow* into the manuscript vs. leave as chat. Unifying finding:
**the books are sharp on the value/compute side and under-specified on the stateful edge**
(persistence, concurrency, distributed consistency) — Poltorak hit that one gap from three angles.
Big move = one new JBCT treatment of the edge; the rest are refinements.

**P1 — core**
1. **New JBCT section — "Integrity at the Stateful Edge"** (working title). Frame: *what DDD bundles
   into the aggregate root, JBCT unbundles into mechanisms used only when needed.* Organizing idea =
   the functional-core ↔ stateful-edge boundary.
   - **Write gate** = per-aggregate persistence fn taking the *whole validated value* (the functional
     aggregate root). Make it **structural, not disciplinary**: slice owns its aggregate's tables;
     only that fn may write them. (DDD = object encapsulation; JBCT = slice data ownership; same
     principle as `inexpressible-constraints` — invalid writes inexpressible.)
   - **Transaction boundary = the use case** (atomicity / 3-wheels-mid-swap is the transaction's job,
     not the value's; `transactional()` rollback).
2. **Invariant evolution — new-type-on-widening** (refine Value Object chapter). A relaxation that can
   break existing consumers = a **new (sum) type**, not an in-place edit → compiler lights up every
   call site (silent late crash → loud compile error). **Zero-price** worked example. Frame:
   structural vs discipline safety.
3. **PDV two layers** (refine PDV section): *well-formedness* (value → type) vs *usage precondition*
   (consumer → narrower type) = "parse, don't validate" at input + **"narrow, don't validate"** at
   the consumer boundary. **Soften overclaim** "exists ⇒ valid ⇒ no downstream checks" → "no *ad hoc*
   checks; narrow when you need a stronger guarantee."

**P2 — strong, scoped**
4. **Technical-vs-business error channel** (error chapter; likely partly present — make explicit):
   typed-error enum = *business* interface; technical/infra failures ride the same failure channel
   (any `Cause`) but aren't in the enum; mapped to 5xx at the trigger; no catch-all. (Author's
   strongest live answer; non-obvious to sharp readers.)
5. **Long-running processes & contended resources** (subsection of #1) — **design altitude, NOT a
   distributed-systems textbook** (judgment call below). Concurrency control (compare-and-set /
   optimistic lock; structural option = single-writer per resource via stream/partition); **saga = a
   process with a typed compensation branch**; reservation **state machine** (payment-pending not
   idle-timed-out); idempotent external boundaries. Seat-booking worked example. Load-bearing claim:
   **this is where process-first earns its keep — the saga *is* the process; the entity doesn't help
   across time.**
6. **DDD positioning** (methodology framing): keep DDD's invariant-enforcement principle (Value
   Objects/aggregates are from DDD); change the **default** (compose-by-default, aggregate-only-when-
   needed) and **mechanism** (immutable values + processes + typed errors). **Must obey the
   "no competitor teardown" convention** — honest contrast, principle credited, no DDD-bashing.
   Anchor on Poltorak's conceded agreement: "no invariant / transaction → no Entity."

**P3 — small**
7. **Asserts sidebar** (near PDV): runtime shadow of typed preconditions — fallback for invariants
   not encoded as types; typed version dominates (checked once, can't drift). Preempts the
   defensive-programming objection.
8. **PFD design-level note** (language-neutral; Poltorak reads PFD): the *process* is the natural home
   for cross-time, externally-effecting consistency (sagas); entity-first leaves it homeless.
   On-thesis for "the unit of design is the process." Small — pairs with the gate-vs-knowledge para.

**Judgment calls to confirm:**
- **#5 scope** — illustrate at design altitude with the seat example; do not grow a DS chapter. *(rec: yes)*
- **#6 tone** — honest contrast only, no teardown (book convention). *(rec: yes)*
- **Home** — one new JBCT section absorbs #1/#4/#5/#6; #2/#3/#7 refine existing PDV/VO chapters; #8 a
  small PFD note. *(rec: this structure)*

**Not borrowed (chat-only):** blow-by-blow rebuttals, the "whose seat = B" Q&A, the live-close
scripts. Production notes (watermark/font/English edit) stay under Poltorak's `[build]` items below.

---

## Denys Poltorak — reading PFD draft (at p.13 as of 2026-06-17)

### Production / readability `[build]`
| Item | Action | Status |
|------|--------|--------|
| Dense, not a one-evening read, makes you think | (positive — no action) | — |
| "DRAFT" watermark distracts | make ~2× lighter (halve opacity) | pending |
| English mostly OK; some passages hard to parse | native-speaker copy edit; **budget ~1 month** before pub | pending |
| Code font too small (needed Fit-Page zoom; prose fine, code needs squinting) | increase code-listing font / shorten line length in `build-pdf.sh` | pending |

### Concrete text fixes (verified against source 2026-06-17, ready to apply, NOT yet applied)

**Abbreviations unexpanded at first use** (Poltorak: "SLO in particular"):
- **SLO** — true first use is `spiral-1-use-case.md:450` ("the SLO triple per use case"), bare. Only
  expansion is `architecture-synthesis.md:39` ("service-level objectives (SLOs)"), 4 chapters later.
  **Fix at :450** — "is the SLO triple" → "is the **service-level objective (SLO)** triple". Heading
  at :448 ("Per-use-case SLOs") stays; body expands. *NOTE: handover's "SLO spelled out at first use
  (§43)" was wrong — §43 is a later occurrence, not the first.*
- **SLA** — `spiral-2-workflow.md:365`, single bare use. **Fix** — "the payment provider's SLA" →
  "the payment provider's **service-level agreement, or SLA**".
- Verified FINE (no fix): BER/FER (`foundations.md:124-125`, Backward/Forward Error Recovery),
  IVP (`foundations.md:112`). P95/P99 standard notation — optional first-use gloss.

**Page-29 code wrap** (`spiral-1-use-case.md:300-305`, Fork-Join block): lines 302-303 run ~98 / ~115
chars → wrap mid-token in the PDF. **Fix = reflow to <60-char lines (whitespace only, no semantics):**
```
return Promise.all(
        checkEventSelling.apply(validRequest.event()),
        checkCustomerEligibility.apply(
                validRequest.customer(),
                validRequest.event()))
    .map((selling, eligibility) ->
            ReservationContext.reservationContext(
                    validRequest, selling, eligibility))
    .flatMap(reserveSeat::apply);
```
Related (optional, NOT the reported complaint): the two-arg `checkCustomerEligibility.apply(customer,
event)` sits under prose claiming "single-method, single-arg" — passing `validRequest` instead fixes
both the wrap and that consistency nit, but it's a content change (hold unless author wants it). Prose
also says `all()` "joins them into a tuple" while `.map` destructures two params — reword if desired.

**Verify:** requires PDF rebuild (`book-pfd-meta/build-pdf.sh`, interactive — feed `< /dev/null`).

### Methodology debate — "parse, don't validate confuses type with invariant" `[JBCT]` (touches PFD gate-vs-knowledge)

**His core objection (the strong one):** relaxing/widening an invariant is a *silent semantic
breaking change*. Consumer that relied on the old invariant breaks far away and late — e.g.
`Price` widened to allow 0 for a promo; neighbouring analytics divides by `price`, its tests still
pass (they use 0.01), and it crashes monthly in production, nowhere near the change.

**Agreed resolution (direction):** the consumer *analyses its input and repackages / wraps it into
a new type* at its boundary. This makes "check invariants at entry" (his prescription) and
"parse, don't validate" (the book) **the same act** — narrow into a type rather than assert inline.

**Derived book actions (pending):**
1. New section built on his **zero-price example** — concrete teaching case.
2. Name the **two layers of invariant**: *well-formedness* (UTF-8, length, `>0`) belongs to the
   value → type/constructor; *usage preconditions* ("≠0 to divide", "≥2 words to split") belong to
   the consumer → a **narrower type at its boundary** (`PositivePrice`, `StructuredName`).
3. State the rule that actually defeats his scenario: **a relaxation that can break existing
   consumers is a NEW type, not an in-place edit.** New type → compiler lights up every affected
   call site (silent monthly crash → loud compile error at change time). Frame as **structural
   safety vs. discipline safety** — don't rely on everyone remembering to narrow; make forgetting
   inexpressible. (Connects to memory `inexpressible-constraints`.)
4. Soften the overclaim: "if the instance exists it's valid → **no downstream checks**" →
   "no *ad hoc* checks — **narrow to a stronger type** when you need a stronger guarantee."
5. Position **asserts** honestly: the runtime shadow of the same discipline (a fallback for
   invariants you *didn't* encode as types), not a rejected enemy. Typed version dominates because
   checked once at compile time and can't drift.
6. Make the **technical-vs-business error channel** explicit (his "DB down → what does the booking
   user get?" / "Internal Server Error not in the typed-error enum"): the typed-error enum is the
   **business interface**; technical failures ride the same `Promise` failure channel (any `Cause`)
   but are not in the business enum, and are mapped to 5xx at the trigger. No catch-all. *(This was
   the author's strongest live answer — surface it in the book.)*

**One-line thesis for the section:** *PDV doesn't make invariant-evolution free — it makes it
visible, provided you evolve by adding types rather than mutating them.*

**Open:** the un-narrowed-consumer case is only closed by action #3; narrowing-at-entry alone
(the live-chat close) answers "how should the consumer guard," not "what catches the one who
didn't." Section needs both halves.

### Round 2 (2026-06-17 cont.) — from PDV to the write-side integrity story

The author's sum-type answer (RegularPrice / PromotionalPrice, compilation fails for every module
that uses `Price`) **confirms action #3** — new-type-on-widening, structural not disciplinary.

Poltorak then escalated from value semantics to architecture. **Meta-pattern: every one of his hits
lands on the functional-core ↔ stateful-edge boundary** (invariant evolution, write enforcement,
atomicity, shared persistence). The methodology has the mechanisms; the **book leaves the integrity
story implicit** — that's the real, recurring gap.

**Convergence to use:** at 6:07 Poltorak stated *"no invariant (or transaction maintaining it) → no
Entity."* That **is** the JBCT position ("entities form only when needed"). Reframes the debate from
"DDD vs JBCT" to "agree on *when*; differ on default + mechanism."

**His strong points + answers:**
1. **Write gate** ("PDV checks input, not what you write to the DB; the Entity is the single write
   gate — 4 wheels"). Correct: PDV validates *values*; a **per-aggregate persistence function taking
   the validated whole value** validates *writes* (the functional aggregate root). **Gap:** Aether is
   SQL-first (`@Sql`/`@PgSql`/jOOQ) → a slice can ad-hoc partial-write and bypass the gate, so the
   gate is currently **discipline, not structure.** Fix on our own terms (per `inexpressible-constraints`):
   make it structural — **slice owns its aggregate's tables; only its validated-value persistence fn
   may write them.** DDD = structural via object encapsulation; JBCT = structural via slice data
   ownership. Same principle (invalid writes inexpressible), different mechanism.
2. **Atomicity** (crash mid-wheel-swap → 3-wheel car persisted). This is a **transaction** question,
   not an entity question. use-case = transaction boundary; connectors' `transactional()` rollback →
   partial state never persists. Separate his two invariants: "always 4 wheels" = validated value at
   write gate; "never stuck at 3" = atomicity from the transaction. DDD bundles both; **JBCT unbundles**
   (pay for each only when needed) — that's the difference and the advantage.

**Coupling charge (split):**
- Shared *value type* → his "implicit" is wrong: sum-type change won't compile = loudest coupling, to
  a *published contract* (ubiquitous language). Only minimal well-formedness shared, not refinements.
- Shared *schema/DB* → fair hit. Answer: slices own tables + exchange via events/pub-sub, or shared
  schema = versioned contract with the `pg-tools` jOOQ-XML **drift check** (already exists).

**Overclaim to tighten:** 5:57 "a change to one use case can't corrupt others' data" holds **only if
the write gate holds**; with ad-hoc SQL it doesn't automatically. Qualify or back with structural gate.

**"Difference from DDD?":** shared *principle* (invariant enforcement; VO/Entity credited to DDD);
different *default* (compose-by-default, aggregate-only-when-needed) and *mechanism* (immutable values
+ pure use-cases + typed errors + transactional execution vs mutable entities + setters + exceptions).

**Derived action (new, the big one) `[JBCT]` (+ PFD design-level note):** a dedicated **write-side /
persistence-integrity** treatment making the three *unbundled* mechanisms explicit —
(1) validated aggregate value = composite invariant; (2) **structural write gate** = slice-owned
tables + validated-value persistence fn (functional aggregate root, only-when-needed); (3) use-case =
transaction boundary = atomicity. Frame against DDD's bundled aggregate-root; tie to structural-vs-
discipline safety (`inexpressible-constraints`). This is the section that converts the whole Poltorak
thread into a strength.

**Live-chat close to deploy:** name the *transaction boundary* + the *single write gate*; both land
the wheel example on Poltorak's own terms and collapse back to his "no invariant → no Entity."

### Round 3 (2026-06-17 cont.) — the seat-booking race (distributed consistency)

His scenario: A reserves → A pays (provider slow) → reservation idle-times-out, seat freed → B
reserves, pays, gets seat → A's payment finally confirms, but seat is already B's. "Whose seat?"

**Reframe (the key move):** this is a **distributed-consistency / concurrency** problem, *orthogonal*
to entity-vs-VO. **DDD does not solve it for free either** — Entity setters do nothing against a race
across time + an external service. The tools that solve it — **optimistic concurrency + saga/process-
manager** — are identical in both worlds; the Entity-qua-invariant-composite adds nothing. It's a
**process** problem = JBCT home turf (in entity-first design the saga is homeless, lives outside the
aggregates). Meta-pattern continues: same functional-core ↔ stateful-edge gap, now the *concurrent*
edge.

**Direct answer "whose seat?":** **B's, deterministically; DB never ambiguous.** Seat assignment is a
**compare-and-set** (`UPDATE seat SET owner=A WHERE state=reserved_by_A` / optimistic version) →
A's late confirm fails the conditional write, cannot overwrite B. Exactly one owner. A (who paid) is
then **compensated** (refund/rebook) — a typed branch in the process, not corruption.

**Four mechanisms (book content):**
1. **Concurrency control at the write gate** — conditional write / optimistic lock → one winner.
   Structural version (per `inexpressible-constraints`): **single-writer per seat** via Aether
   stream/partition → race becomes *inexpressible*, not merely guarded.
2. **Saga / compensation** — "paid but seat gone" = first-class typed outcome (refund/rebook).
   Process-first + typed results make the branch *forced, not forgotten* — **the JBCT advantage to claim.**
3. **Reservation state machine** — root cause is releasing a reservation with payment in flight;
   `payment-pending` is a distinct state **not subject to idle timeout**. free→held→payment-pending→
   sold/released, guarded transitions.
4. **Idempotency** on the external-confirm handler (delayed/duplicate provider callbacks).

**Honest concession (own it):** naive reserve→pay→confirm with no concurrency control = *exactly his
bug* (last-writer-wins). Methodology doesn't prevent it automatically and **the book prescribes
neither concurrency control nor sagas.** Claim: "JBCT gives this the right *shape*; you must apply
optimistic concurrency + model compensation — and so must DDD." Avoid "JBCT handles this" (overclaim trap).

**Derived action (extends the write-side/integrity section) `[JBCT]`:** add **contended resources &
long-running processes** — (a) concurrency control (CAS / optimistic / single-writer stream),
(b) saga/compensation for external side effects, (c) state-machine reservations with guarded timeouts,
(d) idempotent external boundaries. Framing: *this is where process-first earns its keep; the Entity
doesn't help across time.*

**Live-chat close:** "B's; A's late confirm loses the CAS so the DB is never ambiguous; A is
compensated; the real bug is idle-timing-out a payment-pending reservation; it's optimistic
concurrency + a saga, which DDD needs here too — a *process* problem, the methodology's center."

### Round 4 (2026-06-17 cont.) — author's own answers (monads; state machine vs entity)

Author replied directly (not via drafted text). Both replies strong; two borrowable, one reframes the
entity point more sharply than the earlier draft.

**A. Monads as IoC containers (FP/Promises) `[JBCT]`** — borrow for the monadic-composition chapter
intro. A monad is a container you hand functions to; *the container* decides whether/when/if to apply
(Option = only if present; Result = skip on failure; Promise = apply when the value resolves). Payoffs:
code reads as a sequence of transformations free of checks; the *same* shape across Option/Result/
Promise (async becomes transparent); each monad carries a **business semantic** (absence / failure /
latency-plus-failure).
- *Resolved:* author confirms the description is technically correct, just simplified — Promise is
  effectively **both hot and cold**: a hidden "run" step fires on resolve, while application to an
  already-resolved value happens immediately. Wording stays. *Optional book sidebar:* name the hot+cold
  duality, since it's exactly where a reader forms the wrong model. Minor: "IoC" for monads is a
  pedagogical analogy a purist may contest.

**B. Entity replaced by a sum-type state machine `[JBCT]` (the sharper kill) — ties to
`inexpressible-constraints`.** Core of the "do you need an entity" answer. Model lifecycle as a state
machine whose states are a **sum type**: shared data/behaviour in the base, state-specific data/
behaviour in each variant. Every advantage of an entity **without** the risk of calling a method that
doesn't fit the state or touching data not in it — those become *structurally inexpressible* (compile
error). Killer line: **"the entity exists only as the union of all possible states, which never
materializes."** Dissolves Poltorak's hardest Call sub-case (transfer = just another state). Positioned
as the OO+FP hybrid mainstream languages converge on — "more reliable than OO, more democratic than FP."
- *Candidate quotable line* → also for `project-quotable-lines`.
- *Resolved:* author added serialized event intake — "обробка вхідних івентів серіалізується (через
  чергу)", so a new event never meets a partially-processed prior one. That's the actor-mailbox /
  single-writer guarantee; B is now airtight on both axes (typed-state + concurrency). Minor: "the only
  way to cover all situations" absolute remains (author's call).

**C. Scope boundary (positioning) `[both books]`** — author noted the methodology is **backend-scoped,
a conscious limitation** (telephony example out of scope, answered anyway). Worth an explicit scope
sentence in the positioning so out-of-domain examples don't read as gaps.

### Round 5 (2026-06-18) — state explosion, accessibility, rich-vs-anemic; debate hits its real crux

Poltorak pressed the Call harder: many *interdependent* state dimensions (codec per leg, mute, hold,
lifecycle, N handsets) → combinatorial explosion; one event touches many coupled dimensions, so naive
independent machines don't compose. Plus an **accessibility** argument (who writes/debugs grammars vs
OOP; "operate with available resources, can't wait for Guido").

**Convergence reached:** both agree an invariant-locus is needed exactly when a genuine cross-data
invariant exists. Residue is (a) **default** (PFD process-reveals-it vs entity-first), (b) **mechanism**
(immutable value + pure transitions + events vs mutable OOP entity), (c) an **empirical** split (how
common rich invariants are in backend). (b)/(c) are mechanism/empirical/values, not logic — more
telephony rounds won't resolve them. Worth naming the convergence rather than trading examples.

**Borrowables `[JBCT/PFD]`:**
1. **State-explosion answer, precise:** interdependent dimensions = **statecharts** (Harel: hierarchy +
   orthogonal regions + inter-region events/guards) — NOT flat FSM (explodes), NOT independent machines
   (can't express coupling), NOT god-object (no isolation). Coordination protocols (codec negotiation,
   mute-both-then-switch) **are processes/sagas across regions**; the actor (Round 3/4 single-writer)
   holds the chart, events serialize in. Concurrency-of-interdependent-state extension of the Round-4
   sum-type state machine. **Grammar and state machine are dual** (Chomsky: regular↔FSA, CFG↔PDA =
   "machine with memory"); the grammar is the *intensional* description of the same space the FSM
   enumerates *extensionally* — that's why it dodges the blow-up (the never-materialized union, per the
   Round-4 line). For the concurrent case the precise dual pair is process calculi / session types ↔
   communicating automata / statecharts (cross-channel constraints like codec-match aren't context-free).
2. **"An entity has more possible states than the system has valid states"** (author) — the case for
   typed states in one line; god-object admits invalid combos sum-types forbid. → `project-quotable-lines`.
3. **"Encapsulating fragility doesn't remove its cause; it makes the system hard to change"** (author) —
   PFD-vs-DDD-encapsulation thesis. Quotable.
4. **Data-first vs process-first** (author 9:08): "business starts from processes, not from what info
   everyone needs at once; building the process reveals what data is needed, when, where — DDD's
   coupling becomes PFD's cohesion." Crisp foundations positioning.
5. **Entity isn't self-persisting/self-reserving** → persistence is a concern separate from the
   invariant locus (ties to the write-gate borrow).
6. **Irreducible cross-data invariants exist** (double-entry debits=credits; codec-match) =
   aggregate-when-needed. PFD should *explicitly acknowledge* them so it doesn't read as denying them.
7. **PFD as business-process hardening** (author's reframe of the fragility thread — strong positioning
   asset). Inverts Poltorak's "domains are inherently fragile, so encapsulate it": modeling the business
   as processes (use case → workflow → subsystem) *surfaces* latent fragility — implicit decisions,
   contradictions, data-first coupling — **before it is codified**, where it's cheapest to fix. Split it
   honestly: PFD **cures** *accidental* fragility (fix the real business process) and **surfaces +
   localizes** *irreducible* fragility (regulatory, genuine cross-data invariants → aggregate-when-
   needed), vs the entity encapsulating accidental and irreducible alike and hiding which is which —
   **cure-or-expose vs hide.** Caveat: curing needs the mandate to change the business; absent it, the
   value is still making the decision explicit, not buried. Business-level twin of
   `inexpressible-constraints` (make the fragile state unable to arise, pre-code). Already *demonstrated*
   in `spiral-0-decisions` (held-seat-on-payment-failure surfaced, not left implicit) — naming it gives
   that material a thesis. Frame as positive contrast, not DDD teardown. Quotable: **"PFD is
   business-process hardening."** **Status (2026-06-18):** seeded in `spiral-0-decisions` ("Into the
   methodology" close) as one paragraph; full treatment reserved for a standalone article (out of book
   scope), not expanded in the book.

**Note — the Call example will fade (out of scope).** Author is letting the telephony thread drop (it's
outside PFD's backend scope, already flagged, and answered on the merits). Keep it out of the book;
**re-ground these borrowables in an in-scope backend lifecycle** (order / seat-reservation state) so the
insight survives without the out-of-scope example.

**Author's-own-answer flags (tactical):**
- **"Grammar" — keep it, deploy the duality** (corrected; the earlier "drop" was wrong). Grammar and
  state machine are formally dual (Chomsky: regular↔FSA, CFG↔PDA). Deploying it answers BOTH Poltorak
  points: *explosion* — grammar is the intensional rule-based description of the same space the FSM
  enumerates extensionally, so it never materializes the product (1M states vs a few productions);
  *accessibility* — dual ⇒ "who debugs grammars" == "who debugs state machines," the objection
  self-cancels (six-pattern vocabulary is the small surface either way). **Precision for the concurrent
  Call:** plain duality is for a single sequential stream; the Call is concurrent interacting components
  with cross-channel constraints (codec-match across legs, not context-free) → use process calculi /
  session types ↔ communicating automata / statecharts, not a plain CFG.
- **"Reuse ≈ 0 in backend"** overclaims and contradicts own VO/leaf reuse → "shared-*mutable-entity*
  reuse is low/harmful; value + pure-function reuse is what backend has."
- **"Domain not fragile / coupling almost exclusively VO"** too strong → concede irreducible cross-data
  invariants (double-entry) = aggregate-when-needed; that *strengthens* the position.
- **"Slide to hello world" / "assume no-worse qualification"** = weakest rebuttals; meet accessibility
  with small-vocabulary, not dismissal.

---

### Round 6 (2026-06-19) — cohesion overstatement + multi-trigger workflows

**1. Cohesion claim overstated `[PFD]` (real fix) — `spiral-2-workflow.md:25`.** The booking example says
the four reservation use cases "all change together." Poltorak: a hold-duration change doesn't touch
*cancel reservation*; a confirmation-rules change doesn't touch *release expired holds*. He's right —
"all four change together" is false for single changes. The principle is sound (one change driver, the
reservation policy, governs all four) and **:27 already frames it correctly** (complete + pure, driver-
based). Fix = align :25 to :27: cohesion is **shared change driver / same reason to change, NOT lockstep
co-change**. Reworded (offered): "...one change driver governs all four: the reservation policy
(the hold duration, the confirmation rules, the conditions for release). Concretely, that policy is a
small state machine over a seat's reservation state (free, held, confirmed) and the four use cases are
its transitions... Not every facet touches all four... they are the transitions of one machine
answering to one policy, not that they move in lockstep." Author addition: frame the four as the
**transitions of the seat's reservation state machine** — the policy made concrete (machine = the
driver/cause; shared seat record = where its state lives/symptom, consistent with :25's driver-first
argument). Ties this example to the sum-type-state-machine reframe (Rounds 4-5). High value: sharpens
the recognition test itself (change-driver cohesion != co-change frequency).

**2. Multi-trigger processes `[PFD]` (model refinement — author's call to encode).** Poltorak: workflow
with 2 triggers (delivery starts on purchase-with-stock OR on restock-of-a-paid-order)? **Author's model:
a process needs at least one trigger and the count is unlimited; the OUTCOME defines the process, not the
trigger.** Tension to reconcile: `foundations:29` currently says "the same work behind a different trigger
is a different process" (trigger-individuates), which contradicts multi-trigger. Fix = revise :29 to
**outcome-individuates**: >=1 trigger, may have several (purchase or restock), same outcome via different
triggers = one process, same steps for a different outcome = different processes (preserves the old
clause's don't-over-merge intent, e.g. *cancel* vs *release expired holds* stay distinct). Keep
`foundations:91` "one trigger, one outcome" as the canonical shape; nuance lives in :29. Equivalent
elegant form: one process triggered by a derived fact with multiple producers. Revised :29 **applied 2026-06-19**.

**Status (2026-06-19):** `:25` cohesion rewrite (driver + seat state machine) and `:29` trigger revision (>=1 trigger, outcome-individuates) both **APPLIED, built, verified in PDF**. Poltorak reply pending.

### Round 6 cont. (2026-06-19) — extended discussion: formatting + content

**Formatting (the 3 author tasks):**
- *Header font size* `[build]` — `##`/`###` rendered at `\normalsize\bfseries` (= inline bold) under
  pandoc's default `article` class. **FIXED**: added `titlesec` (subsection -> `\Large`, subsubsection ->
  `\large`) to `book-pfd-meta/build-pdf.sh`; verified distinct in the rebuild (113pp).
- *Hanging lines (orphans/widows)* `[build]` — no penalties set. **FIXED**: added
  `\clubpenalty/\widowpenalty/\displaywidowpenalty=10000` (preventive; visual spot-check still advised).
- *Diagrams* `[build]` — ASCII-in-listings is hard to parse (Poltorak). **DECISION PENDING**: TikZ
  (pure-LaTeX, no new dependency — recommended) vs Graphviz/Mermaid (easier authoring, adds a binary) vs
  improved ASCII. Convert the few structural diagrams (use-case dependency graph; the new seat state machine).

**Content items from the extended debate (author acknowledged "поправлю"; book edits PENDING) `[PFD]`:**
- *Workflow-as-one-interface looks like an entity* — `CancelBooking` nesting all use-case interfaces reads
  as a god-object and isn't needed physically (workflow = logical grouping; if in code, a thin
  orchestrator interface+method). Rework the representation. (Author: "на практиці не потрібен".)
- *Code fragment without its function* (p.43) — `return CancelBooking.ValidRequest.validRequest(request)`
  shown as a bare body; add the enclosing function/signature so fragments read as valid Java.
- *Buy-ticket unwind line* — "committed steps hold/authorize/confirm must unwind": Poltorak says hold/auth
  have nothing to undo; author: the hold must be released. Sharpen so the unwind (release hold, void auth)
  is concrete.
- *Iteration return semantics* — 50-ticket buy / refund saga: state explicitly that iteration returns each
  operation's result and the caller decides; name fail-fast vs all-and-mark-cancelled (often parallel).
- *Time-as-condition / release-expired-holds phrasing* — reads as in-memory logic; in practice often a DB
  status/criteria check. Optional clarify.

Note: most of Poltorak's coupling/entity arguments are the recurring entity-vs-process debate (accidental
vs essential coupling) — already covered; no new action beyond the above.

### Round 7 (2026-06-19) — the long entity debate: the missing "not anti-entity" statement + 2 code fixes

The whole multi-hour thread reduces to one charge: **"PFD is anti-entity and has no invariant story."**
Author's own replies hold the rebuttal the book lacks (5:12: an entity is needed only when constraints
cross field boundaries; valid-fields -> valid-whole means a separate entity adds nothing; 6:04: entities
exist "in a sense" as the DB data representation). The book never states this, so it reads as anti-entity
though the author isn't.

**1. Entity clarification `[PFD]` (priority; ties to the entity-at-db-boundary gap).** Add to foundations
after the `:21` bet: PFD is NOT a ban on entities. An entity earns its place when an invariant crosses
field boundaries (a whole of valid fields can still be invalid); where that invariant must hold in
storage, the guarding composite **reappears at the persistence boundary** (the shape state is saved in,
the gate writes pass through). Process-first changes the DEFAULT (process = unit of design; entity
introduced where an invariant demands, not centred by assumption). Defuses Poltorak's core charge,
matches the author's position, supplies the entity-at-db-boundary acknowledgment the book was missing.
Draft ready (offered).

**2. Seat-change pricing example `[PFD]` (real fix) — `spiral-3:69`.** "(acquire the replacement, charge
the difference)" / "(release the original, refund the difference)" is inaccurate: *buy ticket* charges
the FULL new price and cancel-refund refunds the FULL old price; the NET is the difference, but each leg
is a whole transaction. Reword to "(acquire and charge for the replacement)" / "(release and refund the
original)" + note the net is the difference settled as two whole transactions (a single difference-charge
would need a difference-pricing variant: reuse vs fewer transactions).

**3. Buy-ticket unwind wording `[PFD]` — `spiral-2:181`.** "committed steps hold/authorize/confirm/issue
must unwind in reverse" is defensible (each has an inverse) but reads as "nothing to undo." Sharpen by
naming the inverses (release the hold, void the authorization, un-confirm, invalidate the ticket),
unwound from the failure point. Ties to the seat state machine (held vs sold are distinct states).

**Recurring (mostly covered / 1 open):** persisted cross-field invariant (the "car with 3 wheels") = the
deferred write-gate / stateful-edge `[JBCT]`, now located by fix #1. Compensation forward/inverse drift:
author's shared-module answer is defensible, no action. **OPEN consideration: navigation/discovery at
scale** (thousands of flat use cases) — the telescope (subsystem -> workflow -> use case) IS the
navigation hierarchy; the book could state that explicitly as the answer (it currently doesn't connect
the telescope to large-surface discovery).

### Round 8 (2026-06-19) — entity + workflow model encoded (APPLIED, built, verified)

Three rules the author settled, now in the book and the 114pp PDF:
1. **Entity** — `foundations` (after :21): not a ban on entities; an entity is for a **cross-field invariant
   enforced at persistence**; process-first changes the *default*, not bans entities. Answers the whole
   Round-7 "anti-entity" charge, and supplies the entity-at-db-boundary acknowledgment.
2. **Workflow materialization** — `spiral-2` (workflow-body section): a workflow is **logical by default**;
   it materializes as code only when it has a trigger of its own, distinct from its use cases'.
3. **Materialized = use-case-like** — `spiral-2`: `CancelBooking` de-nested from a container of six step
   interfaces to a **use-case-shaped interface** (one `apply`, workflow-trigger input); the six steps are
   now independent use cases. Kills the "workflow interface = entity" shape Poltorak flagged.

### Round 9 (2026-06-19) — the telescope rule (cross-book; closes the navigation-at-scale OPEN item)

The Round-7/8 OPEN consideration — navigation/discovery at scale ("thousands of flat use cases") — is now
answered, and the answer is the **telescope rule**: the discovery hierarchy (use case -> workflow ->
subsystem -> system) is also how the package tree is organized, so it doubles as the codebase's navigation
hierarchy. Author's framing accepted: it *expands packages*, so the telescope is literally visible. Applied
across both books (built + verified):
- **PFD** `foundations` (after the fractal-consequence para, :118): 3 sentences — the fractal structure is
  also how the code is organized; names that *Java Backend Coding Technology* calls the package realization
  the *telescope rule*; states the lowest-covering-altitude shared rule. Explicitly answers the flat-1000-
  use-cases worry. Kept brief by design (mechanics live in JBCT).
- **JBCT** `book/ch15-project-structure.md`: new section **"The Telescope Rule: How Structure Grows"** —
  flat base case -> workflow appears (tree expands, use cases move under it) -> subsystem appears; **shared
  code at the lowest common ancestor** (generalizes ch07 "nearest shared package" + CODING_GUIDE's tiered
  rule; floats up never down; altitude = blast radius); **dependencies point up, never sideways** (sibling-
  workflow import = visible smell); reorg-as-deliberate-refactor; by-criteria block. Plus hooks (What
  You'll Learn, Key Takeaways #6, a note under the "Where Things Go" table).
- **CODING_GUIDE.md** (after the tiered-placement guideline, :170): names the telescope rule, generalizes
  the tiers to LCA + float-up + blast-radius + dependencies-point-up; points to the Project Structure chapter.

Reconciliation (no contradiction): today's flat `usecase/<name>` + single `domain/shared` is the
telescope's **base case** (t=0, before any workflow emerged); "nearest shared package" = the LCA once
intermediate altitudes exist. Value to JBCT is **determinism**: placement becomes an algorithm (LCA), not
taste — AI-friendly.

### Round 10 (2026-06-19) — audit-as-data: who writes it (APPLIED, built, verified) + Poltorak sign-off

**Question:** "Who intercepts the result and writes the audit, if the web calls the BuyTicket use case
directly?" (re the `BuyTicket.Response { ticket, receipt, ledgerEntry }` audit-as-data example, spiral-3).

**Answer/fix:** nobody intercepts — that is the point of audit-as-data. The ledger append is a **step inside
the use case**, performed as it completes the booking; the `ledgerEntry` in the response is the
already-written record handed back as **data**, not a write deferred to the caller. The output type is the
contract surface, not the persistence trigger. The misleading line was *"the ledger is assembled from
entries the workflows already return"* (reads as if a downstream collector exists). Fixed in
`spiral-3-subsystem.md` (after the `BuyTicket.Response` block): added that returning ≠ writing, the use case
writes its own entry, nothing intercepts a direct call, and *assembled* = the ledger accumulates what each
use case appends. Built, verified (115pp).

Note: author's chat reply used "...стосуються всього воркфлоу, дизайн на цьому рівні" — risk is Denys reads
"workflow" as the bypassed higher altitude; the precise framing is use-case level (the entry is a
whole-process fact the use case produces and writes) with ledger *consistency across use cases* designed at
subsystem altitude. The book now states it unambiguously regardless.

**Poltorak finished the spiral (2026-06-19): verdict "солідно" (solid).** Said he tried to surface every
problem he saw; overall solid, and the detailed backend was "what I was missing for understanding
processes." Offered to **recommend the book to a couple of communities ("чатики")** once he finishes the
whole thing — a warm amplifier lead, pending his full read. This closes the active Poltorak review thread
on a positive note; remaining reviewer gate is the native-speaker copy edit.

### Round 11 (2026-06-20) — workflow progression: who advances a non-materialized workflow (APPLIED, built, verified)

**Question (Poltorak):** split a 10-use-case workflow into two "so they're not too long" — who launches
the second workflow when the first finishes, and who launches use case 2 in workflow 1 if the web only
triggers use case 1 and the workflow has no code entity?

**Answer/fix:** the premise (split by length) is wrong — workflow membership is set by change driver
(completeness + purity), not step count. On progression: a logical workflow is **advanced by external
triggers over persisted state, not by an orchestrator** — between steps it lives as persisted state, and
each use case is triggered from outside (user/event/schedule) independently; the state each step leaves is
what connects the calls. A workflow materializes only when it has a **trigger of its own, independent of any
individual use case's trigger** (then it runs as a single process), and the two can combine (only the
own-trigger transition takes code form). Added a complete-construction paragraph to `spiral-2-workflow.md`
after the materialization rule covering all three cases (logical / materialized / mixed). Built, verified.

(Reply to Denys delivered separately; same content. This entry records the book change.)

### Round 12 (2026-06-21) — workflow as state machine + essential coupling (cross-book, APPLIED)

Two complementary points from the workflow thread, split across both books (full in the native book, short pointer in the other):
- **PFD `spiral-2`** (after the cohesion passage): a logical workflow is usually a **state machine** over persisted state, its use cases the transitions; explicit or implicit, make explicit when transition guards are load-bearing. Making it explicit does not add coupling, it **relocates essential coupling** the domain already has — represent once, not duplicated. Short pointer to the deterministic placement (JBCT).
- **JBCT ch16** (telescope/LCA section): the workflow state machine as the **worked example** of the LCA rule (lives in the workflow package's `shared`, dependencies point up), plus the **essential-vs-accidental** gloss on minimal-sharing. Short pointer to PFD for why the coupling is essential.

Built, verified. No version bump (rolls into the current draft / pre-next-cut, consistent with Round 11).

---

## Rico Fritzsche — started reading PFD (2026-06-15)

- Liked the thesis line unprompted on page 1: *"the unit of design is the process, not the entity."*
- Will send feedback by read-progress. Nothing actionable yet.

---

## Thor Henning Hetland — outreach-sent + responded 2026-06-18

- Role: outside-observer / potential-user read (not cited) + trust-lens resonance + amplifier. His
  LinkedIn "the claim you can't make" post (derived-not-asserted state; "you can't bribe a derivation")
  is the trust-register restatement of the book's parse-don't-validate kernel — see memory
  `inexpressible-constraints`.

**Response (2026-06-18) — strong engagement.** Read it ("nice work"), mild scope caveat ("not sure it
fits perfectly in the broad landscape"). His AI agents *built artifacts around the methodology*: a KCP
knowledge.yaml of PFD, four perspective files (entity-centric / hexagonal / DDD / his SDD) on the
seat-reservation problem, and an interactive "Race Condition Theater" HTML demo (scenarios: seat
reservation, flash sale, bank transfer, order fulfillment, shared-doc edit; Chaos mode shows
payment-fail behaviour). Delivered via Google Drive. **NOT opened/run — third-party files, treat as
data; open the HTML only deliberately.**

**Three push-points (borrowables; overlap with Poltorak = corroboration):**
1. **Design-out isn't free `[PFD/JBCT]` (the gem):** the hold model trades the race for TTL/expiry
   management (= the Spiral-0 orphaned-hold problem). "When is design-out more expensive than
   compensation?" The book sells design-out near-free; give it its **cost + a design-out-vs-BER
   decision criterion**. Foundations already frames recovery as a four-axis judgment — make design-out's
   cost explicit there.
2. **Altitude scaling — "book stops before workflow altitude."** Factually wrong (spirals 2/3/4 cover
   workflow/subsystem/system); he's reading the deliberate **hourglass taper** (passes 2-4 short,
   deferring to Architecture Synthesis) as "stops before the hard part." Real perception risk: clarify
   2-4 exist; consider a stronger "real work happens here" signal in the higher passes.
3. **Legacy entry — top-down `[PFD]`:** spiral is bottom-up; can it start at subsystem altitude and
   work down? Book has Brownfield, but **top-down entry** may not be explicit — check + make it so.

**Next:** reply (he's "happy to continue") engaging the design-out-cost thread + gently noting 2-4
exist; decide whether to review the Race Condition Theater artifacts.

**Gift archive assessed (2026-06-18 — safe: no injection, self-contained HTML, not executed):** KCP
knowledge.yaml + 4 perspective comparisons + Race Condition Theater demo.
- *Fidelity gaps (book-exposition fixes) `[JBCT]`:* their model transcribed `Result<T, E>` (two-param)
  and treated Promise as merely async — PFD is single-param `Result<T>` with **Promise carrying
  failure**. Careful agents inferring two-param = a real tell → tighten the Result/Promise exposition.
- *Comparisons fair-to-generous* (DDD = "a genuine improvement"); PFD occasionally over-credited with
  unqualified wins ("failure structurally impossible," "0 lines") that skip its own costs (TTL/queue,
  serialization-point-as-bottleneck). Demo scorecard persuasive, not neutral (PFD always 0; its costs
  never scored). Honest spot: doc scenario surfaces a `ConflictState`, no fake auto-merge win.
- *Engage:* (a) **design-out cost** — triangulated (Poltorak + Thor + Thor's own files); even the demo
  relies on TTL/recomputation never scored; knowledge.yaml calls design-out "cheapest recovery class"
  (not always). (b) **serialization point is a bottleneck** — concede; don't let "no race possible"
  stand unqualified. (c) **altitude taper** — careful reader reads spirals 2-4 as claimed-not-
  demonstrated (depth concentrated at use-case + Architecture Synthesis). (d) **legacy** — Brownfield
  already answers top-down reverse application; point him there (likely didn't reach it).
