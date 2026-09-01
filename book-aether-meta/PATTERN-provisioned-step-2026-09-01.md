# Provisioned Step — a proposed Aether pattern (2026-09-01)

_Owner's idea, worked through with pfd-editor in a design session. **Status: proposal, for
CTO review at leisure — no rush, nothing blocked on it.** The CTO coordinates Aether book
writing, so this is written to be reviewable without the conversation behind it. Who makes the
book changes is undecided and is the CTO's call._

> **Revised 2026-09-01 after CTO review, which was grounded in the code and corrected two
> claims.** The capability is one day old, not longstanding (§2, item 4); the internal-precedent
> argument is narrower than first written and is now stated in its narrow form (§4); lifecycle
> **exists**, so the "none today" recommendation was wrong and is replaced by the actual
> per-operation semantics (§7); and the mechanism's real constraints are recorded in a new §2.1.
> §10 is redirected to an existing ticket rather than filed.

---

## 1. The idea

Virtually every application has parts that vary by configuration. Aether today handles that the
traditional way: config arrives as data and the slice interprets it. The current docs carry the
canonical shape — `[feature-flags] enable-premium = "true"`, `[thresholds] max-order-amount =
"10000"` — and `ConfigurationSection.class` is a first-class resource type, so a slice can be
handed a config section through the resource mechanism and branch on what it finds.

**The proposal inverts it: provision the configurable part of the application as a user-defined
resource, rather than provisioning the configuration it would have read.** The slice declares a
qualifier for *the behaviour that varies* — the premium pricing policy, the retry strategy, the
tax rule — and receives a working implementation. It never sees a flag and never branches.
Configuration stops being input to the application and becomes input to the provisioner.

## 2. What is settled

Four questions were put to the owner; these are the answers.

1. **Granularity: the step.** The unit is a step, not a slice and not a whole subsystem.
2. **Selection: the same model as any other resource.** The step is built at provisioning time,
   receives config, and assembles its internals accordingly. No new selection mechanism.
3. **Live reconfiguration: out of scope, and deliberately.** Dynamic reconfiguration is wanted
   for *all* resources and is not implemented today. The pattern does not carry a capability
   the runtime lacks; when dynamic reconfiguration lands, it lands for everything at once.
4. **Mechanism: deliberately identical.** Implemented by a few small changes to resource
   provisioning that allow user-defined resource types. There is otherwise no difference.
   **But this became true only today.** Until `8d36f0c1c` (#773, closed 2026-09-01, verified
   across 143 modules) user-defined resource factories were unreachable: the SPI registry was
   node-boot-only while the class lived in the slice loader, so a slice declaring a qualifier
   for its own type compiled, deployed, and then failed at load with `ResourceFactoryNotFound`.
   **Any example of this pattern written before that commit would have failed at deployment.**
   The book must date the capability rather than imply it was always available.

## 2.1 What the mechanism actually provides (CTO, verified in code 2026-09-01)

- **Config arrives parsed, not whole.** `ResourceFactory<T, C>` declares `configType()` and
  receives `provision(C config)`; the section is bound to a typed object before the factory
  runs. **Examples must show a config record, not a section handle.**
  `provision(C, ProvisioningContext)` is an optional override; generated factories emit the
  no-context form for a plain dependency.
- **The user type `T` is unconstrained** — no interface, no constructor shape. The *factory*
  carries the entire contract. This is the strongest single fact for the pattern: the step can
  be whatever type its author wants, so the pattern imposes nothing on domain code.
- **Selection by config is already in the mechanism.** `priority()` and `supports(C)` let
  several factories offer the same type, with config deciding which one provisions. That is
  exactly "the behaviour that varies, chosen per deployment" — the mechanism is already doing
  the pattern's work, and the book should name that rather than describe selection as something
  the author arranges.
