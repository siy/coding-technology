# Handover — Aether book (aether-main-coordinated writer, 2026-07-23)

Session identity: `aether-book`, coordinated by the aether-main lead. **Supersedes the applied-prose
status of `HANDOVER-aether-main-coordinated.md` (2026-07-21)**; that file's "PENDING verification
agent" is resolved — its report is `VERIFICATION-rc3-bfd00615d-P1facts.md` (7/7 confirmed), and the
P1 prose fixes it gated are now APPLIED. Read order to resume: this file →
`VERIFICATION-rc3-bfd00615d-P1facts.md` → `PROBE-2026-07-09.md` (remaining P2/P3) →
`aether-book-voice.md`.

All changes below are IN THE WORKING TREE, uncommitted, no push. pragmatica read-only baseline
`release-1.0.0-rc3` HEAD ~`bfd00615d`.

---

## 1. Lane — CLEAR, resumed (not restarted)

- Newest `book-aether/*.md` mtime was 2026-07-21 09:33 (2+ days stale at resume); no live editor.
- The 2026-07-21 cross-session.md "lane claim" was this same aether-main-coordinated lane. Last
  fresh-eyes `Aether-book-editor` entry is 2026-06-21 (month-stale). pfd-editor touched the repo
  2026-07-21 but in a disjoint lane (website/book-arch release train, working tree on main).
- Lane refresh appended to `.claude/scratch/cross-session.md` (2026-07-23).

## 2. P1 prose fixes — APPLIED (the cleared-section work)

All verified against `VERIFICATION-rc3-bfd00615d-P1facts.md` (7/7) + a fresh read-only source pass.

