# PFD — Planned Changes (backlog)

> Capture of planned/queued book changes. Not shipped until folded into `book-pfd/*.md` and
> recorded in `book-pfd/CHANGELOG.md`. Manuscript em-dash style applies once moved into the book;
> notes here are internal.

**Status (2026-08-01):** Items 1, 6, 9 shipped in **PFD 1.6.0** (the *Edge Cases* chapter and its
objections-answered close). Items 2–5 shipped earlier (1.3.0 / 1.4.0: glossary, change-driver
tracking, ownership dynamics, the named principles). Item 8 shipped in **JBCT 4.2.0**; the JBCT-side
`*State` rule and the shared-spine glossary cross-reference shipped in **JBCT 4.2.1**. Item 14 shipped
in **PFD 2.4.0** (read-write staleness — *Foundations*, both appendices, both glossaries). **Still
open:** item 7's single running example carried across all three books (PFD / JBCT / Aether) — the
glossary spine half is done, the shared conference-booking worked example is not. The detailed
register below is retained for reference.

---

## 12. Series-review retrofits (2026-07-12) — POSTPONED to next PFD/JBCT revisions; specified now

**Source:** `book-arch-meta/series-review-feedback.md` + `SERIES-REVIEW-DISPOSITION.md` (v2). Arch-book-side items applied 2026-07-12 (manuscript 0.3.0); the cross-book retrofits below ride the next release cycle of each published book.

**Series terminology ruling (user, 2026-07-12) — the recovery triple:** canonical long names = **compensate-by-inverse / degrade-and-continue / design-out**; BER/FER remain the official SHORT forms (backward/forward recovery — compact notation for tables, matrices, code). First use per chapter gives both; prose prefers long names. Retrofit is ADDITIVE for PFD/JBCT (their BER/FER stays valid): introduce long names as canonical prose at next revision.

**PFD next revision:**
- **Question-set convergence to nine — DONE both sides 2026-07-15** (user ruling 2026-07-14, AS
  read-feedback item 1; AS-side 0.3.9, PFD-side **2.1.0** — pulled forward by user from "next
  revision"; site glossary crosswalk made historical, front-door card updated; module table +
  categories + scopes, per-axis citations, brownfield numbering, spiral-1 scope note converged). PFD adopts the nine-question sheet natively; **PFD's
  changelog carries the transition story**, relocated here from AS ch. 2 (which keeps only the
  membership criterion + count-is-output law). The story, preserved for the changelog entry:
  the module and the articles ran eleven questions; auditing the AS validation runs against the
  membership criterion (an answer must press or prune an axis independently) showed two failures —
  *peak load* and *scale shape* never pressed anything separately (every derivation cited them
  together → merged into **Load**), and *technology mandates* never pressed an architecture axis
  (they bind the later technology choice, reaching architecture only when striking a value
  outright, e.g. "no cloud" kills serverless → folded into **External constraints** as one
  clause); and three survivors — latency, availability, durability targets — turned out to be one
  grammar wearing three vocabularies, regrammared as the three **budgets** (time / failure /
  loss). Nine survived; the count is an output of the criterion. Migration note for PFD's pages:
  *nothing you learned is wrong — two pairs merged, three were regrammared; the sheets are
  compatible.* Articles stay at eleven (historical record, untouched). Knock-ons at this landing:
  AS series-note supersession sentence simplifies (both books speak nine); site glossary
  crosswalk row "eleven→nine" becomes a historical note.
- Recovery-triple long names introduced (BER/FER kept as short forms) — Foundations + glossary.
- Driver modes (prune/select/isolate/split/bound) become the canonical question taxonomy (crosswalk from the four categories; glossary carries it).
- Architecture Synthesis module → design-time preview + canonical pointer to the Arch book, **at the Arch book's ship** (decision D in Arch BOOK-PLAN); supersession recorded in both revision histories.
- Reading map + register note added to front matter (identical text across the series; source: book-arch/series-note.md).

**JBCT next revision:**
- Ch. 18 migration "Phases" → "stages" (collides with PFD's Phase 1–6).
- Recovery-triple long names introduced (as above).
- Backlog (from review §JBCT): separate universal principles from Java-specific realization; principles vs Pragmatica-library features made explicit; Spring-brownfield adoption path (fold the legacy-adoption article rather than writing fresh).
- Reading map + register note in front matter.

---

## 10. Poltorak full-read review (2026-07-01) — deferred items

He read the whole book. Landed edits shipped in **1.8.0** (variation-without-branching worked example;
scope-band definition; tiers overclaim; single-sitting-read correction). Still open:

- **The numbers clog the terminology.** His sharpest pedagogical note: readers retain "six patterns / four
  shapes / six properties" as *counts* and forget *which*. The spine layer partly cures it (it resurfaces the
  content), but the deeper fix is a pass that leads with the names and what they *do* and stops branding the
  numerals. A real editorial pass, not a quick edit.
- **Condensed edition as the free "Lite".** He independently proposed splitting into a ~40-page open-source
  overview + a paid detailed version (the C++ FAQ / FAQ Lite model) — exactly the condensed edition built in
  1.7.0. Reconsider distribution: the spine harvest could be the free on-ramp rather than a local give-away.
  Deferred; currently local-only.
- **Testimonial.** He offered a Leanpub testimonial; accept it. Also offered coupon distribution to Ukrainian
  IT chats and an r/softwarearchitecture post — low-cost, his call.

---

## 11. Use case vs workflow — the bridge + the discriminator rule (2026-07-09)

