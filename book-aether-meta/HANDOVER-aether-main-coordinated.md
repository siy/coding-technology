# Handover — Aether book (aether-main-coordinated writer, 2026-07-21)

Session identity: `aether-book`, coordinated by the aether-main lead. Task: owner
LIFTED the 2026-07-04 prose pause with instruction **audit-then-write**. Run the gating
real-slice-contract + drift audit first, then resume prose on CLEARED sections only.
**Supersedes nothing** — augments `HANDOVER-2026-07-12.md` + `PROBE-2026-07-17.md`.
Checkpoint written because the session is terminating; work below is IN THE WORKING TREE,
not reverted, not committed.

Read order to resume: this file → `PROBE-2026-07-09.md` (P1 punch list) →
`PROBE-2026-07-17.md` (ticks 2-4) → `aether-book-voice.md`.

---

## 0. 2026-07-24 RUN — latest state (read this first, supersedes stale bits below)

Resumed under the aether-main lead's NEW mandate: gating audit of every install/deploy/
getting-started claim + the streaming product→book sync. Not the old P1 punch list (the
2026-07-23 session already applied P1.1 factory-seam / P1.3 pub-sub / item-19 entity-HA —
confirmed present in the tree this run).

**Git reality corrected:** `book-aether/` is now TRACKED + COMMITTED + CLEAN (manuscript
`7199276` is reachable from `main` HEAD AND in `origin/main` — NOT unpushed/at-risk; the
memory note "push HELD @7199276" is stale). I edit the working tree only, no commits/pushes.

**AUDIT DELIVERED to the lead (SendMessage, 2026-07-24).** Two headlines:
- Install/deploy: the book teaches NONE of the broken cold-path commands (no install.sh /
  run-forge.sh / deploy-prod.sh / aether cluster bootstrap / --blueprint / /data/aether /
  jbct init anywhere). part2 = interface+unit-test; part4 Forge + part5 deploy = TODO stubs.
  Forward-looking only: write those stubs from the dry-run transcript AFTER #510–515 land
  (none landed). Exposed conceptual claims flagged GS-2..GS-4 (WATCH, no change now).
