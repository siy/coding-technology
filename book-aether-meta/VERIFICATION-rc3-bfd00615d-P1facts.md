# Verification results — P1 book facts @ rc3 HEAD `bfd00615d` (2026-07-21)

**What this is:** the output of the read-only verification agent that the aether-main-coordinated
`aether-book` session spawned but that returned AFTER the session's checkpoint. It UNBLOCKS the P1
prose fixes that `HANDOVER-aether-main-coordinated.md` lists as "gated on the in-flight verification
agent." A resuming session should use THIS instead of re-running the 7-fact verification.

All facts checked read-only at HEAD `bfd00615d` (branch `release-1.0.0-rc3`). **7/7 CONFIRMED.**

## 1. Aspect seam DELETED — CONFIRMED (unblocks P1.1)
Runtime `SliceFactory` requires exactly one param of type `SliceCreationContext`, single-arg invoke:
- `aether/slice/.../dependency/SliceFactory.java:133` (`parameterTypes.length != 1`), `:137`
  (`!parameterTypes[0].equals(SliceCreationContext.class)`), `:153` (`new Object[]{creationContext}`).
- Rejection message for a 2-arg rc1 factory: `:190-191` ("...factory parameter 0 Aspect was removed").
- Real generated factory: `examples/ecommerce/inventory/target/generated-sources/.../InventoryServiceFactory.java:41`
  `public static Promise<Slice> inventoryServiceSlice(SliceCreationContext ctx)`.
- **Current signature the runtime invokes:** `<name>Slice(SliceCreationContext ctx) -> Promise<Slice>`.

## 2. Error glob = Cause TYPE simple name only — CONFIRMED, with nuance (P1.2, already applied)
- `jbct/slice-processor/.../routing/ErrorTypeMatcher.java:105-119` — globs match simple name (`:111`);
  exact refs match qualified name (`:118`). Never message, never enum constants.
- `ErrorTypeDiscovery.java:159-160` feeds simpleName/qualifiedName only.
- Compile-time check: `ErrorMappingValidator.java:12` (#385) — emits UNMAPPED_CAUSE/DEAD_PATTERN/DEAD_REFERENCE.
- **NUANCE the book MUST state:** build FAILS on unmapped Cause ONLY in strict mode
  (`SliceProcessor.java:294-296`: `strict && UNMAPPED_CAUSE ? ERROR : WARNING`). Default = WARNING.
  Strict = `[errors] strict=true` or `-Ajbct.routes.errors.strict=true`. Dead patterns/refs always WARN.

## 3. publish() AWAITS subscribers — CONFIRMED (unblocks P1.3)
- `aether/aether-invoke/.../TopicPublisher.java:28` `public Promise<Unit> publish(T message)` — invokes each
  subscriber (`:45`), `:41` `return Promise.allOf(deliveries).map(_ -> Unit.unit())` — awaits all. Not fire-and-forget.
- **Return type `Promise<Unit>`.** Default per-subscriber timeout ~20s: `SliceInvoker.java:138` `DEFAULT_TIMEOUT_MS = 20_000`.

## 4. Interceptor order fixed, first-annotation = OUTERMOST — CONFIRMED (unblocks P1.4)
- `jbct/slice-processor/.../generator/FactoryClassGenerator.java:742` doc; `:779` `for (i = size-1; i>=0; i--)`,
  `:783` wraps — first annotation (i=0) wrapped last → outermost.
- **Count = 7** (incl. Idempotency #398), in `aether/resource/interceptors/src/main/.../interceptor/`:
  Retry, CircuitBreaker, RateLimit, Metrics, Logging, Cache, Idempotency.

## 5. Signals are v1 — CONFIRMED, with nuance (unblocks item-19)
- Spec `aether/docs/specs/durable-entity-primitive-spec.md` **Version 0.3.0** (`:5`).
- `:487` "### 6.6 External signal injection (v1 — resolves S1)"; `:497` `POST /api/workflows/{type}/{id}/signal`;
  `:500` `aether workflows signal <type> <id> --event <json>`; `:939` S1 RESOLVED (signal injection IS v1).
- **NUANCE:** only WORKFLOW signals are v1. **Saga signals are explicitly v2** (`:506`, needs a `WAIT_SIGNAL` step kind).

## 6. Module D substrate NOT deployable — CONFIRMED, CRITICAL (unblocks P1.5)
"Durable entities are HA/durable in production TODAY" = **FALSE**.
- `resource-durable-entity` is NOT a dependency of `aether/node` (`aether/node/pom.xml:120-139` lists only
  resource-http/-notification/-db-async/-db-jdbc +api). Module has an SPI file but isn't on the node classpath →
  `SpiResourceProvider` never discovers it → **a deployed slice cannot inject a durable entity today.** No
  `DurableEntity` reference in `aether/node/src/main`.
- Docs corroborate (and are honest): `guarantees.md:62-63` (row 29 in-process map / row 30 LINEARIZABLE
  "PARTIAL — mechanism BUILT + unit-tested; production-DORMANT until #352 + #349"); `:141` restart-durability none;
  `known-limitations.md:77` "planned, not wired into a deployed slice." Blockers: **#349** (persistence), **#352** (entity node wiring).

## 7. #478 cursor auto-resume — CONFIRMED, supersedes prior "no auto cursor resume" (unblocks P1.5/streaming)
Commit `a1bbb5f78` (2026-07-18) present.
- Default method `fetchFromCommitted` on app SPI: `aether/slice-api/.../StreamAccess.java:46-48` (reads committed cursor, else 0).
- Node wiring: `AetherNode.java:2861` `CursorStore.cursorStore(streamStorage)`, `:5118` registered as SPI extension;
  `StreamAccessFactory.java:85` fail-soft pickup; `PartitionedStreamAccess.committedOffset:671-684` (in-mem then disk).
- Proof test: `CursorAutoResumeRestartTest.java:52` `fetchFromCommitted_resumesAtCommittedOffset_afterRestart` (asserts `:72-73`).
- **CURRENT TRUTH:** a same-node production restart with a writable data dir + an app consumer that COMMITS cursors and
  reads via `fetchFromCommitted`/`committedOffset` now **auto-resumes from its committed cursor** — bounded by cursor-ref
  durability (offset block write-through; ref snapshot-persisted ≤100 mutations / 30 s, so a commit in that window resumes
  from prior cursor or 0). **STILL replay-from-0:** every SYSTEM `FrameworkStreamConsumer`
  (`SystemStreamFactories.java:70/90/121/147/168` pass `Option.none()`), non-committing apps, and Forge/in-memory/
  unwritable-mount nodes. Push/poll `ConsumerRuntimeState`/`StreamConsumerRuntime` still NOT node-wired (test-only).
  Effectively-once (PG dedup) still not wired. Matches `guarantees.md:115` + `known-limitations.md:75`.

## Book-application order (from the aether-book checkpoint)
P1.2 applied. Remaining, now unblocked by the above: **P1.1** (Part I Aspect anatomy → single-arg signature, fact 1),
**P1.3** (publish → `Promise<Unit>` awaits, fact 3), **P1.4** (Module C interceptors → 7, first=outermost, fact 4),
**item-19 + P1.5** (Module D honesty → facts 5/6/7: workflow-signals-v1-not-saga, durable-entity-not-deployable,
cursor-resume-nuanced). No NEW product gaps to file — findings 6/7 are already honestly in `known-limitations.md`/`guarantees.md`.