**STATUS (user ruling 2026-07-11): POSTPONED — no PFD book edits while the architecture book is the focus.** The item stays fully specified below for the next PFD pass (2.x); it ships together with item 5's trigger taxonomy. Nothing here blocks the architecture book.

**Origin:** Yannick L. (IVP), personal DM 2026-07-09, mid-read of the book — first cold-reader-confirmed
clarity gap: "what qualifies as a Use Case, what qualifies as a workflow." He knows EPC, BPMN2, and
classic UC theory; if the boundary wobbles at his depth of reading, the book explains it worse than
assumed.

**The gap (two halves):**

1. **Both glossary definitions lean on "one outcome"** (use case: "one trigger, one outcome"; workflow:
   "composition of use cases for one business outcome") and the discriminator is never stated as a rule —
   a reader with a multi-step operation can't mechanically decide which altitude they're holding.
2. **No positioning against the classic definitions.** A Cockburn/Jacobson-literate reader gets no signal
   that PFD's use case is deliberately not theirs, so silence reads as "same concept, unclear scoping."

**Decision (user, 2026-07-09): keep PFD's own definition — adopting a classic one would break the telescope.**
Jacobson's actor-centricity ("observable result of value to an actor") excludes event-triggered and
internally-invoked use cases (PFD's trigger taxonomy is wider); Cockburn's goal levels (summary /
user-goal / subfunction) are the taxonomy altitudes *dissolve* — importing him reintroduces the exact
ambiguity with someone else's labels; all classics define a narrative document (scenario + extensions)
with a heuristic boundary ("one sitting, one goal"), while the telescope needs a *mechanical* boundary
because altitudes must be checkable. And "one trigger, one outcome" is load-bearing: it is what SLOs and
change drivers attach to.

**The fix (two edits, ship together):**

- **A short "relation to the classic use case" note** (The telescope, at the definition): cite the lineage
  (Jacobson, Cockburn), name the deliberate deviations — trigger-centric not actor-centric; a structural
  unit composed from patterns, not a narrative document; altitude instead of goal levels.
- **State the discriminator as a rule:** a use case decomposes into *patterns*, never into independently
  triggerable business operations. The moment a step is independently triggerable — or state must survive
  between steps — you are at workflow altitude, and the workflow owns that spanning state machine.
  Sharpen the two glossary entries so they stop resting on "one outcome" alone.

**Adjacencies:** item 5's "use-case invocation as a valid trigger" (trigger taxonomy) is the same
neighborhood — ship in the same pass. The reply giving Yannick the one-line version of the rule is in
`book-arch-meta/ENGAGEMENT-2026-07-06.md` (2026-07-09 entry).

---

## 1. New section — "Exploring edge cases" (work title)

A dedicated section that collects reader/critic edge-case challenges and their resolutions. Each entry
is a worked example that *runs the methodology* on a scenario engineered to look like it breaks the
model, and shows the model either absorbing it or naming the honest edge. Origin: the Telegram
architecture-channel debate with Denys Poltorak, 2026-06-28 onward — it is producing enough material to
stand as its own section (Foundations back-half, or after Architecture Synthesis), not a single example.

**Per-entry format:** the challenge as posed → the resolution → the principle(s) it exercises. Keep the
adversarial framing honest: where the methodology has a real limit, name it (earned record, multi-driver
unit), don't paper over it.

**Edge cases collected so far (register):**
1. **Adjacent-seats group booking** — group-atomicity owner appears *only* at the all-or-nothing
   invariant (data grows at the invariant, not before).
2. **Premium auto-buy on availability** — one "feature" splits across two drivers: buy mechanics stay in
   booking, the auto-buy decision lives in premium; composed via boundary capability + `seat-available`
   event. Preemption edge: neutral priority primitive *or* a consciously-named second driver.
3. **Conference, parallel tracks, change-seat mid-event** — composite Sequencer; timetable is reference
   data; time-exclusivity is an earned-record invariant.
4. **Three-way interaction (auto-buy × group-booking × track-change)** — they meet only at the seat
   status state machine (one coordination point); every other field is single-owner; cross-subsystem
   contact is an event, not shared code.
5. **Cancellation residue (ticket-as-schedule + refund)** — derived availability + cancel-as-guarded-
   transition + cancelled rows as owned residue. (Detailed under the follow-up below.)
6. **Time-shared home seat (excursions to other tracks)** — residue is *presence intervals*
   `(user, track, seat, [from,to])`, not seat+exception rows; the home seat "freeing" during an
   excursion is the *trim* (absence of an interval = free); move-to-track is a guarded atomic trim+add
   owned by the ticket; reclaim is a guarded add; "free the home seat for others, or not" is a named
   business policy = one-line trim-or-not in the move; realized as a Postgres range exclusion constraint
   (design-out, declarative).
7. **Change-locality vs the aggregate (THE central DDD objection)** — a representation change (seat ->
   `seat | list of (seat,interval)` union) is insulated behind a value object in PFD too (representation
   + the earned no-overlap invariant), so cancel/`release()` and the state-machine hold-timer ride along;
   only genuinely-new behavior changes (schedule booking, windowed reads, slot-level events) — new in DDD
   too. The aggregate's "one place" is a dilemma (union concentrated in the highest-fan-in class, or
   separate entities that lose auto-pickup); thin-entity DDD just *is* PFD's split. Detail below.

The detailed write-up of the escalation (cases 1–4), the cancellation follow-up (case 5), the
time-shared-seat follow-up (case 6), and the change-locality follow-up (case 7) follows.

---

**Origin detail:** A reader escalates the booking example with successive use cases and asks, at each
step, "same workflow? whose is it?" The escalation *feels* like it breaks the methodology; it is
actually the spiral discovering altitude.

