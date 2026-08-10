# Engineering Is the Checkable Fraction of Your Practice

Four times now I have written the same three sentences in different notations, for four problems
that looked unrelated: a design method, a coding technology, an architecture-derivation procedure,
and a contract-modelling tool. I noticed the repetition only after the fourth. Here it is, stated
as precisely as I can manage.

> Structure is derived from the attribution of forced change. The attribution is kept as an
> explicit, checkable artifact. The derivation refuses rather than guesses when its inputs
> underdetermine the answer.

Three clauses, each carrying weight. Drop one and look at what remains.

Drop **derived** and you have a documentation exercise: the structure was chosen first and the
attribution written to match. This is the normal case, and it makes no prediction, so nothing can
disagree with it.

Drop **explicit artifact** and you have taste. Real, valuable, and transferable only by
apprenticeship.

Drop **refusal** and you have a generator that answers every question. Its answers carry no
information, because it was always going to produce one.

## The third clause has a lineage worth claiming

Type inference has refused for fifty years. Hindley-Milner unification fails rather than picking a
plausible substitution: when two types cannot be reconciled, the answer is an error, not a guess.
Core HM needs no annotations at all -- it infers principal types, and that is the point. The
interesting part is what happened when later extensions broke that guarantee. Type classes admit
programs whose type is inferable while the instance to use is not; GADTs and polymorphic recursion
break principality outright. In each case the compilers were free to pick a plausible candidate,
and they demand an annotation instead. Build systems joined later: Bazel refuses an undeclared
dependency rather than resolving it from ambient state (`this rule is missing dependency
declarations`), and Nix in pure evaluation mode will not fetch what its inputs do not pin
(`in pure evaluation mode, 'fetchTree' will not fetch unlocked input`), with `--impure` as the
deliberate opt-out. In each case the refusal is the feature. It is what makes the successful
output mean something.

Decomposition methods have never had this, as far as I know. Layered, hexagonal, C4, arc42, the
domain modelling schools -- feed any of them an underspecified system and you get a diagram. I
know of none that returns *this does not determine a boundary* for any input.

So the move is a transplant, not an invention: take a discipline that inference engines and build
systems have proven out, and apply it to structure. That is a smaller claim than novelty and a
more useful one, because it means the hard part already has fifty years of evidence behind it.

There is a plausible reason the shape keeps recurring without anyone coordinating it. The refusal
aesthetic is ambient in typed functional programming -- parse don't validate, total functions over
partial ones, illegal states unrepresentable, results over exceptions. What follows may simply be
that tradition's core move, lifted from values to structure.

## What it forbids

A principle that forbids nothing is decoration. This one rules out five things concretely enough
to check on a Monday morning:

1. **Grouping by similarity or type.** All the `*Service` classes in one package, all the DTOs in
   another. Similarity is not an attribution of change.
2. **"We needed coverage" as a test's reason for existing.** A test names the property it pins, or
   it does not get written.
3. **Emitting a value the inputs do not determine.** No defaults dressed as derivations, no
   "approximately this" where the honest output is a refusal.
4. **A structure whose reason is recorded nowhere.** If the attribution lives only in the head of
   whoever drew the boundary, no one else can check it, and it leaves when they do.
5. **A decomposition no history could contradict.** If nothing observable could disagree with your
   module boundaries, they assert nothing.

If a claimed application of this forbids none of the five, it is not an application of it.

## Where the shape showed up

Each of these stands on its own argument, worked out in full at the links. What they have in
common is the third clause -- each one has an output that is not an answer.

