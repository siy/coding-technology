# Reviewer Feedback — collection log (author reference — not shipped)

Living log of pre-publication reviewer feedback and the book changes derived from it.
Items are **pending** until implemented; nothing here is applied to the manuscript yet
(holding for more feedback before a consolidated pass). Tags: `[PFD]`, `[JBCT]`, `[build]`.

Reviewer roles (panel balance):
- **Poltorak** — adversarial / orthodoxy stress-test (asserts & defensive-programming background)
- **Fritzsche** — RPU characterization, practitioner read
- **Loth** — cohesion + IVP integration
- **Hetland** — trust-lens resonance + amplifier (to be sent)

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

## Rico Fritzsche — started reading PFD (2026-06-15)

- Liked the thesis line unprompted on page 1: *"the unit of design is the process, not the entity."*
- Will send feedback by read-progress. Nothing actionable yet.

---

## Thor Henning Hetland — not yet sent

- Target role: trust-lens resonance + amplifier. His LinkedIn "the claim you can't make" post
  (derived-not-asserted state; "you can't bribe a derivation") is the trust-register restatement of
  the book's parse-don't-validate kernel — see memory `inexpressible-constraints`.
- Send the same draft, framed for the trust read ("does the trust angle change how you'd pitch
  this?"), request pre-pub confidentiality.
