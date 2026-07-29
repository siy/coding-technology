# Engagement log — article "How Architecture Emerges" (2026-07-06)

Working file: assessments + ready-to-paste reply drafts. Interlocutor profiles & strategy: memory `project_pfd_interlocutors.md`. Validation log: `BOOK-SCOPE.md`.

## State

- Published 2026-07-06: dev.to (https://dev.to/siy/how-architecture-emerges-1b9), Medium (https://medium.com/@sergiy-yevtushenko/how-architecture-emerges-2626fca4fe52). LinkedIn announce posted (both links). Medium has cover image + fixed table; dev.to cover still pending (watch wide crop).
- Day-1 signal: Yannick L. (IVP) endorsement repost + 3 Zenodo papers; LinkedIn pushback (Galyen); Telegram arch chat: 3 substantive critiques, all module→article compression losses mapping to planned book content.
- Caveat on record: day-1 engagement is from the existing orbit; the go/no-go signal is cold readers (dev.to traffic, Leanpub sample downloads) over 1-2 weeks.

## Ready-to-paste replies (post tomorrow, 2026-07-07)

### 1. Yannick L. (LinkedIn, under his repost) — convergence, precise nuance

```
Thank you, Yannick. The convergence is worth spelling out precisely. The eleven questions elicit exactly the part of your "relevant causal domain knowledge" that most methods leave implicit: the qualities. Concepts and business rules alone underdetermine the architecture. The same domain with different priced qualities produces entirely different systems, which is why the post opens with two teams that share nothing and neither is wrong. Your side reaches "structure follows the domain's change drivers" from theory, PFD reaches it from a derivation procedure. Independent convergence from two directions usually means the underlying observation is real. I will read the three papers carefully.
```

### 2. Vania Leyn (Telegram) — scope composition + axis-completeness criterion

```
Позиція на осі визначається не для системи в цілому, а для конкретного скоупу: підсистеми, класу даних, шляху. "distributed + sharded + per-component + polyglot" - це не одна позиція на одній осі, а композиція атомарних позицій різних скоупів. Саме тому в повній версії enterprise-профіль отримує вектор на підсистему, а не на систему. Стаття стиснула це до двох слів у третьому правилі (narrowest scope), і стиснення ви помітили правильно.

Стосовно кількості осей: критерій входження такий - вісь потрапляє в список, якщо дві системи з різними відповідями мусять структурно відрізнятись вздовж неї ще до вибору технологій. Движок бази під патерни доступу цей тест не проходить: це вже вибір страви з меню, а не ресторану. Архітектура тестування теж: це scaffolding навколо системи, а не структура самої системи. Але якщо у вас є вимога, яку жодна комбінація шести осей плюс вибір технологій не покриває - назвіть її, це найцінніший тип зауваження.
```

### 3. Max Grom (Telegram) — the SEI gap (QAW elicits, ATAM evaluates, derivation generates)

```
Повертаючись до SEI: QAW - це аналог елісітації, ATAM - оцінка вже готового кандидата. Зверніть увагу на дірку між ними: звідки береться сам кандидат? У SEI генерація архітектури лишається експертній інтуїції. Деривація закриває саме цю дірку: кандидат не приноситься на оцінку, а виводиться. ATAM після цього стає перевіркою виводу, а це корисна, але вже інша робота.
```

### 4. Andrii Kurdiumov (Telegram) — money is first-class in the full version

```
Стосовно грошей: у повній версії cost - повноцінний вхід (стеля або бюджет на операцію), а кожна позиція на осі оцінюється переліком постійних механізмів, які вона додає, тобто вартістю підтримки, а не створення. Прикладів розрахунку вартості обслуговування буде більше - запит почутий і він в плані.
```

### 5. James Galyen (LinkedIn, round 2) — analysis + draft below

**His round-2 argument, unpacked:**
- "Orchestration uses a conductor, aka a single database" — factually wrong: an orchestrator is a coordinator component; it may persist state in a DB but is not one. Choreography = events + local transactions + compensations, not "free for all."
- Saga style (orchestration vs choreography) is not even one of the six axes; the article's two teams differ on deployment/substrate/storage/persistence before any saga shape is chosen. He's fighting on a field the article isn't on.
- "Single database scaled across many servers" IS a distributed database — the distribution moves inside the product boundary, it doesn't disappear. Judo: that's literally the ledger's "distributed shared store," and the derivation lands exactly there for the strictly consistent data class (booking/money). On that axis he agrees with the derivation without noticing (second time — round 1 his instinct was rule 1).
- "Partitioned by user" is the wrong key for ticketing and the most concrete error: contention is per SEAT, not per user. Two buyers fight for one seat; partitioned by user they land on different partitions and the only invariant that matters becomes cross-partition. The partition key falls out of the invariant scope — a derivation step, demonstrable.
- Document store for booking: money + seats + orders is a relational/transactional shape; multi-document strictness is exactly what document stores make you work for.
- His concession paragraph ("I can kind of think of a scenario...") collapses his own universal claim: once scenarios exist, the question is only whose answers hold — and the enterprise profile's answers (contractual 200ms P99 multi-region reads, sovereignty, regulator-replayable price history, 99.99% read path) are those scenarios. "The difference is technical only" fails against contractual/legal commitments: the domain can be modeled either way, the commitments cannot.
- Tone: he opened with "you don't understand atomicity/actor model." Reply stays calm, concrete, no bait taken.

**Draft reply — POSTED 2026-07-06 (user's trimmed version, as it went out):**

```
The partition key gives it away. Ticketing contention is per seat, not per user: two buyers fight for one seat, and partitioned by user they land on different partitions, so the one invariant that matters becomes cross-partition. The partition key falls out of the invariant scope. That is exactly the kind of decision the derivation makes explicit instead of leaving to taste.

A single database scaled across many servers is a distributed database. The distribution does not disappear, it moves inside the product boundary, where somebody else engineered the consensus. And that is fine: for the strictly consistent data class (bookings, money) the derivation lands exactly there - buy a distributed store with real transactions rather than hand-roll coordination. On that axis we agree.

What forces the rest of architecture is pure business commitments: contractual 200ms P99 reads served in-region across several regions, data sovereignty that pins records by law, regulators requiring replayable price history.

One correction: Saga style is not one of the six axes in the article - the two teams differ on deployment, substrate, storage and persistence before any saga shape is chosen.
```

(Cuts vs draft: speed-of-light aside, "commitments cannot" punchline, orchestrator-vs-database correction — the last a good de-escalation call.)

**Galyen round 3 — POSTED 2026-07-07.** His position converged to "not much difference if both use a (possibly distributed) DB; keep everything flexible; P99 matters only in production." Reply (trimmed by user, "We are converging" opener dropped, stray "We" removed before posting): transport-transparency agreement first ("packaging decision instead of an architecture decision"), then the two limits — "First, where data lives and what coordinates it are commitments... Flexibility is bought, not declared." and "Production proves you met the number. Physics decides whether you can." — closing with the anti-waterfall line ("Derive the commitments you cannot defer, defer everything else."). Quotables captured in memory `project_quotable_lines.md`; his convergence arc in `project_pfd_interlocutors.md`.

**Galyen round 4 — POSTED (user-confirmed 2026-07-12). Arc complete = FIELD-EVIDENCE exhibit 1.** His round 4: (a) codegen (nswag/quicktype) can generate remoting from OpenAPI, "tools just need expanded, P99 path supported"; (b) monolith deployment with microservice/hexagonal internals — now EXPLICITLY at the transport-transparency position; (c) proposes a "team 3" seniority ladder (novice=monolith, mid=microservice, senior=hybrid), "experience part of the tooling"; (d) job-security theory for why no open-source scaling template exists. Reply structure: agree on seams+codegen (makes packaging deferral honest) → the limit: OpenAPI spec carries interface shape, not commitments; "P99 path" can't be a generator flag because P99 is spent in round trips, not code; "Tooling can generate everything except the commitments" → ladder correction: article's teams had same seniority, different commitments; stronger form of his own point (same commitments → same landing regardless of seniority = derivation not taste) → template theory: templates hard-code answers, inputs differ per business, reference architectures forked beyond recognition; cloud lock-in = paying when your commitments stop matching their assumptions; "The reusable artifact is not the template. It is the procedure that produces one." — closes by crediting his "experience part of the tooling" phrase, one layer up. Deliberately skipped: AI-builds-tools aside, the seniority labels themselves. Shortened to 124-word thesis form per user (their LinkedIn style: short thesis, minimal explanation; "experience part of the tooling" credit line cut). Final version on clipboard 2026-07-09, plain ASCII.

### Yannick L. — personal DM 2026-07-09 (PFD book read-back; reply SENT, user-confirmed 2026-07-12 — awaiting his refinement list)

**His message (mid-read, apologized for not being done):** deepest endorsement to date. Key content: (a) PFD's value for business analysts "probably even more than for developers"; (b) apart from EPC he's "never seen a set of fundamental concepts as well thought" for business analysis; BPMN2 "quite poor" by comparison — PFD shines on decomposability with a limited primitive set + systematic methodology + per-level SLO capture; (c) his IVP/cohesion work converges: "gaps have to be filled at knowledge level directly, not just at software level"; "developers are used to fill the gaps - that's even what design patterns fundamentally are" (quotable, HIS line); (d) "I do think this thing will fly. Maybe after some refinements, but I have no doubts about it."; (e) **open questions: what qualifies as a Use Case, what qualifies as a workflow** — first cold-reader-confirmed clarity gap (glossary: both definitions lean on "one outcome"; the discriminator — patterns inside vs use cases inside; workflow owns the spanning state machine — is never stated as a rule).

**Reply drafted (189 words, on clipboard, plain ASCII):** no-apology-needed + EPC/BPMN2 comparison acknowledged → gaps point affirmed (design patterns = institutionalized gap-filling; IVP and PFD arrive from two sides: cohesion/knowledge embodiment vs process structure) → one-line boundary answer (use case = one trigger one outcome, decomposes into patterns not business operations; workflow = composes use cases, owns spanning state; "if a step is independently triggerable, you are looking at a workflow") + "gap in the book, not in your reading, keep flagging" → asks for his refinement list when done. Left out deliberately: any claim of reading his Zenodo papers (still unread our side — user to decide whether to add a truthful "next on my list" line). Pending: file UC/workflow gap in book-pfd-meta/PLANNED-CHANGES.md (user approval asked).

### Loïc Veyssière (LinkedIn, 2026-07-10) — no reply needed, harvest

Technical Architect, 3rd+. "Great breakdown, and I fully share the approach. What strikes me is the implication: once the target becomes computable, it stops being what makes a good architect. The real differentiator is the transformation path. Deriving the destination is necessary, but designing the journey from the existing system, with legacy, constraints and real teams, is perhaps where architects truly earn their value." — Unprompted statement of the book's Part III thesis; demand signal that elevated ch. 10/11 in the prep queue (BOOK-PLAN 2026-07-10). Candidate ch. 10 epigraph (ask permission at ship). User's meta-read on this comment class: people want deterministic derivation even simple/incomplete, no objections raised; "architectural debates just annoy everyone" — drove the material-first ruling (article 2 parked).

### Poltorak — architecture-book approach (user's own version on clipboard 2026-07-11, not yet sent)

Decision-F outreach, moved earlier because his Metapatterns transitions catalog gates the ch. 10 edge list. User rewrote my draft in their voice: book framed as PFD continuation / expanded architecture-synthesis module (no validation flex); migration as pathfinding, deltas keep the system operable at reasonable cost/duration; catalog = edge list; permission-ask with attribution ("якщо ти не проти"); soft review ask (discuss the chapter before it enters the book). My two fixes accepted onto clipboard: punctuation + "з дизайну ТА ВИМОГ" (guards against the domain-determines-architecture poke). PFD testimonial/coupons thread deliberately excluded (separate conversation).

**CONFIRMED 2026-07-11** — Poltorak agreed (catalog use + chapter discussion) and **asked for potential issues/corrections in his book if we find any** (standing obligation, also recorded in interlocutor memory). Feedback reply (batch 1) SENT, user-confirmed 2026-07-12 — standing obligation continues, send further findings as found. Content: no factual errors found; four structural observations from the extraction (CH10-EDGE-LIST.md mapping notes): (1) Prerequisites gate destination fitness, not transit operability — "during the transition" field would be the highest-value addition; (2) Cons lists mix three cost kinds (always-on / lost-flexibility / new failure modes); (3) reversibility never an explicit field — reconstructable from paired reverse evolutions with asymmetric costs + the three independent "ratchet" asides, which we cite as field corroboration of F6 (told him so); (4) CQRS/event-sourcing only as "further steps" pointers, no own Prerequisite/Cons — the two most over-bought transitions. Closes with offer to show him our transitions table when ch. 10 drafts.

## Ship permissions pass (2026-07-12) — ALL THREE SENT (user-confirmed 2026-07-12)

User ruling 2026-07-12: no waiting on external feedback loops. These are courtesy/permission notes; the book proceeds regardless. All plain ASCII, dash-safe; Poltorak's in Ukrainian.

1. **Veyssière — ch. 10 epigraph ask (LinkedIn DM, English). SENT → GRANTED same day** ("Absolutely, please feel free to use it" + asked to read the chapter). Epigraph inserted at ch. 10 head (manuscript 0.3.5); chapter excerpt built (`architecture-synthesis-ch10-pathfinding-excerpt.pdf`, 3 pp, DRAFT-watermarked) for his read; thank-you reply drafted to clipboard.
2. **Poltorak — acknowledgment + credit wording OK (Ukrainian, ти). SENT.** Explicitly non-blocking; wording changes invited.
3. **Loth — acknowledgment + the References "note on one absent citation" shown verbatim (English DM). SENT → REPLIED 2026-07-13:** warm (hearts), explicit guidance "keep it simple, don't overdo it... don't overstate or assume anything until my work is more stable" = license/preference for minimal theory-characterization (NOT removal — acknowledgment itself welcomed). **Acted on same day (0.3.6):** References note simplified — proofs-audit clause removed, his own under-development framing is the stated reason, readers invited to judge the relation themselves. Final wording sent as FYI, explicitly no-reply-needed — **he replied anyway 2026-07-14: "many thanks for the mention... I think it's good like this =)". SETTLED, explicit approval on the printed wording.** Acknowledgments paragraph unchanged (its convergence claim originates in HIS 07-09 DM).

## Tomorrow

1. Post replies 1-4 after your read-through (all plain ASCII, Ukrainian ones dash-safe). (Reply 5 to Galyen: POSTED.)
2. dev.to cover image (watch the ~2.4:1 crop on the crystal spike).
3. Check cold-reader metrics baseline: dev.to views, Medium stats, Leanpub sample downloads.

## Follow-up track — preempt the "prove it" challenge (agreed 2026-07-06)

Context: day 1 produced zero empirical challenges ("does it work?") — all critiques were structural (axis set, question set, SEI). Partly the worked-example effect (demonstration shifts the burden: attackers must name a step, every step cites its input), partly weak evidence (silent failures don't post; venues were the warm orbit; most self-tests land on the degenerate case — internal system → everything inert → modular monolith — confirming but not discriminating). Don't wait for the challenge from a cold audience; take it away first:

1. **Invite counterexamples explicitly.** Comment/short post: "Run it on your system; if you get an absurd vector, bring it — the most valuable feedback there is." Converts silent failures into reports; the Poltorak pattern (adversarial volleys → PFD Edge Cases chapter) deliberately re-run for the architecture material. Incoming counterexamples feed the book's worked-example register.

**Invitation drafts (2026-07-06, plain ASCII). LinkedIn version: POSTED 2026-07-06. Telegram version: pending.**

LinkedIn (standalone follow-up post; also works as a comment under the original):

```
A follow-up to the architecture derivation post.

Nobody has yet asked the question I expected most: does it actually work outside the examples I picked?

Fair question. Here is an open invitation instead of an answer.

Run it on your system. Answer the eleven questions honestly, walk the six axes with the three rules, and compare the result with what you actually run.

Three outcomes are possible:

1. The derivation matches what you built. Good: now you have a written justification for every axis position, and you can see the positions that no answer forces.

2. The derivation disagrees, and after checking you side with the derivation. Uncomfortable and useful.

3. The derivation produces something absurd. This is the outcome I want to hear about most. Bring the answers, the vector it produced, and why it is wrong. A method improves on counterexamples, not on applause.

Article: https://dev.to/siy/how-architecture-emerges-1b9
```

Telegram (Ukrainian):

```
Відкрите запрошення: проженіть деривацію на власній системі. Одинадцять питань, шість осей, три правила, і порівняйте результат з тим, що у вас реально працює.

Можливі три результати:
1. Збіглось: тепер у вас є письмове обгрунтування кожної позиції на осях, і видно позиції, яких жодна відповідь не вимагає.
2. Не збіглось, і після перевірки ви погоджуєтесь з деривацією. Незручно, але корисно.
3. Деривація видала абсурд. Саме це мені найцікавіше: принесіть відповіді, отриманий вектор і пояснення, чому він хибний. Метод покращується контрприкладами, а не оплесками.
```
2. **Blind derivation of famous systems** — **DONE, all three PASSED** (SO / Shopify / Discord; writeups in `BLIND-DERIVATION-*.md`). **Article 2 ready for publication: `articles/architecture-derived-blind-test.md`** ("Three Famous Architectures, Derived Blind").

## Article 2 — publication checklist (prepared 2026-07-07, NOT published)

- [x] Draft finalized (bulleted step-by-step derivations, Q/R citations per step, toolkit recap, intuition-caught framing for the SO miss). LGTM'd by user.
- [x] Cross-poster dry run clean (title/H1 match, 4 tags, 15,964 chars). **No markdown tables anywhere** — Medium-safe by construction this time.
- [x] No canonical_url in front matter — deliberate: avoids the dev.to uniqueness rejection that hit article 1. Set per-platform later if the article gets a pragmatica.dev home.
- [ ] Cover image — the one missing asset. Same crystal visual language as article 1 would start a series identity (suggestion: same field of cubes, but three distinct crystal structures emerging — three systems, one process).
- [ ] Flip `published: false` → `true`, then: `article-cross-poster post -t devto,medium articles/architecture-derived-blind-test.md`
- [ ] Medium post-publish: add cover image at top in editor (no table fixes needed this time).
- [ ] dev.to post-publish: set cover via dashboard (mind the ~2.4:1 crop).
- [ ] Commit to repo AFTER publication (repo is public — pushing early = publishing the text; article-1 pattern: commit followed publication).
- [ ] LinkedIn announce (draft below), links added after publication.
- [ ] Consider: article-1 dev.to comment linking to article 2 ("the test happened") to route existing readers.

**LinkedIn announce draft (plain ASCII; links to be added after publication):**

```
Last week I claimed architecture can be derived from answers instead of chosen by taste, and invited counterexamples.

An invitation is not a test. So here is one: three famous systems that publish their numbers. Stack Overflow. Shopify. Discord. I derived their architectures from the published answers alone, every step citing its input, and only then compared with what they actually run.

Result: three for three, including the counterintuitive parts. The Stack Overflow derivation refused the read replicas that general intuition demands: their store was 40:60 read:write and the whole database sat in RAM, so the only replica serves failover. The method caught the wrong assumption.

Two things showed up in all three systems:

Contention is never solved by sharding. Shopify absorbs flash sales with admission control at the edge. Discord absorbs hot channels with request coalescing in front of the store. Same rule, write side and read side: one seat has one winner, one partition has one home.

Team size never presses deployment topology. Four engineers derived to a monolith. Fifteen derived to a monolith. A thousand plus chose a modular monolith on purpose. What presses is release-cadence divergence and blast radius, never headcount.

Dev.to: <link>
Medium: <link>
```
