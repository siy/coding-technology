# Gap inventory — resume after the 2026-07-04 pause (2026-09-02)

`verified_at: v1.0.0-rc3` → resolved commit `c67664bd9a104581a54172cf824d7766a5713bcf`, tagged
2026-09-02 21:41:37+02:00. **Methodology note:** a companion tag,
`v1.0.0-rc3-checkpoint-pre-curation`, holds a pre-squash history for the same tree — release
curation collapsed 743 commits since rc2 into 11 subsystem commits + 20 replayed `know:` commits +
1 docs commit (32 total), tree-hash-verified against the checkpoint independently of the agent
that built it (`oss/internal/handover-2026-09-02-cto-session7.md:26-32`, §1a; corrects an earlier,
unverified "~512 into 8" estimate from my own ad hoc commit count). `git merge-base --is-ancestor`
against a pre-curation SHA can therefore report "not an ancestor" for code that is genuinely
present; verify by path + blob content (`git show <sha>:<path>` diffed against the tag), not by
commit-graph ancestry, across the curation boundary. One capability below (the provisioned-step
mechanism) was checked this way and confirmed byte-identical at a moved path.

## 1. `‹AUDIT›` markers

None exist. `grep -rn '‹AUDIT'` across all of `book-aether/*.md` returns zero hits. The only
occurrence of the literal string is `BOOK-PLAN.md:3`, describing a convention the manuscript
never adopted — the plan's own status line is itself stale. The functional equivalent is a
different, already-used convention: inline `> _Status: ...` blockquotes. Five exist:

1. **`part5-operate.md:115-121`** (`#434`, mixed-version rollout). Asks whether cluster-binary
   version negotiation has shipped. Closing evidence: no `#434` entry anywhere in
   `CHANGELOG.md` at rc3 (checked, none found) — still open, banner is accurate as written. **S**
   (re-verify at next pin only).
2. **`part3-playbook.md:1104-1112`** (Module D opener: entity shipped-ness, timer bound, cold-
   restart bound). Entity-deployed claim holds (§3 below). Timer claim is now **stale** (§3.1).
   Cold-restart bound (`#349`) was not re-checked this session. **M**.
3. **`part3-playbook.md:1664-1668`** (S1, workflow signals resolved 2026-07-04). `CHANGELOG.md:471`
   pairs `#351` with "`#345` I4" landing the same day — unclear whether I4 put any workflow/saga
   code on a deployed node, which would change this blockquote's "pinned design, no runtime code"
   framing. Needs a dedicated check (owner Q2). **M**.
4-5. **`part3-playbook.md:1690, 1694`** (Modules E/F scaffold banners). No claim to falsify —
   intentionally unwritten. **L** each (full module drafting, already tracked in the plan).

Also functioning as a status marker, though not a blockquote: **`appendix-a-api-reference.md`'s**
pin line ("read from Pragmatica source at `release-1.0.0-rc3` head `e123caafb` (2026-08-26)") is
now the single most out-of-date marker in the book — see §3.2.

## 2. The two gated audits

**A — real slice contract + drift.** Plan expects a diff of the author-facing `@Slice` contract
against source. `aether/slice-annotations/src/main/java/org/pragmatica/aether/slice/annotation/Slice.java:13-15`
at rc3:
```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Slice {}
```
matches `appendix-a-api-reference.md`'s "The slice contract" block exactly — **confirmed, no
drift**. Corner found in passing: `aether/docs/reference/slice-api.md` (a product doc, not the
book) carries a wrong copy claiming `SOURCE` retention — a product-doc defect, not a book one; the
book's "source is truth, docs are navigational" policy (`BOOK-PLAN.md` §4) already protected it
here. Residual for a fuller pass: the appendix's other blocks (`Cause`, `ResourceQualifier`,
`HttpClient`, `StreamAccess`) weren't independently re-diffed beyond what §3 covers; cheap to do
next session using the same path+blob method.

**B — spine-app assessment.** `examples/ecommerce/{inventory,payment,fulfillment}` **exists** in
pragmatica at rc3 — three slices, `resources.toml`, `routes.toml`, per-service schema migrations,
and a full k6 suite (steady/ramp/spike/per-node). It matches the plan's decided domain (reserve
inventory → charge payment → arrange shipping) closely enough to be the reference, and the
July-9 probe already cited it (`examples/ecommerce/inventory/.../InventoryServiceFactory.java` as
"the real reference artifact"). But `BOOK-PLAN.md` §6's prose — "a fresh app built incrementally
... start from an empty Aether project" — never acknowledges this existing app, which is an
inconsistency inside the plan itself, not just staleness against source. `examples/banking` and
`examples/catalog` also exist and are already cited elsewhere in the plan (banking's `@WithCache`
for interceptors). `~/IdeaProjects/ticketing` is a **separate** git repo, the release-verification
demo per the workspace map, not a candidate spine; its purchase flow (rc3's 2026-08-31
purchase-path fix) is domain overlap, not evidence of intent. Owner decision needed: does the book
build a from-scratch teaching app and treat `examples/ecommerce` only as an answer key (the
`jbct-loan` pattern), or narrate directly on top of it? (Owner Q1.)

## 3. Stale claims