- **Registration** is `META-INF/services/org.pragmatica.aether.resource.ResourceFactory` inside
  the slice jar, preserved by `PackageSlicesMojo`. Since #773 the overlay scans with the slice's
  own loader and keeps only factories that loader defined, keyed by `Class`, so a slice's step
  cannot collide with a platform factory or acquire a node-loader twin.

## 3. Naming

**Provisioned Step** (owner's ruling). Rejected: *Configurable Step* (names the problem but
hides the mechanism link, which is the drift risk the name is meant to close); *Provisionable
Step* (the `-able` suffix names a capability every resource has, so it distinguishes nothing);
*Resource Step* (maximally explicit, but `resource` in the docs labels a taxonomy of
infrastructure kinds — SqlConnector, Publisher, StreamAccess — and a pricing policy reads oddly
in that list).

**Consequence to handle:** because the name does not carry "resource", it does not advertise
that these ride the resource lifecycle. See §7.

## 4. Why it is admissible as a pattern

The house bar is a stated forcing condition, the mechanism that earns the guarantee, and the
cases where it does not apply. Beyond that, this has two lineages, and the second is the strong
one.

**From the method books.** *Process-First Design*, Foundations: where an operation varies, the
variation "is resolved into a bound value before the body runs, so the body stays a straight
sequence of steps with no fork inside it… it calls a step whose implementation was chosen at
the edge." Today that edge is hand-wired by whoever assembles the application; this makes the
runtime the edge. The companion line — *an independent step is a change driver made physical* —
applies directly, since configuration is by definition a different change driver from business
logic: different reason to change, different cadence, different authority. **The Aether book
should cite PFD here rather than re-derive the principle.**