- Streaming: two silent-wrong-state traps.
  - **S1 (#507 round-robin) — APPLIED.** part3 `partitions` prose (~626): added an additive
    honesty caveat — @PartitionKey unwired, publish() is round-robin, default 4 partitions,
    so per-order ordering across a multi-partition stream is NOT available; use `partitions=1`
    for whole-stream per-key order until key routing lands. Deletes no existing prose.
  - **S2 (#488 dangling consumer) — APPLIED** (lead green-lit 2026-07-24 with constraints;
    #488 independently re-confirmed by lead vs handover §2b known-members list). part3:602-641:
    added a surgically-removable banner `<!-- BANNER:stream-declarative-consumer-488 status:rc3
    remove-when:#488-wires-delivery -->` (grep that marker to pull it when #488 lands) stating the
    declarative `@OnOrderEvent` consumer registers but is not yet delivery-driven; reframed the
    "runtime drives it" paragraph as design-intent ("will drive once #488 lands"); promoted the
    explicit `StreamAccess` path (fetchFromCommitted / fetch / commit — source-verified signatures
    from `StreamAccess.java`) to the taught working consumer, with a read-process-commit snippet;
    kept the declarative form as the design intent it folds into (not inverted to dead weight, per
    lead constraint 3). Tied to S1: `fetchFromCommitted` is a single-partition read, so an ordered
    ledger wants `partitions = 1`. Working tree only, no commit.
  - S4 verified-good: #491 read-failover + #499 self-heal prose (656-672) already synced +
    honest, #499 mechanism correctly omitted. No change.

**Product-side gaps handed to the lead (I don't file):** #488 reclassify (headline API silently
non-functional — matches their recon cat-4 "unconsumed registrations" sweep); #507 severity look
(round-robin loses per-key order for ANY multi-partition user); #515-3 `/data/aether` WAL-disable.

**PICK UP HERE:** Streaming half (S1 #507 + S2 #488) DONE. **part4 + part5 WRITTEN** (2026-07-24,
lead unblocked them with post-#510–515 ground truth + getting-started.md @996aaa54a as reference):
- `part4-testing.md` — full chapter: unit-testing-as-plain-Java (failure-path test), Forge (single-JVM
  ember simulation; graceful-stop loss injection framed honestly as permanent, NOT a removable banner;
  `$AETHER_HOME/forge-data`; chaos `/api/chaos` + load `/api/load`; :8888/:8070/:5150), k6 (verified
  scenario shape), legacy→slice migration (`Promise.lift` + strangler/peeling; anchored on real
  `migration-guide.md` NOT the nonexistent in-repo jbct-loan — see correction below). References
  getting-started.md rather than duplicating steps.
- `part5-operate.md` — full chapter: deploy story (`artifacts push` + `blueprints deploy --wait`),
  THREE removable greppable banners `BANNER:deploy-security-520` / `deploy-teardown-521` /
  `deploy-mixed-version-434`; two-level scaling (`aether scale` + `aether cluster scale`; reactive tier
  default-on, TTM opt-in, LLM planned); zero-downtime deploy (`aether deploy --canary --traffic`,
  promote/complete/rollback); observability (auto correlation id via Promise ctx + invocation fabric,
  `/api/traces?id=`, `/api/metrics{,/prometheus}`, `/api/invocations/metrics{,/slow}`,
  `/api/observability/{config,depth}` — NOT the nonexistent `/api/aspects`); 50% rule stated precisely
  (quorum ⌊n/2⌋+1 of CORE nodes, minority→PASSIVE, no split-brain).
All source-verified via two research agents (a0ea6552af22a972d, a040b18cb5af47191). Working tree only,
no commits. CHANGELOG NOT bumped (coordinate version with pfd-editor per BOOK-VERSIONING).

CORRECTIONS folded in (flag to lead / plan): (1) `jbct-loan` does NOT exist in-repo — BOOK-PLAN 4.4 is
wrong; wrote 4.4 against `migration-guide.md` + orders spine instead. (2) no `/api/aspects` route — real
surface is `/api/observability/{config,depth}`. (3) autoscaler tier-2 is ONNX forecaster, not a "small
LLM". (4) Forge "kill" is always graceful stop() (no in-JVM hard-kill).

REMAINING: part4/part5 could take a voice/fidelity review pass (jbct-reviewer for code samples). When
#488/#507/#520/#521/#434 land, grep their `BANNER:` markers (part3 + part5) and pull. Optional S3 nit
skipped per lead.

---

## SESSION COMPLETE — 2026-07-24, parked by lead direction

Full arc delivered and source-verified: lane-safety → gating audit (getting-started + streaming gap list)
→ S1/S2 streaming honesty fixes → part4 + part5 full chapters. All working-tree only, no commits/pushes.

- **Both chapters ACCEPTED** into the working tree by the lead; the OWNER reviews prose before any push
  (lane standing rule). A jbct-reviewer sample pass is HELD until the owner's verdict — do NOT run it
  unprompted.
- **#520 correction landed on the issue**: lead verified the two-independent-switches mechanism at
  `MavenProtocolRoutes.java:35,135-142` (security_mode=NONE vs AETHER_INSECURE_DEV_MODE; cold path sets
  one, test harness invisibly sets both) and made it the issue's canonical framing. The part5
  `BANNER:deploy-security-520` is written for the production operator and stays correct.
- **Banner marker inventory** (for the removal sweep when fixes land): `BANNER:stream-declarative-consumer-488`
  (part3), plus part5 `deploy-security-520` / `deploy-teardown-521` / `deploy-mixed-version-434`. Also the
  inline #507 caveat in part3 (grep `#507`).
- **Parked for the owner** (not my lane to action): book CHANGELOG/version bump (pfd-editor coordination
  per BOOK-VERSIONING); BOOK-PLAN §4.4 nonexistent-`jbct-loan` fix (plan-side, future lane).

Nothing blocked, nothing pending on me. A resuming session picks up only on new owner/lead direction.

---

## 1. Lane-safety outcome — CLEAR, lane CLAIMED

- `cross-session.md` last real entry was 2026-06-21 (a month stale) — no live claim.
- Newest `book-aether/*.md` mtime = Jul 18 (part3 = Jul 1); nothing touched in ~15 min.
- No competing `Aether-book-editor` session. **Lane claimed**: appended a dated
  `[Aether-book-editor] -> [all]` entry to `.claude/scratch/cross-session.md` announcing
  the aether-main-coordinated writer, audit-then-prose, pause lifted.

**Prose touched this session (in working tree, uncommitted):**
- `.claude/scratch/cross-session.md` — lane claim entry.
- **P1.2 APPLIED** (error-glob; cleared, no agent needed): `part2-aether-model.md` enum
  `General.PAYMENT_DECLINED` → `record PaymentDeclined(String reason)`; `part1-no-magic.md`
  glob `*PAYMENT_DECLINED*` → `*PaymentDeclined*`; added a sentence to the `[errors]`
  explanation stating a pattern matches the returned `Cause`'s type name (why per-status
  cases are their own type, not enum constants). The Part I/II pair is consistent.
- Nothing else. Part I anatomy (P1.1), Module C interceptors (P1.4), Module B publish (P1.3),
  Module D honesty (item 19 + P1.5) all UNTOUCHED — they gate on the pending agent (§4).

## 2. Baseline / currency

- pragmatica HEAD moved **`f7f52c0f0` (tick-4 baseline) → `bfd00615d`** (branch
  `release-1.0.0-rc3`). Commits since are mostly JBCT-lint infra (#448/#452/#453/#486/#489…).
- **ONE book-critical delta since tick-4: `a1bbb5f78` — "stream consumer cursor auto-resume
  via fetchFromCommitted (#478)" LANDED.** #478 was the explicit watch-item gating Module B's
  cursor chapter (PROBE-2026-07-17 punch items 27/32). Its actual current behavior must be
  re-verified before finalizing that chapter — see §4 pending agent.
- Approach: re-verify the ready-to-apply P1 items at CURRENT HEAD rather than re-run the whole
  4-tick probe (probe results are 3 days old; "symbols hold, line numbers stale" per its own note).

## 3. Gating audit — status + consolidated gap list

The probe program (ticks 1-4) already IS the gating audit: a mature, source-verified,
hand-checked gap list, all product-side findings already FILED as GitHub issues #432-482
(18 closed same-night, #432/#433 parked to #345 rc3). So the audit's gap-finding is
substantially DONE; this session's value = (a) re-verify the P1 book-fix facts at rc3 HEAD,
(b) APPLY the cleared prose fixes (the NEW thing the pause lift enables — probe never edited
prose), (c) fold in the #478 delta.

### CURRENT line numbers for every ready P1 edit (gold — supersede stale probe numbers)

Verified by grep at HEAD `bfd00615d`, files under `book-aether/`:

**P1.1 — Part I Aspect factory seam is DELETED code (biggest blast radius).**
`part1-no-magic.md` teaches the 2-arg `(Aspect<T>, SliceCreationContext)` factory shape and
calls it "the only contract the runtime knows." Sites: code block **lines 42-49, 74**; prose
**98-106** ("applies an `Aspect`… That two-argument shape is the only contract the runtime
knows"); lifecycle **143-146** ("passing an `Aspect`… applies the Aspect"). Runtime deleted
the seam (`fd1649ad0`, closed #277): generated factory is single-arg `(SliceCreationContext)`;
`SliceFactory` rejects 2-arg. **BLOCKED on the exact current generated-factory signature** —
see §4. Real reference artifact per probe: `examples/ecommerce/inventory/.../InventoryServiceFactory.java`.

**P1.2 — error-glob example can never match (✅ APPLIED THIS SESSION, CLEARED, no agent needed).**
Globs match the Cause TYPE's simple name only (`ErrorTypeDiscovery.java:157`; BOOK-PLAN §4b
CONFIRMED; #385 CLOSED ships compile-time unmapped-Cause build-failure + zero-match warn).
- `part1-no-magic.md:264` — `HTTP_402 = ["*PAYMENT_DECLINED*"]` can NEVER match: the discovered
  type is the enum `General`, not the constant. `HTTP_409 = ["*OutOfStock*"]` (line 263) DOES
  work (matches the `OutOfStock` record type).
- `part2-aether-model.md:24-29` — the `enum General { PAYMENT_DECLINED(...) }` inside
  `OrderError`. **Fix:** promote `PAYMENT_DECLINED` to its own `record PaymentDeclined(...)
  implements OrderError` (distinct Cause type ⇒ own status), then change the routes glob to
  `["*PaymentDeclined*"]`. Add one sentence: globs match the Cause type's simple name; all
  constants of one enum share one status; #385 fails the build on an unmapped Cause.

**P1.3 — publish() is NOT fire-and-forget (CLEARED pending agent confirm of current behavior).**
`part3-playbook.md:518-521`: "`publish` returns once the subscribers present at that moment
have been handed the message; it does not persist the message, **does not wait for a
subscriber's `Promise` to finish**, and does not retry a subscriber that is down." Probe P1.3:
`TopicPublisher.java` request-response-invokes every subscriber and `Promise.allOf`s them (~20s
timeout) — so publish DOES await present subscribers. The at-most-once / no-catch-up / no-retry
clauses are CORRECT (probe verified clean); only "does not wait" is false. Book's own sample
(line 458 `events.publish(placed).map(...)`) couples placeOrder latency to subscriber execution
— the honest framing must say so. Direction of travel #386 (durable-pubsub D5, bare `Unit`)
may change this — mark VOLATILE. **Confirm current return/await behavior via agent (fact 3).**

**P1.4 — interceptor composition order (CLEARED pending agent confirm of current mechanism).**
`part3-playbook.md`: editorial banner **885-890** (cites #277 Aspect-identity, #278, "order not
yet fixed" — all stale/settled); example **915-917** `@RetryPayment @BreakOnPaymentOutage
@LogCalls`; count **945** "The six that ship" (should be SEVEN — `IdempotencyMethodInterceptor`
#398, punch P3.12); ordering prose **980-984** "still being settled." Ground truth
(`FactoryClassGenerator.java:630`): **first annotation = OUTERMOST, deterministic/fixed.** The
example lists `@RetryPayment` first (=outermost) but the prose wants logging outermost ⇒ example
is inverted; to get the recommended nesting, `@LogCalls` must be FIRST. **COUPLED TO P1.1:** line
943 says interceptors "compose into the `Aspect` the generated factory applies" — but the Aspect
param is deleted, so the CURRENT composition mechanism must be re-sourced (agent fact 4) before
rewriting either Part I 1.1 or this section. Fix: rewrite banner as settled behavior, fix count
to 7, fix example to `@LogCalls @BreakOnPaymentOutage @RetryPayment` (or align prose to example),
state first=outermost as a rule with its "why."

**Item 19 (tick-2 headline) — Module D "highly available today" is an OVERCLAIM (pending agent fact 6).**
`part3-playbook.md` three sites: banner **1004** ("highly available today but not yet
restart-durable"); **1225-1230** ("The replication and the fence… work today, so its state is
held across the configured replicas and survives the loss of a node: that is high availability");
closing **1483** ("An entity is highly available today"). Tick-2 ground truth: the entity
RESOURCE is NOT a dependency of `aether/node` — no deployed slice can inject a durable entity;
the wired impl is in-memory (no fence, no replication, no durability, no owner-routing in
production). So "HA today" is FALSE. Correct framing: "designed and pinned; module code exists
with tests; NOT injectable in a deployed slice yet; neither HA nor restart-durable in production
today" — cite #349 + guarantees.md §6. This is a book-error honesty fix (safe to apply — it
corrects an overclaim to the truth), NOT new prose in a blocked section. **MUST confirm the
status is still true at HEAD via agent (fact 6) before rewriting — do not "correct" HA→not-HA
if entities got wired.**

**P1.5 — signals status (part of the Module D honesty pass).**
`part3-playbook.md:1474-1477` says external signal injection "deferred to a later version."
Probe P1.5: spec §6.6/§14-S1 RESOLVED 2026-07-04 — signals ARE v1. BUT the whole
workflow/saga substrate is spec-only/not-deployable (item 19), so the honest correction =
"signals are part of the v1 design (spec §6.6), not deferred — but, like the rest of the
durable-workflow surface, not yet built." Confirm spec state via agent (fact 5).

### Product-side gaps for the lead to file (aether-gap / #496 / #497)

Nothing NEW yet this session beyond what the probe already filed — the re-verification agent
had not returned at checkpoint. IF it finds a doc still overclaiming Module D HA, or #478's
resume behavior mismatching guarantees.md §4, those become fresh product-side gaps. The
existing product-side tracker state: #432/#433 parked (await #345 rc3 kickoff); #478 LANDED
(verify); tick-4 drained 5/5.

## 4. PENDING — the gating dependency (in-flight at checkpoint)

A read-only `general-purpose` agent was launched to re-verify at HEAD `bfd00615d`
(agentId `a8a559c1fe35ce8cd`). It was confirming 7 facts: (1) current generated-factory
signature + that SliceFactory rejects 2-arg [BLOCKS P1.1 + P1.4 rewrite], (2) error-glob
simple-name-only + #385 check, (3) publish() awaits subscribers + return type,
(4) interceptor composition mechanism now that Aspect param is gone + current count/names
[BLOCKS P1.4], (5) signals-are-v1 spec state, (6) durable-entity deployability at HEAD
[BLOCKS item-19 rewrite], (7) #478 fetchFromCommitted actual cursor-resume behavior.
**Its report had not arrived when this session ended.** A resuming session should either
wait for it (SendMessage to `a8a559c1fe35ce8cd`) or re-launch the same verification (prompt
facts are enumerated above and in the original task).

## 5. EXACTLY where to pick up

1. Get the agent's 7-fact report (esp. the **current generated-factory method signature** and
   the **interceptor composition mechanism** — these gate everything).
2. Apply the CLEARED prose fixes in this order (all in the working tree, source-verify each
   line as you write, per voice overlay's code-fidelity rule):
   - **P1.2** ✅ DONE this session — no action needed.
   - **P1.1**: rewrite `part1-no-magic.md` anatomy (42-49, 98-106, 143-146) to the single-arg
     factory shape using the agent's exact signature + a real generated `*Factory` as reference.
   - **P1.4**: rewrite `part3-playbook.md` interceptor banner (885-890), count (945→seven),
     example (915-917), ordering prose (980-984), and the "Aspect seam" cross-ref (943) to the
     current composition mechanism. Keep consistent with the P1.1 rewrite.
   - **P1.3**: fix `part3-playbook.md:518-521` publish "does not wait" clause; note latency
     coupling; mark VOLATILE (#386 direction).
   - **Item 19 + P1.5** (Module D honesty): fix the three HA-overclaim sites (1004, 1225-1230,
     1483) and the signals banner (1474-1477). Honesty corrections only — do NOT write new
     entity-feature prose (substrate not deployable).
3. Update `book-aether/CHANGELOG.md` (currently 0.1.0) once prose lands — coordinate version
   with `pfd-editor` per BOOK-VERSIONING.md; do NOT bump unasked.
4. Report to the lead: structured product-gap list + book-fixes-applied + prose progress.

## Constraints reminder
- Lane = `book-aether/`, `book-aether-meta/` only; READ-ONLY on `../pragmatica`; never modify
  pragmatica. No git push / PR. Commit only on explicit ask (single-line conventional, no
  trailers). NEVER `mvn`/`mvn verify` (HCLOUD_TOKEN fires paid Hetzner tests). Source-verify
  every code sample against `../pragmatica`; no invented API — flag product gaps instead.
