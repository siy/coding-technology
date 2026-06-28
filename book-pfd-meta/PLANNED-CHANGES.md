# PFD — Planned Changes (backlog)

> Capture of planned/queued book changes. Not shipped until folded into `book-pfd/*.md` and
> recorded in `book-pfd/CHANGELOG.md`. Manuscript em-dash style applies once moved into the book;
> notes here are internal.

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
  untouched, open-closed, risk-isolated); in the aggregate = *modify* the shared class. The safer-regression argument.
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

## Release scope & versions

Target: **PFD 1.2.0 → 1.3.0**, **JBCT 4.1.2 → 4.2.0** (minor — feature additions, single-sourced from each
`CHANGELOG.md` top entry). PFD-side: items 1, 3, 4, 5, 6 (Foundations / new sections), 2 (back-matter
glossary = shared spine), 7 (cross-book). JBCT-side: item 8. Deferred / low-priority: dialogue format for
the edge-cases section, blast-radius metric.
