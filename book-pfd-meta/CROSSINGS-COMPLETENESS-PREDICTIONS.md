# Pre-registered predictions — Run 5, crossings completeness

**Registered 2026-08-22, BEFORE the target repository was cloned and before any operation was
enumerated.** Run 5 of `book-pfd-meta/PLANNED-CHANGES.md` item 18.

---

## The claim under test

Backlog item 17.4. An external review proposed a use-case elicitation procedure whose stated
completeness criterion is circular, with **one non-circular clause worth keeping: *repeat from every
context-map crossing*.** Crossings are finite and given by the input contract, and each implies at least
one operation on each side. The claim is that they provide a **completeness lever over a bounded set**.

## The grading problem, and the fix

Unlike Run 4, this run has **no mechanical grader**. Deriving candidate operations from crossings is my
judgment, and comparing them to the real set afterwards would let me flatter the result without noticing.

The fix is procedural and is the whole reason this document exists before the work:

1. Enumerate the crossings from **public protocol and integration documentation only**.
2. Derive the candidate operation list from those crossings alone.
3. **Commit that list.** It is frozen.
4. *Then* enumerate the actual operation set mechanically from the repository.
5. Compare.

Step 3 before step 4 is what makes the comparison worth anything.

## Target

**Mastodon.** Chosen because its crossings are unusually well specified in public — ActivityPub
federation, the REST client API, OAuth, webhooks, e-mail, push — and because its actual operation set is
**mechanically enumerable**: controller actions from the Rails routing table, plus background job
classes. No hand-counting.

Not chosen for being easy. Federation means a large share of its behaviour is externally triggered,
which is the condition most favourable to the crossings lever — so a poor result here is strong evidence
against, and a good result is weak evidence for. That asymmetry is registered deliberately.

## Definitions, fixed now

- **Crossing** — a boundary at which this system exchanges anything with a party outside it, named in
  public documentation.
- **Candidate operation** — an independently meaningful trigger-to-outcome transformation implied by a
  crossing.
- **Actual operation** — a distinct controller action, or a background job class. Enumerated by script.
- **Traced** — an actual operation a reader can attribute to at least one crossing on the frozen list.

## Predictions

**P1.** At least **two thirds** of actual operations trace to a crossing.

*Registered as a guess with no pilot behind it, and marked as such per the Run 2 lesson. The direction
is the prediction; the fraction is reported as measured whatever it is.*

**P2 — the real test.** The residual — operations tracing to no crossing — is **dominated by scheduled,
internal and maintenance operations** rather than by externally-triggered ones. This is a claim about
the *character* of what the lever misses, not about a number, and it is the one I cannot fudge after the
fact.

*If the residual contains many externally-triggered operations, the lever is broken: crossings were
supposed to be exactly where external triggers live.*

**P3.** The frozen candidate list has a **low false-positive rate** — few candidates correspond to no
actual operation. A high rate would mean crossings generate plausible-sounding operations the system
does not have, which makes the lever a generator of work rather than a completeness check.

**P4 (registered prior).** I expect the lever to work better for federation than for the client API,
because ActivityPub specifies its activities explicitly while a REST API's operations are a design
choice not visible from the protocol. If this is wrong and the client API traces better, the lever
depends on protocol formality rather than on crossings as such — which would narrow item 17.4
considerably.

## Scope caveats, registered in advance

1. **One system.** Nothing here generalizes; it establishes whether the lever is worth specifying at all.
2. **A Rails controller action is a coarse proxy for an operation.** Some actions are several operations,
   some operations span several actions. The proxy is mechanical, which is the trade being made.
3. **I know this system's shape already.** The freeze in step 3 is the only protection against that, and
   it is imperfect.
4. **Favourable-case selection**, per the target rationale above. A good result is weak evidence.

## Grading

The writeup quotes P1–P4 verbatim, grades each, and publishes both the frozen candidate list and the
enumerated actual set so a reader can redo the tracing and disagree.
