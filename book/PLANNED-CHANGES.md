# JBCT — Planned Changes (backlog)

> Queued JBCT changes. Not shipped until folded into `book/*.md`, the CHANGELOG, and the
> authoritative naming rules (the **jbct-coder** agent + the **/jbct** skill).

## Open items

### 1. `Option<List<T>>` joins the forbidden nestings (2026-08-21) — SHIPPED in 4.9.0

*Four Return Types* forbids `Promise<Result<T>>`, `Result<Result<T>>` and `Option<Option<T>>` under
**Forbidden (Double-Monad Nesting)**, and is silent on `Option<List<T>>`. That silence made cardinality
look like an open question about the shape vocabulary when it is not.

**Ruling (author, 2026-08-21): forbidden.** A collection already carries emptiness as a value, so the
`Option` is a second absence channel saying the same thing twice. The matrix's existing rule then
generalizes cleanly — *each concern appears at most once in a return type*, and emptiness is the
collection's own concern.

**The edit:** one row in the Forbidden table with that reason, and the matching line wherever the
allowed-nesting list is restated (`appendix-a-api-reference.md`, `ai-tools/skills/jbct/SKILL.md` via
`sync-book-blocks.py` if the region is book-owned).

**Cross-book:** the PFD half shipped in **PFD 2.6.0** — *Foundations*, *The shapes* now states that the
four shapes describe effects rather than contents, and that an empty collection is a value rather than
an absence. Until this lands, the published books disagree by one release.

### 2. The normalization boundary statement (2026-08-24) — SHIPPED in 4.9.0; Run 1c unblocked

One normative block in *Introduction*, immediately after the determinism claim
(`introduction.md:54`), with one provenance sentence naming the Run 1b forensics. **Derives:**
package hierarchy (telescope), Java types, step contracts, return types, patterns, composition,
failure representation, sharing/placement, concurrency structure, testing obligations. **Does not
normalize:** atomic-leaf algorithms; adapter internals; module promotion (content-invariant along
derived boundaries); test-input supply vehicle; test-data representation. Closing mechanism:
variation below the line is style, above it a defect; each newly discovered variation gets an
explicit ruling recorded in the block. Referenced from the testing, adapter, and module sections
rather than restated. **Sequencing: published before Run 1c executes**, so the DDG metric is bound
by a pre-registered scope rather than a post-hoc one.

### 3. Module promotion replaces "Module Organization (Optional)" (2026-08-24) — SHIPPED in 4.9.0

`project-structure.md:193`. Modules add no structure — they promote existing boundaries to
compiler enforcement. Coincidence rule: module boundaries only at telescope nodes or stratum
roots. Justification: content-invariance — no line of Java observes the choice. Drivers — forced:
AS deployment topology; elective: ownership divergence, publication, dependency-direction
enforcement. Default: no promotion. "Team > 5" dies — the driver is ownership divergence, not
headcount. Level verdicts: subsystem natural, workflow rare, use case never. The vertical cut is
presented before the layer cut (the current example cuts against the book's own vertical-slicing
philosophy); the two compose. Adapters sub-decision: deployment-forced cuts telescope the adapter
tree; ownership cuts may keep one shared adapters module.

### 4. Promise marks leaving the process (2026-08-24) — SHIPPED in 4.9.0

CPU-bound computation returns `Result` regardless of duration; scheduling is the composition
boundary's decision (`Promise.lift`), visible at the call site. Edits: `four-return-types.md:116`
→ "any operation that leaves the process: I/O, external service calls, inter-process
communication"; `:155` → "operations that leave the process (I/O, external interaction)";
`troubleshooting-faq.md:79` "blocking code" → "blocking I/O". The decision tree at
`systematic-application.md:87` is already correct — only prose leaked.

### 5. Leaf testing obligations inherit the space-counting table (2026-08-24) — SHIPPED in 4.9.0

`testing-philosophy.md:137-148` and `testing-practice.md:448-460`; the word "complex" deleted from
both. Three obligation classes: space enumerable from types → exhaustive vectors, one row per
cell; computes over an unbounded domain → invariant plus boundary examples; neither branches nor
computes → no isolated test, the parent's vectors pin it. The keep/delete criterion becomes "does
the leaf carry its own space." Obligations become derivable at design time from the step
definition. Lint candidate registered: mechanical leaf classification (zero-branch detection).

### 6. The invariant obligation is executable (2026-08-24) — SHIPPED in 4.9.0

`testing-philosophy.md:123-127`. Three clauses: executable; the assertion *is* the invariant,
applied to every supplied input — not a hand-computed expected value per example; reproducible
(fixed or reported seed). The input-supply vehicle is below the boundary: property library,
hand-rolled generator, or enumerated set all discharge it. "Even as a comment" survives as
motivation, not as conformance; "does not teach them" softens to "does not require one"; jqwik as
the non-normative reference realization in the appendix (`Email` idempotence). Cross-reference
checks at implementation: `systematic-application.md` testing checklist, the 4.7.0 mutation
caution.

### 7. Test-data representation: below the line, with a default (2026-08-24) — SHIPPED in 4.9.0

`testing-philosophy.md:449-453`. Delete the qualitative "Which Approach to Use?" triad — it
implies the choice is load-bearing when nothing above the boundary observes it. One sentence
declares it style; the default: canonical vectors; a factory method when one field varies
systematically; a builder when the input type has optional fields. Book examples use vectors
consistently so readers never infer meaning from stylistic variation.