- [Process-First Design](https://pragmaticalabs.io/method/pfd/) decomposes by change driver, and
  will not draw a boundary when the drivers are unknown.
- [Java Backend Coding Technology](https://pragmaticalabs.io/java/jbct/) shapes test suites by the
  code property under test, and will not write a test whose only justification is coverage.
- [Architecture Synthesis](https://pragmaticalabs.io/method/architecture-synthesis/) returns
  *underdetermined* instead of a recommendation when the inputs do not support one.
- A contract-modelling tool, built recently by someone working from the question "as a contract
  artifact, what could be better?" and almost none of the above, reports every fidelity loss
  rather than approximating over it. The question steered the axis; the refusal-shaped decisions
  were unprompted.

## What makes it checkable

"Forced change" earns its place because it has an observable proxy. Version control records which
files change together whether or not anyone was paying attention, so a decomposition can be
compared against history and found to disagree. The measurement is neither new nor mine: logical
coupling has been studied in the mining-software-repositories literature since Gall in 1998 and
Zimmermann in 2004, and Adam Tornhill later productized it as change coupling in CodeScene. So
this half is measurable today, with two decades of literature behind it and a tool that computes
it off the shelf. What that buys is availability, not proof -- how well the metric predicts
maintenance cost is still a live research question.

The comparison has to be set up correctly to mean anything, and the reason is interesting in its
own right: **co-change is partly endogenous.** Files change together partly because the current
structure forces them to, so raw co-change is downstream of the decomposition it is being used to
check. Two adjustments make the instrument sharp:

- **Measure cross-boundary co-change.** Coupling that crosses a boundary indicates misattribution
  regardless of whether it was forced or induced.
- **Use restructuring events as natural experiments.** Co-change that survives a known restructure
  is real. Co-change that disappears was an artifact of the old structure.

## Why this is the engineering question

Vincenti's *What Engineers Know and How They Know It* divides engineering knowledge into the
explicit -- descriptive and prescriptive -- and the tacit. He is arguing something else with that
taxonomy, that engineering knowledge is its own thing rather than applied science, so the reading
that follows is mine rather than his. Rigor is not what separates engineering from craft. Master
craftsmen are rigorous. What separates them is whether the knowledge governing a decision is
externalized into an artifact that someone other than the maker can check. A stress calculation
can be audited by an engineer who was not present. A mason's judgment transfers only by
apprenticeship.

That is the second clause almost verbatim, and the first matches too: engineering derives
dimensions from load cases, craft selects proportions from precedent and eye.

It also explains something otherwise puzzling. Fifty years of calling this work "software
engineering" did not make it engineering, and the usual diagnoses -- insufficient process,
measurement, or professionalism -- do not fit, because all three have been tried at length. The
explanation that does fit is that the governing relations stayed tacit. Nothing was externalized,
so nothing could be audited, and nothing could be wrong.

Which gives a definition worth using, stated as a ratio rather than a binary:

> Engineering is the checkable fraction of your practice.

Craft is the limit at zero. Engineering-as-aspiration is the limit at one. Every real practice
sits in between, and the same repository can be at both ends at once -- one of mine audited as
engineering on its import path and craft on its export path, simultaneously.

## The daily form

Three clauses at project scale need a version that survives a Tuesday. Three questions at the
moment of a decision:

1. **What relation governs this?** What would force this to change? What property is this test
   pinning? What does this boundary protect?
2. **Is that relation written down where it could contradict me later?** A commit message, a
   decision line, a test name. The artifact clause at whatever grain the moment affords.
3. **Do my inputs actually determine the answer?**

Question 3 has a daily form distinct from its project form. You usually cannot refuse -- deadlines
exist, most decisions are underdetermined, and they get made anyway. So the working version is
never dressing a guess as a derivation: record it as a guess, with what would settle it.

Two conditions keep this from becoming ceremony, which is how good disciplines die. Apply it only
where a checkable relation exists; forced onto naming debates and aesthetic choices it degenerates
into ritual. And "this is taste, and I am marking it as taste" is a valid answer to question 3.

## The smallest instance

Everything above is project-scale. Here is the same thing at the scale of one working
session, which is where the day actually goes.

I keep a `CLAUDE.md` -- a file the coding agent reads before every session. That file is a
governing relation, externalized into an artifact, constraining something whose output can
then be checked against it. Which makes it an instance of the second clause rather than an
illustration of one. Two of its lines carry the formulation directly, quoted as they stand:

```
- **Record what governs a decision where it can later contradict you.** The driver behind
  a boundary, the property a test pins, the reason a default was chosen — at whatever grain
  the moment affords: a commit message, a test name, one line in the response. Never a new
  document unless asked, and only where a real relation exists; forced onto naming and
  aesthetic choices it becomes ritual.

**The third branch — proceed on a marked guess.** Ask and Execute are not the only moves,
and most decisions are underdetermined yet still have to be made. When the inputs do not
determine the answer but the work must move, neither block nor silently pick: proceed, say
plainly which choice was a guess, and name what would settle it. Dressing a guess as a
derivation is the failure; making one deliberately and saying so is not. "This is taste,
and I am marking it as taste" is a complete answer.
```

The first is the artifact clause with its anti-ceremony guard welded on, because without the
guard an agent told to keep a record will generate decision documents nobody asked for. The
second is the refusal clause adapted to something that cannot refuse: an agent asked to build
will build, so the working form is not silence but a guess that is labelled as one.

Neither line is the argument. They are the cheapest place to start on it -- one file, two
paragraphs, and within a week you know whether it changed anything you do.

## Where the governing relation is not change

The formulation says structure follows *forced change*, which raises an obvious and genuinely
open question: which domains have a different governing relation? Three where I think the answer
is clearly yes:

**Data-oriented design.** It deliberately shreds change-cohesion in favor of memory access
patterns, and is right to; Mike Acton's position is that every software problem is a data problem.
Entity-component systems are one form of it, though practitioners are quick to add that you
probably should not go build one. The governing relation there is machine sympathy.

**Security boundaries.** A threat model can require splitting things that change together, where
merging them by change attribution would be the vulnerability itself. The relation is the trust
boundary.

**Cross-cutting concerns.** Telemetry co-changes with everything, so deriving structure from that
attribution yields either nothing or aspect-oriented programming.

The interesting question is whether these are exceptions to the first clause or instances of a
broader one -- make *whatever relation governs* explicit, derive from it, refuse when it
underdetermines. I am not ready to claim the broader version, because every instance I have is a
change relation and one sentence of generalization is easy to write and hard to earn.

If you work in one of these domains, or a fourth, the specific case is what I want:
[/method/counterexamples/](https://pragmaticalabs.io/method/counterexamples/) takes one system,
one derivation, and the place where the answer and reality parted ways.

## Lineage

One ancestor is worth naming: Parnas, 1972, *On the Criteria To Be Used in Decomposing Systems
into Modules*. Parnas decomposed by design decisions likely to change -- concrete, and checkable
in principle. What the three clauses add is that the attribution survives as an object after the
decomposition is made, and that the derivation is allowed to decline.

Parnas gave the criterion. Keeping it around afterwards is what makes it possible to find out you
were wrong.