- **P1.1 — Aspect factory seam is deleted code. FIXED in `part1-no-magic.md`.** The generated
  factory is single-arg now (`fd1649ad0`, #277). Edits:
  - Code block: `orderQuote(SliceCreationContext ctx)` returns `Promise.success(instance)` (no
    `aspect.apply`); `orderQuoteSlice(SliceCreationContext ctx)`; call `orderQuote(ctx).map(...)`.
    Matches real `EchoServiceFactory`/`InventoryServiceFactory` shape verbatim.
  - Prose: "one-argument shape is the only contract the runtime knows," + the loader's named
    rejection of an older 2-arg factory (`SliceFactory.java:133/137/190`). "two-argument entry
    point" → "single-argument entry point."
  - Lifecycle **Assemble** bullet: passes only `SliceCreationContext`, no aspect apply.
  - Resource-as-parameter example (`orderService`): dropped `Aspect` param + `aspect.apply(...)`.
  - Preserved the "third seam" thread accurately: cross-cutting behavior is declared per method and
    woven into the same generated bridge at compile time (forward-ref Module C), so the Module C
    back-references still resolve.
- **P1.2 — error-glob. Already applied by the 2026-07-21 session** (PaymentDeclined record + glob +
  explanatory sentence). Confirmed in tree; untouched this session.
- **P1.3 — publish() awaits subscribers. FIXED in `part3-playbook.md` (~519).** `publish` returns
  `Promise<Unit>` that completes once every present subscriber's `Promise` settles (~20s each,
  `SliceInvoker DEFAULT_TIMEOUT_MS=20_000`). Removed the false "does not wait" clause; added the
  latency-coupling consequence (the `events.publish(placed).map(...)` sample pays subscriber
  latency); marked VOLATILE (durable pub-sub roadmap / #386 would decouple).
- **P1.4 — interceptor composition. FIXED in `part3-playbook.md`.** Rewrote the stale banner
  (Aspect.identity / "order not fixed" / #278) into settled behavior: compile-time nested
  `intercept(...)`, first annotation = OUTERMOST, deterministic (`FactoryClassGenerator.java:742/779/783`);
  #277 removed the runtime Aspect seam. Count six→**seven** (added idempotency, #398). Example order
  fixed to `@LogCalls @BreakOnPaymentOutage @RetryPayment` (logging outermost, retry innermost).
  Rewrote the "still being settled" ordering prose into a stated rule + why + reading mnemonic.
  Updated the coupled Part I cross-refs (Module C intro "third seam"; the Module B→C transition's
  "chosen per deployment" → "which/order fixed at compile time; config per deployment"; the
  "Aspect seam doing its job" line → "nested intercept(...) inside the generated bridge").
- **item-19 + P1.5 — Module D honesty. FIXED in `part3-playbook.md` (3 HA sites + signals banner).**
  Durable-entity resource is NOT on `aether/node`'s classpath (`aether/node/pom.xml:120-139`), so a
  deployed slice cannot inject one → "highly available today" was FALSE. All three sites (status
  banner, "what durable means today" passage, closing note) now say: designed + unit-tested, not on
  a deployed node yet, **neither HA nor restart-durable in a running deployment**; blockers #352
  (node wiring) + #349 (persistence), cited only in the status banner (kept out of main prose).
  Signals banner: workflow signal injection IS v1 (spec §6.6, `POST /api/workflows/{type}/{id}/signal`
  + CLI), not deferred; **saga** signals are v2 (`WAIT_SIGNAL` step kind); whole surface not
  deployable yet.

## 3. #491 streaming-failover product→book sync — APPLIED (owed by the lead)

New `### What "durable" depends on` subsection in Module B ("Events that must not be lost", after the
stream config, before "Pub-sub or stream?"). Source-verified this session (read-only agent, cites
below), because the current chapter taught streams as unconditionally "durable" with a TOML lacking
replication keys — the exact overclaim to correct (a #496 exemplar).

- **Config (verbatim, hyphenated TOML):** `replicas` (default **1**, `StreamConfig.DEFAULT_REPLICAS`),
  `min-sync-replicas` (default **0**), parsed `StreamConfigParser.java:350-351`; invariant
  `0 <= min-sync-replicas <= replicas`. Both count the owner.
- **Default RF=1 = "one-disk-deep"** (`guarantees.md:113`, `known-limitations.md:74`): crash-safe via
  per-partition WAL, NOT safe against disk loss or owner failover (failover reads empty).
- **Durability across node loss = `min-sync-replicas >= 2`** (forces `replicas >= 2`). Corrected the
  older "replicas>=2 AND minSyncReplicas==replicas" note — equality is NOT required.
- **Lossless read failover PROVEN** (`AbstractStreamOwnerFailover` phases 1-8 HARD): owner killed
  mid-stream, new owner serves complete prior history in offset order + ordered tail, no drop/dup.
  REQUIRES RF>=2 + min-sync-replicas=2 (RF=1 "structurally cannot fail over"). Book states it as a
  guarantee without over-specifying the promotion mechanism.
- **#499 RF-restoration — FIXED + LANDED 2026-07-23** (release-1.0.0-rc3 @ `004135b34`, 5 commits;
  memory index confirms #499 CLOSED). The limitation is RETIRED and the converged-case delta is
  APPLIED to the prose. The book now teaches, at the observable-guarantee boundary: after a single
  graceful owner-kill (RF>=2 + min-sync-replicas>=2) reads survive losslessly AND the replica set
  rebuilds itself to a caught-up copy AND the status count converges — gate-enforced by the
  re-enabled `StreamOwnerFailoverPinnedTest` (@Disabled removed → permanent HARD gate, 3× green).
  - **HONEST BOUNDS baked into the prose (do NOT overclaim past these):** proven case = single
    graceful owner loss, rest of cluster stable, in-JVM forge gate. The under-churn variant + cloud
    validation ride the next rc3 sweeps — the prose says "the wider failure envelope still being
    validated" and keeps a verify-against-current marker. Do NOT let a future edit widen this to
    "any failure / any environment."
  - **Mechanism STILL out of prose** (standing steer holds). For this file only: the HRW/watermark
    note is now **superseded-confirmed** — the real root was (a) a test-infra zombie (killed node's
    un-cancelled periodic tasks; product bug **#501**, scheduler-leak audit, rc4) MASKING (b) a
    fire-once backfill-completion ack lost during the replacement's member-view bootstrap window, now
    self-healing. Multiple mechanism theories were disproven across the arc (#498/SWIM, HRW-divergence,
    a transport re-dial framing) — the prose named none of them, which is exactly why zero prose
    churned when the root moved. This is the boundary discipline's payoff; keep it.
  - **Delta applied:** the fourth paragraph of the "What 'durable' depends on" subsection flipped from
    limitation → bounded-positive rebuild guarantee; para 3 tail "That much is proven" → "That is
    proven" (removed the now-false contrast); "membership otherwise stable" → "the rest of the cluster
    stable" (plainer, and avoids any appearance of teaching the membership axis).
- **NOT taught:** #498/SWIM as the cause (disproven). #478 cursor auto-resume across an owner
  failover (untested/undocumented — only same-node restart is proven; do not assert).

## 4. Remaining / next (not done this session)

- **P2 items** (PROBE-2026-07-09 §P2): #6 per-call `ReadConsistency` (Module D), #7 banner split,
  #8 blocked on #432, #10 re-scope #277 flag + `/api/aspects`, #11 S2/S4 settled blockquotes. #9
  (RF=1 disclosure) is now substantially SUBSUMED by the new Module B subsection.
- **P3 items:** #12 done (seven interceptors). #13 manifest category `pg-notify`→`pg-notification`
  (book ~914) NOT verified/applied. #15-18 open.
- **Part 5 (operate)** is a VOLATILE scaffold. With #499 fixed, RF rebuilds itself after a single
  graceful owner loss, so there is no longer a "restore RF by hand" procedure to document for that
  case; the operator-facing material to add when Part 5 is written is failover *observability*
  (confirming the rebuild + status convergence) plus the under-churn / cloud caveats. Flagged, not
  written (VOLATILE stays outline-only per the voice overlay).
- **CHANGELOG:** NOT bumped (per "do NOT bump unasked" + coordinate version with pfd-editor). A
  changelog entry for this prose batch is pending a version decision by the lead/pfd-editor.

## 5. Product-side gaps for the lead to file

- **#499 reference-doc reconciliation — MOOT in the limitation direction (lead owns the docs side).**
  #499 is fixed, so there is nothing to add to `known-limitations.md`. The positive guarantee
  (lossless failover + automatic RF rebuild, single-failure case) may deserve a `guarantees.md` row —
  the lead handles that in the pragmatica docs pass (I'm read-only there). The book no longer
  overclaims relative to the reference docs; if anything it now slightly under-states the new
  guarantee until that docs pass lands.
- No other NEW product gaps this session (the probe already filed #432-482; verification facts 6/7
  are already honestly in guarantees.md/known-limitations.md).

## Constraints reminder
Lane = `book-aether/`, `book-aether-meta/` only; READ-ONLY on `../pragmatica`. No git push / PR.
Commit only on explicit ask (single-line conventional, no trailers). NEVER `mvn`/`mvn verify`
(HCLOUD_TOKEN fires paid Hetzner tests). Source-verify every code sample; no invented API.