### 8. Error construction — rewrite onto the typed-error idiom (2026-08-25) — SHIPPED in 4.9.0

The idiom is specified in `pragmatica/core/docs/typed-error-construction.md` (R1–R5, canonical
form, Shape Evolution, dated Decisions) and enforced by
`pragmatica/jbct/docs/typed-error-lint-spec.md` (JBCT-CAUSE-01..08, two-track rollout). The book
rewrite documents the **released** API — scope is larger than one section: `error-handling.md:97`
(the canonical example currently demonstrates two banned styles in one code block), the API
appendix, and every cause-constructing example across chapters. Carries: records with data
components plus trailing `message` (structural `message()`); the prescribed `General` enum shape
for fixed-text failures — multi-constant enums reinstated on qualified constant labels (JEP 441),
probe-verified; `Cause.Terminal` / `Cause.Wrapped`; `FACTORY` via the constructor-reference
overloads; the Shape Evolution worked migration (constant → record, compiler-guided); the
cheap-cause line ("can a caller act differently on it"); user text composed at the boundary
switch from components; tests on constant equality / type + components, never `message()` text.
AI tools follow via `sync-book-blocks.py` plus a manual pass over `jbct-coder`'s error examples.

### 9. Retry classification via `Cause.Terminal` (2026-08-26) — `open`

`transferfunds-example.md`'s RetryPolicy discriminates retryable failures by class token
(`Set.of(TransientError.class)`), which forced its test-local fixed-text failure to stay a
distinct enum rather than joining `General` during the 4.9.0 idiom conversion. The library now
carries the classification: `isTerminal()` is consulted by retry facilities, with
`Cause.Terminal` as the opt-in mixin. Candidate: invert the example's polarity — retry unless
terminal — and let the class-token set disappear. Weigh against the example's pedagogy (an
explicit policy object) before ruling.

### 10. The determinism claim is not distinctive (2026-08-27, Run 1c) — `open`

**Measured.** Run 1c compared data dependency graphs across the ten Run 1b implementations
(`book-pfd-meta/RUN-1C-RESULTS.md`). Treatment and control both scored **100.00%** within-arm
agreement on concurrency structure, guard placement, failure absorption and ordering. Margin
**+0.00**, which triggers the pre-registered falsification condition.

**What the finding actually is.** The claim at `introduction.md:54` reads: *"Given a use case
specification — inputs, outputs, validation rules, steps — there's essentially one correct
structure. Different developers (or AI assistants) should produce nearly identical
implementations."* Run 1c does not show that false. Both arms produced nearly identical
implementations, so the claim held in both. What it shows is that **the convergence is not
attributable to JBCT** — five idiomatic-Java implementers converged just as completely, and the
claim's own antecedent explains why: the specification supplied the steps.

**The candidate defect is one of attribution, not truth.** A property that follows from having a
specification is presented in a chapter arguing for a methodology, which invites the reader to
credit the methodology for it. Two disclosed limitations bound this — the metric saturated at the
ceiling, and `SPEC.md` enumerates its steps in execution order, handing the control arm its
ordering — so the finding is real but not yet decisive.

**What is genuinely distinctive, and is not currently claimed here.** Cross-arm agreement on
concurrency structure was **0.00%**: five of five treatment implementations parallelized three
independent lookups that five of five control implementations serialized. The methodology changed
the *shape*, not the *agreement*. That is a stronger and more defensible claim than determinism, and
the chapter does not make it.

**Do not act on this yet.** A successor run is registered (unordered specification, real structural
choice, finer-grained metric). Ruling on the book text before that run would be acting on a
saturated measure. Recorded so the finding is not lost, and so the next release does not restate the
attribution unexamined.

## Shipped

- **5.0.0** (2026-08-28): item 11 — *Construction that scales* paragraph in the Introduction's
  *The JBCT Approach*, after the normalization boundary. Development parallelism stated as its
  own claim, distinct from runtime parallelism; grounded in typed step contracts and uniformity,
  deliberately NOT in the determinism claim (item 10's gate is untouched); the change-driver cut
  attributed to the companion *Process-First Design* (two-way structural link — PFD 3.0.0's
  closing section names JBCT as the uniformity instance); pointer to *Software's Second Free
  Lunch*. No "quasi-linear" in JBCT prose — that bound belongs to PFD's design-scaling claim.
- **4.9.0** (2026-08-26): items 1–8 — the `Option<List<T>>` forbidden row, the normalization
  boundary (Run 1c now unblocked), module promotion, the Promise process-boundary wording,
  space-counted leaf obligations, the executable invariant with the jqwik appendix realization,
  the test-data default, and the error-construction rewrite onto the typed-error idiom (the
  Pragmatica gate dissolved when the typed-error arc merged — core PR #636).

- **4.2.1** (2026-06-30): the `*State` naming rule — state-machine lifecycle-state sums named
  `*State` with bare variants — landed in *Design Methodology* (ch02), the glossary (new *State /
  State Machine* entry), the PFD glossary (one-clause cross-reference), and the authoritative
  naming sources (the **jbct-coder** agent and the **/jbct** skill). The read-vs-write refinement of
  the shared-code rule (shared reads couple nothing; the one legitimate shared write per resource is
  the guarded transition) and the shared-spine glossary cross-reference (deferred from 4.2.0) shipped
  in the same release.
