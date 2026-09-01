# Provisioned Step — a proposed Aether pattern (2026-09-01)

_Owner's idea, worked through with pfd-editor in a design session. **Status: proposal, for
CTO review at leisure — no rush, nothing blocked on it.** The CTO coordinates Aether book
writing, so this is written to be reviewable without the conversation behind it. Who makes the
book changes is undecided and is the CTO's call._

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

**From Aether itself, which is the better argument.** `MethodInterceptor.class` is already a
resource type carrying user-supplied *behaviour*, not infrastructure, and it already has its own
playbook section ("Cross-cutting behavior: interceptors"). So the resource mechanism already
provisions behaviour in one place. **Provisioned Step generalizes a move Aether already makes**
rather than introducing behaviour-as-resource as a new idea. That is internal precedent, not
analogy, and it is the same shape as the saga ruling: name the composition that is already
there instead of introducing a primitive.

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

- **Deployment scope must be explicit.** Until dynamic reconfiguration exists, an operator
  changing config through the Management API does *not* re-assemble a Provisioned Step. This
  has to be stated precisely because `configuration.md` advertises live updates through
  consensus a few paragraphs away.
- **Lifecycle must be stated, not omitted.** The owner's instinct is right that keeping
  lifecycle out of the *name* preserves design freedom. But not naming and not documenting are
  different moves: the machinery is shared, so whatever release path resources take, these take.
  **"None today" preserves more freedom than silence** — it is honest now, and adding lifecycle
  later is purely additive, whereas silence lets readers form expectations in both directions
  and guarantees half of them are wrong when the decision lands. One sentence, not a section.

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

## 9. Open questions for the CTO

1. **Does the shared provisioning path call anything on a user-defined type at release?** This
   decides §7's lifecycle sentence: if it does, the behaviour exists today and silence hides it;
   if it does not, "none today" is accurate and costs nothing.
2. **Anything in the few small changes that constrains what a user-defined type may be?**
   Constructor shape, interface requirement, whether the config section is passed whole or
   parsed. The book's examples have to match what the runtime actually accepts.
3. **Placement and authorship.** Part 3 is a guess from the section list; the CTO knows the
   book's plan. And who writes it is undecided — the Editor↔aether-main arrangement governs, not
   this note.

## 10. One observation about the doc set, separate from the pattern

Three times in one day a reader would have inherited a guarantee from an adjacent section rather
than from a statement: pub-sub delivery reliability (found and fixed, D18), live config updates
applying to a deployment-scoped step (§7 above), and resource lifecycle applying to a Provisioned
Step (§7 again). Nothing in any of those cases was stated falsely — the docs describe mechanisms
in adjacent sections, and adjacency reads as inheritance. That looks systemic rather than
incidental, and might be worth a pass of its own: for each capability section, state what it does
*not* guarantee, especially where the neighbouring section guarantees exactly that.