**Target home:** Foundations, right after the telescope + cohesion test (as a worked "run the test
four times" example), or a dedicated objections/FAQ appendix. Reuses the booking example; *change
seat* already exists as a subsystem-granularity Sequencer (`spiral-3-subsystem.md:67`), and the
composed-not-invented boundary contract is `spiral-3-subsystem.md:49`.

**The reframe to lead with:** there are no modules to assign things *into*. There are telescope
altitudes (use case -> workflow -> subsystem -> system), and a unit appears at an altitude where a
single change driver's cohesion *closes* (completeness + purity). So the question is never "does this
fit workflow W?" but "what change forces this, and only this, to move — and who else moves with it?"
Altitude is discovered, not assigned. A new use case either joins an existing cohesion (same driver)
or reveals a new driver and forms a new grouping; one "feature" can split across two altitudes when it
serves two drivers.

**The four cases, run through the test:**

1. **Buy N adjacent seats** — same workflow. Same *reservation policy* (hold/timeout/confirm/pay) is
   the use-case->workflow driver. New use case (find N contiguous free seats) reusing the same buy.
   Only-new-thing is data: an all-or-nothing group-atomicity owner appears *iff* "all N or none" is a
   real invariant — exactly there, not before.
2. **Premium auto-buy on availability** — splits; not one unit. Driver = premium rules + premium-account
   existence (distinct from reservation; purity forbids it inside booking). The *buy mechanics* stay in
   booking's reservation workflow; the *auto-buy decision* coheres under premium policy -> premium
   subsystem. Auto-buy is a premium use case that composes booking's buy capability across the boundary
   contract, triggered by booking's `seat-available` event. "Ticketing or premium?" dissolves: it was
   never one unit. **Honest edge (preemption):** if premium must outrank normal buyers, either booking
   exposes a *neutral priority primitive* (premium supplies the value; purity preserved) or booking's
   workflow *consciously* takes a second driver — permitted (multi-driver cohesion) but must be *named*.
3. **Conference, parallel tracks, change seat mid-event** — change-track is the book's *change seat*
   (acquire new, release old, settle the difference) = a Sequencer composing several use cases; driver
   = in-event seat-management. Data: no Conference/Track/Seat graph up front; change-track owns one
   field (current track-assignment); the track timetable is reference data (seeding op = admin/import).
   **Honest edge (earned record):** same-time-slot exclusivity and track capacity are genuine cross-field
   invariants — the book's *honest limit*, where a small record earns its place. Name the invariant.
4. **Do they touch each other's code/records?** — only at one primitive, by design. Code: three use
   cases under three drivers, nothing shared to collide in. Records: they meet at exactly **one field,
   the seat status enum** (free/held/confirmed/cancelled), which is a state machine; every feature writes
   it *only as a transition*, and all transitions on a seat **serialize at the seat** (the seat is the
   consistency boundary). Every other field is single-owner. Real interactions surface only there:
   auto-buy vs group-booking resolves at the `held->confirmed` guarded atomic write (design the conflict
   out, not lock); change-track releasing a seat emits `seat-free` -> may trigger auto-buy (the legitimate
   cross-subsystem event seam).

**The payoff line (keep):** an aggregate *hides* N-way interaction inside one mutable `Booking`
god-object; the telescope *funnels* it to one visible, named coordination point (the status state
machine) and routes the rest as single-owner fields + boundary events. None of the four breaks the
model; cases 2 and 3 mark the two honest edges where you make a deliberate, *named* call (multi-driver
unit / earned record) with vocabulary, instead of stumbling into a god-object.

**Follow-up — the cancellation-residue test (Poltorak, 2026-06-28).** Sharpened case 3: a conference
ticket is a *schedule* of `(track, time-slot)` session reservations (12:00-13:00 A, 13:30-14:00 B,
15:00-16:30 A) under one spanning invariant — no two of the holder's reservations overlap in time. That
makes the **ticket the earned record**: it owns the set of session-reservations + the no-overlap rule
(case-3's honest edge, now concrete). The challenge: cancel the ticket, status goes free, but the period
rows remain pointing at the old holder — stale data. Resolution, two book moves:

- **Availability is derived, not stored.** A slot is free *iff* no *active* (held/confirmed) reservation
  overlaps it — the recomputable-value gate. There is no `is_free` boolean to drift; cancel and
  availability re-derives free on the next read.
- **Cancel is a transition the ticket owns** (BER): one guarded atomic statement flips ticket ->
  cancelled and releases each owned session-reservation *together*; the invariant
  `ticket cancelled <-> its sessions released` is owned by cancel, so status and periods cannot diverge.
- The remaining `cancelled` rows are **owned residue** (audit/refund), not orphans — state is
  `cancelled`, not "still held." The drift is exactly the bug that *design-out + one owned transition*
  prevents; it requires a denormalized flag updated non-atomically. (A perf counter is allowed —
  decremented inside the same guarded statement; *un-owned* denormalization is the bug.)
- **One-liner:** store the reservation's own lifecycle; derive availability from it; never store "free"
  as a second source of truth.

Teaching value: the methodology *predicts* the earned-record branch and then dissolves the consistency
worry that branch raises, in a single move (derived availability). Good candidate to run right after the
four cases.

**Follow-up — time-shared home seat (Poltorak, 2026-06-28).** Added rule: a user holds one seat on one
track for the event (no reseating every half hour), but may spend chosen segments on another track, and
for those windows the home seat is *freed for others*, reclaimed afterward. Time now lives *inside* one
seat. Resolution — finer residue, same machinery:

- **The stored fact is a presence interval** `(user, track, seat, [from,to])`, not "a seat with a status
  + exception rows." A user's schedule is the *set* of their intervals; the home booking is one interval
  spanning the event. Fragmentation requires an explicit op, so the default "one seat, one track" shape
  is structural, not a stored constraint.
- **Move-to-track is one guarded atomic transition** owned by the ticket: *trim* the home interval around
  `[t1,t2]` and *add* an interval on `(B, seat')`. The "home seat freed" is the trim — absence of a
  covering interval = derived free for exactly that window. No stored "freed" fact (derived availability
  applied to the user's own seat).
- **Reclaim** = adding a home interval again, guarded against others who took the freed window. Real
  contention funneled to one point (the seat's presence intervals); designed out, not locked.
- **"Free the home seat for others, or not" is a named business policy**, expressible as one line in the
  move transition (trim home vs keep it held). The methodology surfaces the choice; it doesn't bury it.
- **Realization:** "no two presence intervals on a seat overlap in time" is a Postgres range exclusion
  constraint (`EXCLUDE USING gist`) — design-out as a declarative schema rule. Cancel/refund (case 5) is
  the same machinery: trim/cancel the intervals.

Teaching value: pushes the residue + derived-availability + guarded-transition trio to its sharpest form
(time-sliced single resource) and it still holds with no new primitive — strong example for the section.

**Follow-up — change-locality vs the aggregate (Poltorak, 2026-06-28). THE central DDD-vs-PFD objection.**
Challenge: a representation change (one seat -> `one seat | list of (seat, interval)` union) lands in one
DDD entity (stable public interface, only private save/return changes, callers auto-pickup); PFD's
separate use cases seem to force rewriting cancel, return, premium, adjacent-seats — "rewrite half the
system," "the schema leaked into the code." Resolution:

- **PFD encapsulates the shared primitive in a value object too** — `Reservation` (the union is internal;
  interface `release()/overlaps()/total()/freeWindows()` is stable). The conference ticket is the earned
  record (owns schedule + no-overlap invariant). The representation change lands there; cancel
  (`release()`) and the hold-timer (on the `held->expired` state machine, agnostic to capacity) ride
  along insulated — exactly DDD's claim. Only genuinely-new behavior changes: schedule booking (new
  input/UI), windowed reads (`isAvailable(window)`), slot-level premium trigger — new in DDD too (the
  interlocutor conceded conferences need different UI/data).
- **The aggregate's "one place" is a dilemma.** Same entity + union inside = the "schema leak" *concentrated*
  in the highest-fan-in class, with old bookings forced through new union code (a conference bug can break
  concerts — lost risk isolation; PFD adds a use case, old path untouched). Separate entities = no
  auto-pickup → a shared interface (= the value object) or duplication (the "clone the system" charge,
  reversed).
- **Stable signature != stable contract.** `release()` now means trim-intervals + derive-availability +
  free-home-seat-for-window; readers that assumed "released -> fully free" are silently wrong.
- **Convergence (the closer):** thin-entity DDD (entity = data + invariants, policy in services) *is* PFD's
  split (value object + use cases); then "rewrite half the system" evaporates equally for both. The
  objection needs a *fat* aggregate.
- **PFD's real win is the frequent axis:** representation change is a tie (both insulate callers); every
  *policy* change (refund, premium eligibility, hold duration) isolates to one use case in PFD vs editing
  the shared entity in DDD. Policy churn >> representation churn in process-rich/invariant-poor LOB.
- **Honest limit unchanged:** invariant-dense domains → a record earns its place; the conference ticket
  earns a *small* one (no-overlap), policy kept out.

This is the objection the section exists to answer — likely the anchor entry, not an appendix afterthought.

---

## 2. Glossary (new back-matter section)

The book uses a precise vocabulary that is currently defined only inline at first use. Add a glossary
so terms are looked-up-able. Seed list (define each in one or two lines, link to its home section):

- **Altitude**, **Telescope**; **Use case**, **Workflow**, **Subsystem**, **System**
- **Trigger** vs **Change driver** (what fires a use case vs what forces its code to change — commonly
  conflated; the glossary should separate them explicitly)
- **Change-driver cohesion**, **Completeness**, **Purity**; **Within-altitude composition** vs
  **Cross-altitude grouping**
- **The six patterns**: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects
- **The four shapes**: `T`, `Option<T>`, `Result<T>`, `Promise<T>`; **Semantic potential**;
  **Parse, don't validate**
- **Data as residue**, **id as seed**, **Accretion** (entity), **Shared primitive**, **Honest limit**
- **State machine / transition**, **Design-out** (the conflict), **Boundary contract**
  (composed-not-invented)
- **Direct** vs **event-based step composition**
- **The recovery triple**: BER / FER / (third)
- External anchors: **Information hiding** (Parnas), **Volatility-based decomposition** (Lowy),
  **Independent Variation Principle** (Loth)

---

## 3. Change-driver *tracking* section (extends `finding-change-drivers-DRAFT.md`)

`finding-change-drivers-DRAFT.md` covers how to *find* a change driver. This adds the missing operational
half: *tracking* which use case answers to which driver, and why that tracking is what makes cohesion
discovery scale.

**The scaling argument (the core):**

- Without tracking, finding cohesive groups among N use cases is a *pairwise similarity search*: for
  each pair you ask "do these two belong together?" That is ~N(N-1)/2 = O(N^2) comparisons, re-run ad
  hoc as the set grows, and every new use case must be weighed against all existing ones.
- With tracking, you *label* each use case with its change driver(s) once — O(N) — and cohesive units
  fall out as the buckets that share a driver key. Grouping becomes a partition/bucket operation, ~O(N).
  Adding a use case is one label plus a drop into its bucket; no pairwise sweep.
- The change driver is the *key* that turns cohesion from pairwise similarity into an equivalence-class
  partition. (This is exactly Loth's IVP read operationally: partition by change-driver assignment.)

**The practical artifact — a change-driver register:** a maintained map of use case <-> change driver(s)
(a simple table/matrix). It does triple duty: (a) it *is* the grouping mechanism (bucket by driver key);
(b) it is the completeness/purity checklist (does this driver's bucket hold all and only its use cases?);
(c) it is confirmable against git co-change (the measure-backward mode already in the draft — co-change
should agree with the labels; divergence is a flag).

**The multi-driver caveat (ties to the draft's adapter point):** a use case may carry more than one
driver (adapter / essential coupling), so it appears in more than one bucket. That is not a defect — it
is exactly where boundaries and mediators live, and the register makes those entries visible as the
seams to inspect. (The premium-auto-buy preemption edge in change #1 is a live example: the conscious
"second driver" decision is a multi-bucket entry that must be named.)

**Payoff framing:** tracking change drivers is not bookkeeping for its own sake; it is the move that
makes decomposition incremental and near-linear instead of a quadratic re-derivation every time the
system grows. It also turns the four-case escalation (change #1) into a triviality: each new use case is
*tagged*, not *re-compared* — premium-auto-buy tagged "premium policy" lands in the premium bucket
without any sweep against the reservation use cases.

**Target home:** Foundations (immediately after / merged with the Finding-Change-Drivers material), or
Architecture Synthesis. Keep SRP-free, consistent with the draft's stance.

---

## 4. Data design — ownership dynamics (expands "Where data comes from") `[PFD core]`

The static picture exists (residue, one owner per field, id-as-seed, accretion, "earns its place",
aggregate-as-fossil). What is thin is the *dynamics* of ownership. Add a subsection ("How ownership
moves" / "Growth by absorption") built on an explicit lifecycle.

**Ownership lifecycle (the spine):** *minted* (the id, by its creating operation) → *accreted* (fields
attach, each owned by the operation that produces it; writes owned, reads open) → *transitioned* (the
state machine is ownership-in-motion: each transition owned by the operation that performs it,
coordinated at one field) → *absorbed* (a spanning invariant appears) **or** *emancipated* (a driver
diverges).

**Absorption — the no-rewrite growth mechanism (most love here).** When a spanning invariant appears over
several pieces, a new owning process *wraps* them as parts: `Owner -> (P1, P2, P3)`. Precise,
non-overclaiming form: the parts keep their write-logic *untouched*; the new parent adds only the
cross-part guard and gains *read* access to the parts. Existing logic moves *inside* the new process as a
sub-step. This is the concrete answer to "rewrite half the system" — state it as that answer.

**Emancipation — the missing dual.** When a field or part gains its own independent driver, it separates
into its own owner. The section currently has the merge direction only; both belong, as a pair.

**The unification (feature this).** That hierarchy of parts *is* the telescope: a part = owned data + its
owning process; a part is a Leaf to its parent. And a spanning data invariant *is* a change driver — so
absorption is altitude-emergence driven by an invariant, the same mechanism as cohesion-driven grouping,
triggered from the data side. One sentence ties "Where data comes from" + "The telescope" + "Finding the
change driver" into one structure: data ownership and process composition are the same thing.

**Editorial:** absorption and "earns its place" are one idea from two angles (process-growth vs
data-structure) — present as one treatment with two views, not two rules. Realized in JBCT via nested
records / composed value objects / a parent+children guarded write; in Aether via the parent CTE.

## 5. Principles to name once (mostly inline in existing sections)

From the DDD debate; each a short, named addition placed where it fits, not a new section.

- **The four-way split** `[PFD core]` — the aggregate *fuses* identity + lifecycle state + representation
  + policy; PFD *splits* them into four independently-varying axes. Proof: the hold-timer survives a
  representation change because it rides the state machine (on the id), separate from representation.
- **Value object vs aggregate** `[PFD + JBCT]` — both encapsulate representation; the aggregate
  *additionally* absorbs policy and becomes multi-driver. Say it so PFD is not read as "rejects encapsulation."
- **Additive vs modificative change** `[PFD]` — new behavior in PFD = *add* a use case (old paths
  untouched, extended rather than modified, risk-isolated); in the aggregate = *modify* the shared class. The safer-regression argument.
- **Derive, don't store** `[PFD -> JBCT/Aether]` — prefer deriving from authoritative facts over storing
  redundant state that can drift ("free" was never a column). Elevate the existing recomputable-value gate
  to a named principle; ties to "can't bribe a derivation."
- **Repository contrast / the leak is an ORM artifact** `[PFD data-as-residue + JBCT no-ORM]` — DDD =
  entity + repository (load/save the whole aggregate); PFD = per-operation persistence of owned fields, no
  aggregate to load. "Schema leaked into code" is a symptom of the aggregate+repository+ORM stack — naming
  this flips the accusation onto that stack.
- **Generalize "design out" for races** `[PFD principle -> JBCT/Aether realization]` — one principle:
  *move contention to a single named coordination point and make the conflicting state unconstructible.*
  Tactics: derive-don't-store, single-writer fields, the state-machine transition (one guarded atomic
  write), declarative constraints (PG exclusion constraint), serialized intake (actor-mailbox/queue per
  entity). PFD states it (extend the recovery triple / a short "designing out contention" section);
  JBCT/Aether realize it. Companion to the Race-Condition-Theater demo.
- **Use-case invocation as a valid trigger** `[PFD]` — a trigger taxonomy at the use-case definition: (1)
  external actor, (2) published event, (3) another use case/workflow invoking it. Without (3) readers
  picture a flat list of UI-triggered use cases.

## 6. The DDD comparison stance (NOT a Rosetta table)

Consensus reached in the debate: *the change magnitude is the same in both approaches; what differs is
where the change is located* — DDD: entity (god-object) + app services + repositories; PFD: use cases.
Build on this fair, steel-manned framing (it survives the strawman charge).

- **It reduces to the cohesion test** `[PFD]` — the god-object co-locates code answering to *different*
  drivers (booking/refund/premium/representation): low cohesion by the book's own test. Use cases
  co-locate by driver. "Where changes are located" *is* change-driver cohesion.
- **No Rosetta table** (decided against, 2026-06-28). There is no clean bijection (aggregate != earned
  record — the aggregate fuses policy), and a table legitimizes DDD's own definitional drift. Replace with
  the **inner-saga diagnostic**: a saga appearing *inside* one service/context is the tell that aggregates
  were cut by *noun* instead of by *transaction* — the same failure the Order/Stock/Catalog example
  already shows. Diagnosis of where DDD constructs *dissolve* and the failure they produce, not
  term-equivalence. `[PFD; ties to finding-change-drivers-DRAFT worked example]`

## 7. Cross-book strategy (shared spine, not shared prose) `[ecosystem: PFD -> JBCT -> Aether]`

Don't copy prose between books (it drifts). Share two things:

- **One principles glossary, owned by PFD, imported by JBCT/Aether.** Promote item 2 (glossary) to the
  *shared spine*: PFD defines each term once; the others reference and realize.
- **One running example across all three altitudes** — the conference-booking set. PFD = the design
  (residue, earned record, design-out); JBCT = the Java (value objects, guarded composition, no-ORM);
  Aether = the runtime (@PgSql CTE, exclusion constraint, serialized intake). The conference ticket *is*
  absorption, so the example carries the data-design story too.
- **Allocation rule:** principle → PFD; Java realization → JBCT; runtime realization → Aether — each
  referencing the PFD principle rather than restating it. (Aether items are content suggestions only;
  those files are another session's — do not edit them.)

## 8. JBCT-side realizations `[JBCT]`

The Java realization of the above, referencing PFD principles (not restating them):

- Value object vs aggregate in Java (non-public constructor + factory returning `Result<T>`; composition
  of value objects = absorption).
- No-ORM / per-operation persistence (the repository contrast; why the schema does not weld to an object).
- Design-out realized: guarded CTE / `Promise` serialization / exclusion constraints.
- **Testing corollary** — single-driver use cases test in isolation and add tests without touching old
  ones; the god-object accumulates the test surface of every driver. Fits the evolutionary-testing material.

---

## 9. Objections answered (positioning register)

Reusable rebuttals to recurring high-level objections (distinct from the technical edge cases in item 1).
Each is channel-tested; the book can preempt them in Closing/Brownfield or a short "Objections" appendix.

- **"Process-first is bottom-up, so it has no vision / helicopter view"** (Dmytro Buhay, 2026-06-30; the
  pyramid allegory). Rebuttal, in order of force: (1) *PFD declares no direction* — bottom-up is the
  critic's imposition; fixing a single direction would be self-limiting, so you may start from the vision
  and descend, from a use case, or from both ends. (2) *The puzzle metaphor requires the helicopter view*:
  seeing assembled-vs-sorted-vs-in-the-box at every step is only possible from above, so the global view
  is the method's precondition and a deliverable (the change-driver catalogue), not something reached only
  at the end. (3) *Vision != method*: a pyramid's vision says nothing about cutting a stone, and a pyramid
  is *built bottom-up* from the base — so even the allegory is vision-on-top, construction-from-below,
  which is PFD's shape; DDD's error is mistaking "draw the capstone" (the finished model) for "start
  building." (4) *Top-down-from-vision has its own failure*: the vision underdetermines structure, so
  descending into a model is Big Design Up Front — a vision-derived model the real processes don't fit.
  (5) *Synergy / added value is not lost* — it **is** change-driver cohesion; the grand strategic vision is
  the enterprise altitude, which PFD honestly takes as an input rather than faking as a model. One-liner:
  *vision top-down, construction bottom-up — that's how every pyramid was actually built.*

Related positioning threads already captured: the **change-locality / four-way-split** consensus (item 6)
and the **enterprise-bound** reframe (shipped in Closing). The DDD-enterprise "strategic level handles the
socio-technical" exchange — interlocutor excluded every concrete item, then conceded the level has limits —
is worth a short paragraph in the same appendix.

---

## 13. The decomposition hub — name it, expose it, generalize it (2026-07-21)

**Source:** design discussion this session (pfd-editor), building on shipped item 3 (change-driver
tracking, now living in `foundations.md`) and the greenfield reframe. Three linked outputs: (A) name +
expose the already-shipped linearization; (B) generalize the attribution side across project/org
contexts (new); (C) a standalone Brooks/parallelism article (in `articles/`, not book prose — pointer
only). PFD is at 2.1.0; this rides the next PFD pass (2.x) with items 5 and 11 unless Part A's naming is
pulled forward (low-risk, additive).

**Naming ruling (user, 2026-07-21):** the triple is named —
- **change-driver register** = the artifact (already named, shipped).
- **driver attribution** = the mechanism. *Attribute each use case to the driver that moves it; group by
  shared attribution.* "Attribution" carries the objectivity: you attribute to an external cause, you do
  not adjudicate a pairwise resemblance.
- **quasi-linear cohesion** = the property — the payoff driver attribution buys.

### Part A — name and expose the linearization (promotion of shipped item 3)

The linearization shipped *inside* `foundations.md` (item 3), unnamed, phrased as a step in a derivation
— which is why readers skim past the single most differentiating claim in the method. No new argument;
naming + exposure + one precision fix.

- **The honest form to attach to the name** (or a skeptic guts the headline): driver attribution replaces
  **O(N^2) *subjective* pairwise cohesion judgments** ("do these two belong together?") with **an O(N)
  attribution pass + a mechanical group-by**. Double win — fewer operations *and* each operation is
  derivable instead of taste. Headline contrast: **quadratic -> quasi-linear.**
- **Why "quasi-linear," precisely** (consistency-lens): attribution is one O(N) pass; grouping identical
  driver keys is O(N) by hash (unordered) or O(N log N) by sort (deterministic). The shipped text says
  "~O(N)" (`foundations.md:327`, the hash view). Name the property **quasi-linear** because that is the
  bound we can *guarantee deterministically* (stable sort by driver key) without assuming hashing —
  naming the guarantee, not the average case, is the method's own discipline. Reconcile the shipped
  "~O(N)" line: keep O(N) as the hash best-case, present quasi-linear as the named guaranteed bound. Do
  **not** inflate to strict "linear."
- **Standardize the term:** the shipped "near-linear" (`foundations.md:196`) becomes **quasi-linear**
  everywhere — one defensible word instead of two informal ones.
- **Expose without dilution** (four moves, not loud repetition): (1) headline the property *once* in the
  intro/positioning — one sentence, "driver attribution makes cohesion quasi-linear," mechanism deferred;
  (2) keep the derivation in `foundations.md` but let it *point forward* to the named property instead of
  being the only place it lives; (3) register both names in the glossary (item 2) and named-principles
  list (item 5); (4) stop — no fourth restatement.
- **Why it's the hub (the argument for promoting at all):** the parallelism claim (Part C) works *only*
  because the register yields a clean partition = Brooks' "no communication among them"; Part B is nothing
  but *how you populate the register*; the recombination-as-original-work defense rests on the assembly
  doing work the parts can't. Three threads, one hub — burying the hub mid-chapter is a structural error.
- **The tradeoff, ruled:** under-selling it as *earned discovery* (let it emerge quietly, so it doesn't
  invite attack on page one) vs headlining it. Ruling: headline it. The book's whole positioning is "less
  art, more engineering" — quasi-linear cohesion *is* the engineering payoff, and hiding the headline
  payoff undersells the thesis. Cure for "invites the skeptic early" is precision (the honest form above),
  not concealment.

### Part B — driver attribution across contexts (new)

The reframe: what looks like "greenfield is PFD's worst case" is one technique — **driver attribution** —
operating over **two independent context axes**, with **three things** varying along them. The book
already says green/brown "work is identical" (`introduction.md:61`); that sentence sees only one axis.

**Two axes:**
- **Project history** (brownfield <-> greenfield): does the *artifact* carry driver evidence? Brownfield:
  git co-change confirms drivers (realized, high fidelity). Greenfield: no artifact history; drivers must
  be *sourced*.
- **Org history** (established <-> new): does *institutional memory* carry it? Established: people remember
  what got rebuilt (recallable). New/startup: no memory; borrow from founder-prior + incumbent evolution.

**Three faces vary along the axes:**
1. **Evidence source** — where the attribution label comes from.
2. **Output form** — what an undecided/mis-owned driver *becomes* (tracks the org axis): an *ownership
   fix* for an established org (ties item 4), an *open strategic question* for a startup.
3. **Error cost** — what being wrong costs. **The load-bearing face** — without it the universal claim
   looks reckless at the thin-evidence end.

**The 2x2:**

| | Established org (memory) | New org / startup (no memory) |
|---|---|---|
| **Brownfield** (git carries drivers) | Classic. Git confirms, people corroborate. Richest evidence. | **Inherited codebase, new team.** Git has the drivers; nobody to ask -> *reading the register builds the memory the org lacks.* (The case the axes surface on their own — the tell the model is real, not greenfield relabeled.) |
| **Greenfield** (no artifact history) | New product in a mature company. No code history, but real domain data + memory. High confidence. | True startup. Borrowed history only. Register = list of unplaced bets. Thinnest evidence. |

**The gradient (the safety net):** evidence fidelity runs highest top-left, lowest bottom-right; **error
cost runs the opposite way** — top-left has mass to restructure, bottom-right has ~ten use cases and the
absorption/emancipation machinery (item 4) makes re-grouping a *transform, not a rewrite*. The two curves
cross: "hardest to attribute" and "cheapest to get wrong" coincide at the same corner — which is what
makes applying the universal technique at the thin end honest rather than reckless.

**Output form, spelled out:** undecided drivers become *ownership fixes* on the established side (who
should own this boundary — Conway/org-improvement feedback) and *open strategic questions* on the startup
side ("you haven't decided pricing authority, so this boundary can't be drawn yet"). At true greenfield
PFD partly stops being a decomposition method and becomes a **readiness instrument**: the register is a
list of bets the founders haven't consciously placed — startup risks wearing a design costume.

**Honest limit (bake in, or a skeptic finds it):** borrowed history (founder-prior, incumbent evolution)
can *mislead* precisely when the startup's whole thesis is that the incumbents' volatility no longer
applies. So it is a **low-confidence prior, marked as such in the register**, not realized data of equal
weight. The residue discipline pointed at your own evidence — the admission strengthens the section.

**Relationship to shipped material:** generalizes item 3 (register) + item 4 (ownership dynamics = the
established-org output form); retires greenfield-as-bottom-up-objection (item 9) into greenfield-as-
context. Additive — nothing shipped becomes wrong.

**Target home:** a short new section — "Attribution across contexts" — in the Foundations back-half (near
the change-driver material) or adjacent to Brownfield. Decision at prose time. Keep additive to
`foundations.md`/`brownfield.md`, not a restatement (that material is already dense — duplication risk).

### Part C — the Brooks / parallelism article (pointer only)

Standalone article in `articles/` (drafted this session), sequel to the shipped reflection piece. Thesis:
use-case decomposition does not contradict Brooks' Law — it satisfies the one condition Brooks named for
partitioning to work (no communication among workers), by driving the communication term toward zero via
driver attribution + stable interfaces; the ceiling is Amdahl, not Brooks; determinism + AI operators
change the *kind* of the communication cost. Book impact: at most a one-line forward pointer from
`foundations.md:220` ("a thousand independent descents") to the article. Series has zero Brooks/Amdahl
mentions (confirmed), so no contradiction risk.

### Salvage from the "rediscovery" thread (one line, not a thread)

The one reusable sentence: *for a mature field, recombination is not the consolation prize of original
work — it is most of what original work is; the test is whether the assembly does work the parts could not
do alone.* Pre-emptive answer to the "this is just Parnas/DDD" review. Home: item 6 (DDD stance) or the
intro positioning. One sentence.

---

## 14. Read-write staleness — the case *Designing out contention* does not name (2026-08-01) — SHIPPED in PFD 2.4.0

**Source:** Rico Fritzsche, *The Command Context Consistency Principle* (2026-07-31), plus this
session's analysis. Rides the next PFD pass. Additive: nothing shipped is wrong, one case is absent.

**The finding.** `foundations.md:269-281` (*Designing out contention*) treats contention as a
**write-write** problem throughout. Its five tactics — derive-don't-store, single-writer fields, the
guarded transition, declarative constraints, serialized intake — all remove a race between two
*writers*. The section's load-bearing sentence is `:78`: *"Every other field has one writer and needs
no coordination at all."*

That is true and it is silent about **read-write staleness**: operation A reads field X, which
operation B owns, decides on the value, and commits after B has changed it. Single-writer ownership
does not protect a read. Neither does design-out, unless the fact happens to carry a unique key.

Four cases, and PFD currently answers three:

| Conflict | PFD's answer today |
|---|---|
| write-write, different fields | single-writer ownership — no conflict by construction |
| write-write, the state field | the guarded transition (design-out) |
| read-write, fact with a unique key | declarative constraint (design-out) |
| **read-write, predicate over a set** | **unaddressed** |

The fourth row is the sharp one: *this guest has fewer than five active bookings*, *total reserved
capacity is under N*, *no reservation overlaps this range*. There is no unique key to constrain, so
design-out has nothing to bite on. Range overlap has an answer (an exclusion constraint); counts and
sums do not. What is left is validating the read set at commit, or a materialized counter row you
lock — which is an aggregate root wearing a different hat, and worth saying so out loud.

**What to add** (one subsection in *Designing out contention*, after the tactics):

1. Name the second kind of contention. A field with one writer cannot be *raced*; a decision that
   *reads* it can still go stale. The tactics remove write-write races; they do not remove
   read-write staleness.
2. Keep the design-out-first stance where the fact is reshapeable. A declarative constraint over the
   thing actually claimed (one row per occupied night) beats read-set validation around it — the
   race is lost by construction rather than detected. This is the existing stance applied to the new
   case, not a new stance.
3. State the honest limit for the fourth row, and that a materialized counter is the fallback with
   its cost named, so the reader is not left thinking the tactics cover everything.

**Convergence note** (home: the change-driver lineage at `foundations.md:190`, or item 6's DDD
stance). PFD dissolves the aggregate on **change-driver** grounds — `:86`, the aggregate fuses
identity, lifecycle state, representation and policy, which vary independently. Fritzsche dissolves
it on **concurrency** grounds: the aggregate is a static consistency boundary, while the facts a
decision reads change from command to command. Independent arrival at one target from a different
axis, and the same shape as Parnas / Löwy / Loth converging on change drivers. Worth one sentence,
not a section.

The complementarity is the useful part and belongs in whatever we write publicly: **PFD's ownership
discipline removes most of the contexts his principle has to guard, at design time. What survives it
is exactly the read-write staleness he addresses and PFD does not.** His approach is also
retrofittable to a schema nobody designed this way, which PFD's is not.

**Vocabulary parallel, noted not adopted.** His *Application State* and PFD's accretion model are
the same refusal — facts keyed to identity with an owner, rather than an object loaded and saved
(`:76`, *"a coordinate, not an object"*). His *context* is a read-set snapshot; PFD's accretion is an
ownership map. Same substrate, different question asked of it.

---

## Release scope & versions

**Historical — this block planned the 1.3.0 round and is kept for the record.** Each book's version is
single-sourced from its own `CHANGELOG.md` top entry; as of 2026-08-01 that is **PFD 2.4.0** and
**JBCT 4.3.1**, both well past the targets below. Do not read the numbers here as current.

Original target: **PFD 1.2.0 → 1.3.0**, **JBCT 4.1.2 → 4.2.0** (minor — feature additions). PFD-side:
items 1, 3, 4, 5, 6 (Foundations / new sections), 2 (back-matter glossary = shared spine), 7
(cross-book). JBCT-side: item 8. Deferred / low-priority: dialogue format for the edge-cases section,
blast-radius metric.