**3.1 — Entity timers now fire; three sites in the book say they don't.**
`part3-playbook.md:1108-1109`, `part3-playbook.md:1681-1682`, and
`appendix-a-api-reference.md` ("Timers are durably recorded but not yet fired on a deployed node
(#351) at this pin") all assert non-firing. Contradicted by `CHANGELOG.md:471` — "### Added
(2026-08-27 — #351 / #345 I4: durable entity timers, end to end)" — and by production wiring:
`aether/node/src/main/java/org/pragmatica/aether/node/AetherNode.java:3995,6079` registers
`EntityTimerDriver` at node boot. Proposed correction (all three sites): "Entity timers are
durably recorded and fire on a deployed node as of 2026-08-27 (#351); the interval is a documented
1-second constant, not a config knob." Caveat worth carrying forward: the product's own
`aether/docs/reference/guarantees.md` summary-matrix row 31 still reads "PLANNED (timer declined
today...)" — the product doc lags its own CHANGELOG and code, so this correction should cite code
and CHANGELOG, never that row, and the lag is worth a separate flag to the CTO.

**3.2 — Appendix A's pin is six days behind the tag it claims to represent.** States "read from
Pragmatica source at `release-1.0.0-rc3` head `e123caafb` (2026-08-26)"; the resolved tag is
`c67664bd9a1` (2026-09-02 21:41), after roughly a dozen substantive tickets: `#700`/`#701` entity-
checkpoint fixes, `#674` consensus metrics reaching Prometheus, `#712` slice jars now shipping
manifest-declared message/event classes, `#692`/`#694`/`#644`/`#702` assorted node fixes, `#496`
GA-audit closing two more surfaces clean, `#660` Rabia cold-start fix, a `#558`-family of
cluster-config fixes, `#616` durability audit, `#321`'s SemVer ruling plus a new
`versioning-and-compatibility.md`, a docs "Phase-1 structural cut" stale-claim sweep across the
product's own architecture docs, and `#634`'s WAL fsync-injection surface. Proposed correction:
replace the pin with the resolved SHA and date, then re-diff the appendix's remaining blocks
against this six-day range — §3.1's timer sentence is the one concrete casualty found this
session; others are plausible, not yet confirmed.

**3.3 — `BOOK-PLAN.md` §6 doesn't know its own decided spine already exists in-repo** — covered in
§2B; a planning-doc gap, not chapter text, but one that will mislead the next drafting session.

**Verified clean, not to re-litigate:** zero residual `Aspect` mentions in `part1-no-magic.md`
(the 2-arg seam rewrite from the July-9 probe is complete); zero loan-domain leakage in any
chapter (`grep -ln 'loan\|Loan' *.md` empty); the `#434` banner at `part5-operate.md:115` is still
accurate (no CHANGELOG entry); the `@Slice` contract block matches source exactly (§2A).

## 4. Corners not covered

- **Durable pub/sub tier (`#386`)** — shipped, `guarantees.md` row 22a: per-partition order,
  replicated stream, at-least-once with a group-attributed DLQ for `durability = "durable"`
  topics. `appendix-a-api-reference.md`'s Pub-sub block and Module B's messaging chapter describe
  only the ephemeral, at-most-once default. → Module B.
- **Management-API surfaces absent from Part V**: A/B tests (`GET/POST /ab-tests*`), cluster
  migrate (`POST /cluster/migrate`), DHT replication map (`GET /dht/replication-map`), runtime
  log-level control (`POST /logging/levels`), alert injection (`POST /alerts/inject`),
  controller/evaluate (`POST /controller/evaluate`). → Part V, "reading what the cluster reports,"
  or a new ops-reference appendix.
- **Consensus load metrics reaching Prometheus (`#674`)** — Part V's metrics section names
  `/api/metrics/prometheus` already; could add that consensus load is now part of that surface.
- **The independent versioning taxonomy** (`versioning-and-compatibility.md`: four separate
  surfaces — release, wire envelope, slice HTTP, management HTTP — anchored by `#321`'s SemVer
  ruling) has no chapter home; Module F (versioned-message evolution) is still a bare scaffold and
  is the stated fit.
- **WAL fsync-failure injection + tri-floor retention operator surface (`#634`)** — a chaos-testing
  capability with no mention. → Part IV's Forge/chaos section, or Part V operator reference.

## 5. Proposed drafting order (smallest verifiable unit first)

1. Fix the three entity-timer sentences (§3.1) — mechanical, source-backed, no design decision.
2. Re-pin `appendix-a-api-reference.md`'s descriptor to the resolved SHA and re-diff its remaining
   blocks against the six-day delta (§3.2) — bounded, mechanical.
3. Update `BOOK-PLAN.md` §6 to record `examples/ecommerce` as existing, pending the owner's
   answer to Q1.
4. Draft Module B's durable-pub/sub subsection — the largest §4 item, but self-contained and
   already within the plan's existing scope for that module.
5. Everything else in §4, plus the `#345`/I4 recheck (§1 item 3) and `#349` (§1 item 2) — hold for
   a dedicated pass once Q1-Q3 are answered, to avoid redoing drafting choices.

**Owner questions:**

1. Spine app: build "orders" from scratch as planned, or narrate directly on `examples/ecommerce`
   and promote it from answer-key to primary source?
2. Does `#345`'s "I4" milestone (landed with `#351`, `CHANGELOG.md:471`) put any workflow/saga code
   on a deployed node, or is it entity-infrastructure only? Changes whether Module D's
   "zero runtime code" framing for workflow/saga still holds.
3. Teach the durable pub/sub tier now (shipped, source-verified), or hold for an example project,
   matching the plan's existing convention for `#339`/`#198`?
4. Is the checkpoint/curation tag split a one-time release step, or something later sessions need
   to keep checking for? It broke a naive ancestry check this session.
5. Priority: land the two P1 stale-claim fixes before or after the next full probe tick, given rc3
   was cut mid-session today?
6. Who re-verifies `#349` (full-cluster cold restart, cited at `part3-playbook.md:1109`) — not
   re-checked this session?