**From Aether itself — and this is narrower than it first looks, so state the narrow form.**
`MethodInterceptor.class` is a resource type carrying user-supplied *behaviour* rather than
infrastructure, and it already has its own playbook section ("Cross-cutting behavior:
interceptors"). But it is a **platform** type provisioned by a **platform** factory registered
at node boot — precisely the path user-defined types could not use until `8d36f0c1c`. So the
honest claim is not "Aether already does this and we are merely naming it" but **"Aether
already does this for platform types, and as of `8d36f0c1c` can do it for user types too."**
The saga-ruling shape survives — this generalizes an existing move rather than introducing a
primitive — but the narrow statement costs nothing and cannot be knocked down, where the broad
one can be, by anyone who knows where the platform factories register.

**The teaching contrast writes itself, and both halves already exist.** `ConfigurationSection`
hands the slice a section to interpret; a Provisioned Step hands it an assembled step. Same
qualifier, same provisioning, same machinery — the only difference is what arrives. No "old way
versus new way" framing needed.

## 5. The guarantee, stated honestly

**What it earns:** misconfiguration becomes a provisioning-time failure instead of a runtime
branch. A missing or unresolvable implementation fails the deployment, loudly, while somebody is
watching.

**What it does not earn:** it does not eliminate configuration. Something still says "for this
deployment, use the premium policy," and that something is now the provisioner. The book should
say this outright, because the obvious criticism is "you just moved the config" and the answer
is *yes, deliberately, to a place where a mistake is a failed deploy rather than a wrong answer
served at 3am.*

**The payoff worth leading with is combinatorial.** Boolean flags multiply: three flags are
eight combinations, of which a team tests two and ships all eight. Provisioning collapses that
space — a deployment names one assembled configuration, and the untested-combination problem
disappears rather than being managed. `enable-premium` in the current docs is the motivating
example, already in Aether's own material.

**A second payoff, discovered while checking the first: the pattern is more honest than the
mechanism it replaces.** Resource-injected config never refreshes (§7), and that is true of
`ConfigurationSection` today. But a thing called *a config section* sounds like a live view of
configuration, so its semantics are invisible and a reader can reasonably expect updates to
arrive. A step *assembled at provisioning* obviously reflects one moment in time — the name
carries the semantics. The pattern does not change the refresh behaviour at all; it stops the
behaviour from being surprising, which for a property nobody had written down anywhere is worth
more than it sounds.

## 6. Rules that came out of the discussion

- **The step's type bounds what configuration can do.** Because the unit is a step, its
  signature is fixed by the use case that calls it. Configuration varies *how* it works and
  never *what it is* — a compile-time ceiling on the blast radius of any config change. A
  variant of this idea that let config alter the contract would be worse than the branch it
  replaces.
- **Assembly is a parse, so it returns `Result`.** Config text goes in, a validated working
  step comes out, and an unparseable configuration cannot produce one. This is
  parse-don't-validate applied one layer further out than the books currently apply it, and it
  is what mechanically earns §5's guarantee: *a Provisioned Step either exists correctly or the
  deployment failed.*
- **The boundary, without which the pattern metastasizes.** If configuration selects *which of
  several behaviours* runs, provision the behaviour. If it parameterizes *a single behaviour
  that runs regardless*, pass the value. `max-order-amount` stays a value — one validation
  always runs and config sets its threshold. `enable-premium` becomes a step — it picks between
  two pricing behaviours. Without this line somebody turns every scalar into a provisioned unit.

## 7. Documentation obligations

Both are cheap now and expensive after someone ships against them.

- **Config is read once, at provision time — and this is now a verified guarantee, not a
  caveat.** Established by the CTO 2026-09-01: `SpiResourceProvider` mutates `promiseCache` at
  exactly two points, `:119` `computeIfAbsent` on first provision and `:153` `remove` inside
  `releaseAll` when the last consumer releases. **No invalidation path on config change exists,
  and there is no hook from the config layer into the resource provider at all.** Corroborated
  from the other direction by **#381** — `ConfigNotificationManager.notifyChange` has no caller,
  so runtime config-change push is dead code.
  The sentence for the book: ***a config value delivered through a provisioned resource is read
  once, at provision time, and does not refresh on a consensus config update; a restart or slice
  reload is what applies it.***
  **The scope is wider than this pattern.** It holds for `ConfigurationSection` today, not only
  for user-defined types since `8d36f0c1c`. So `aether-overview.md:386` — *"no restart required
  for changes"* — is imprecise for resource-injected config generally.
  **Two tickets, not interchangeable:** #381 owns the missing mechanism, #496 owns the claim.
  Fixing #381 makes the overview bullet true; until then it is a headline capability that one of
  its two delivery paths does not provide. Do not cite #496 as tracking the dead-code fix.
- **Lifecycle exists, so "none today" would be false.** This corrects the original draft, which
  recommended stating that there is none. Verified in code: `SpiResourceProvider.releaseAll`
  (`:141-172`) is refcounted — it drops the slice from the consumer set and, when the last
  consumer goes, removes the cached promise and calls `factory.close(resource)`. The
  `ResourceFactory.close` default closes the resource if it is `AutoCloseable`. The guarantee
  to state, per operation: **close is called only when the last consuming slice releases it**,
  never per-slice; **only if the type is `AutoCloseable`**, unless the factory overrides
  `close`; and **a close failure is absorbed** — caught, logged at WARNING through JDK platform
  logging, the resource leaves the cache regardless, and the release promise still succeeds,
  because one resource's failure must not block every other release.
  That last clause is itself an instance of §10: a reader who infers "close is called" will
  also infer "close failures surface." They do not, and the section has to say so.

## 8. Proposed placement

- **Capability → the resources reference** (`ai-tools/skills/aether-coder/resources/custom-qualifiers.md`
  and its book equivalent): `type` may name a user-defined type. A row and a short section.
- **Pattern → Part 3, the playbook**, as a peer to "Cross-cutting behavior: interceptors", which
  is its own precedent. Part 3's sections are named for problems, so the heading should name the
  problem (something in the register of "Configuring what varies"), not the mechanism.
- **The term needs a home on the code side.** There is no new construct — the pattern is a
  discipline about what goes in `type` — so a developer reading source has no identifier to
  search. The reference row should carry the words *Provisioned Step* explicitly, or the book
  will name something with no footprint in the code.

## 9. Questions for the CTO — two answered, one open

1. ~~Does the shared provisioning path call anything on a user-defined type at release?~~
   **Answered 2026-09-01: yes.** Lifecycle exists; the per-operation semantics are in §7 and the
   release path is `SpiResourceProvider.releaseAll` → `factory.close(resource)`.
2. ~~What do the changes constrain about a user-defined type?~~ **Answered 2026-09-01:** config
   arrives parsed via `configType()`/`provision(C)`, the type itself is unconstrained and the
   factory carries the contract, and `priority()`/`supports(C)` already do config-driven
   selection. Full detail in §2.1.
3. **Still open: placement and authorship.** Part 3 is a guess from the section list; the CTO
   knows the book's plan. Authorship is governed by the Editor↔aether-main arrangement, not by
   this note.

## 10. The adjacency hazard — do not file, it is already owned

Four cases in one day where a reader takes a guarantee from the docs' *shape* rather than from
any statement. **They are not all the same direction, and the correction matters** (CTO,
2026-09-01):

- **(1) pub-sub delivery** read as reliable because the section never stated at-most-once —
  adjacency read as inheritance. Found and fixed as D18.
- **(2) live config updates** appearing to apply to a deployment-scoped step, because the
  overview promises consensus-propagated config with "no restart required for changes" —
  inheritance again.
- **(3) resource lifecycle**, which is the **mirror image and the sharpest of the four**:
  lifecycle *does* apply to a user-defined provisioned type, and this note's first draft was
  about to deny it. Here the docs' silence produced a **false negative** — silence read as
  absence of behaviour, not adjacency read as inheritance.
- **(4) close failures**, absorbed at WARNING while a reader who learns close is called will
  assume they surface.

**(3) is why the proposal has to cut both ways.** A section that never mentions lifecycle is as
misleading as one whose neighbour implies it, so "state what you do not guarantee" is only half
the rule; the other half is "state what you *do*, where silence would read as nothing happening."

**And two of the four were writer-side, not reader-side** (CTO's observation, from this
material): the lifecycle error was mine, and the pub-sub omission was whoever wrote that
section. The defect reproduces in the people *extending* the docs, not only in those consuming
them — which means a claims register would be load-bearing for authorship, not merely for
readers.

**This belongs on #496, not on a new ticket** (CTO, 2026-09-01): *"GA claims-vs-reality audit:
guarantee-language sweep of all public docs (consistency-lens method)"*, one of 27 GA blockers
that two independent sweep layers agreed on, with zero hits for a claims register and 53 one-bit
labels still standing. Posted there as comment 5496041708, with the four instances split by
provenance: (3) and (4) verified against `SpiResourceProvider:141-172` and
`ResourceFactory.close`, (1) and (2) recorded as reported-not-re-verified. Evidence for those
two is now available and is in §10.1.

### 10.1 Citations for instances (1) and (2)

- **(1)** Pre-fix `aether/docs/slice-developers/resource-reference.md:1038-1041` (parent of
  `395fe33c5`): the pub-sub section runs "Multiple slices can subscribe…", "Subscriptions are
  automatically removed when the slice deactivates", then a horizontal rule. No delivery
  statement of any kind. `395fe33c5` inserts the at-most-once paragraph at what becomes line
  1040.
- **(2)** `aether/docs/aether-overview.md:386` — *"**Dynamic Configuration via KV-Store** —
  expose runtime configuration in consensus, no restart required for changes."* Unqualified, in
  an overview. **Resolved 2026-09-01: this is ACTIVE, not latent, and broader than first
  scoped.** `SpiResourceProvider` has no cache-invalidation path on config change (`:119`
  provision, `:153` release, nothing else), and #381 records that
  `ConfigNotificationManager.notifyChange` has no caller. So resource-injected config never
  refreshes — `ConfigurationSection` included, today. I scoped this finding to the new pattern;
  it is not scoped to the new pattern.
