# Chapter 9 — Knowledge Gathering as Upstream Work

*Threads: 4 (AI-era coding), 9 (failure modes), 11 (the interesting work)*

---

## The inverted ratio

Most software teams spend more time on code quality than on design quality, and the imbalance is structural rather than accidental.

Code quality is visible. It produces artifacts — passing tests, clean diffs, satisfied linters, approved pull requests — that teams can point to as evidence of work being done. Design quality is invisible until it fails. A design problem in a system that has not yet encountered the failure case looks like normal code; the same design problem after the failure case arrives looks like a crisis. Between the two moments, the design problem has been present and growing the entire time. The team's attention follows what is visible, which means attention follows code quality even when design quality is where the cost actually lives.

The cost-of-fixing curve for defects, when measured across the lifetime of a feature, is heavily weighted toward later stages. Defects caught during requirements gathering are cheap; defects caught during design are noticeably more expensive; defects caught during implementation are more expensive again; defects caught during testing are expensive enough to be remembered; defects caught after release are expensive enough to be talked about for years afterward. The exact ratios vary across studies, but the shape of the curve does not. The cost grows as the defect travels downstream. By the time a design problem manifests as a bug in production, the cost of fixing it is many times the cost it would have been to prevent at the design stage.

The teams that have done well on this dimension are not the ones with better testing or stricter code review, useful as those are. They are the teams that catch design problems before code is written, by treating knowledge gathering — what does this system actually need to know, and what does it need to do with that knowledge — as a first-class activity rather than as a quick conversation that precedes the real work of coding.

This chapter is about that activity. What it is, how it works, why it produces results downstream code-quality investment cannot match, and what shape the questions take when knowledge gathering is treated as the load-bearing layer rather than as preliminaries to coding.

---

## What knowledge gathering actually is

Knowledge gathering, in the sense PFD uses the term, is the work of answering specific questions about a use case before the use case is implemented.

The previous chapter named the six properties a use case has when it is fully specified: a trigger, typed inputs, typed outputs, typed failures, a composition of steps, and the dependencies between those steps. Knowledge gathering is the work of producing answers to each of these. The work is not coding. It is not architecture, not in the broad sense. It is the specific activity of asking the questions whose answers determine what code will eventually be written, and refusing to write code until the answers exist.

Some of the answers come from the domain expert. *What triggers this? What information does the system need to start? What does success look like? What can go wrong, and what should happen in each case?* These are questions a domain expert can answer, often with more precision than the developer asking them would have guessed. The expert knows their work. They can describe its triggers, its expected outcomes, its failure modes — usually in the same vocabulary they use day-to-day. The developer's job is to ask the questions in a form the expert recognizes, and to capture the answers in a form the code can use.

Some of the answers come from the developer's own analysis once the domain-side questions are settled. *What are the steps? Which steps depend on which? Where is parallelism available? Where do conditional paths apply? Where does iteration belong?* These are questions the developer can answer by examining what the domain expert just said. The composition structure is implicit in the answers to the domain-side questions; the developer's job is to surface it explicitly.

The output of knowledge gathering is a use case that is ready to be implemented. The implementation is, in the cleanest case, almost mechanical: the trigger maps to a method signature, the inputs and outputs map to types, the failures map to result variants, the steps map to operations, and the dependencies determine the composition pattern. The code is the writing-down of what the gathering already established. Most of the design choices that would otherwise be made during coding have been made before coding starts.

This is not how most working teams operate. The default operation is: receive a feature request, start coding, encounter ambiguity, make a guess, encounter the guess being wrong, refactor, encounter another ambiguity, make another guess, ship eventually, discover that a case was missed, fix in production, repeat. The team is doing knowledge gathering and code writing in the same activity, with the knowledge-gathering questions surfacing reactively as the code encounters them rather than proactively as the design considers them. The work gets done. It just gets done in the most expensive sequence available.

---

## Why upstream answers cost less

The economic argument for knowledge gathering rests on what costs are paid where in the development lifecycle.

A question answered during a design conversation costs roughly the duration of the conversation. Maybe fifteen minutes of two people's time. The output is captured in the type signatures, the function names, the documented failure modes. The cost is small and the artifact is durable.

The same question answered during coding costs more. The developer encounters the ambiguity, has to switch context to figure out the answer, may have to find someone who knows, may have to revisit decisions that were made when the question hadn't yet surfaced. The output is the same as in the design case — the answer becomes part of the code — but the cost is several times larger because the work happens in the middle of coding rather than in the activity dedicated to design questions.

The same question answered during code review costs more still. The reviewer notices that the code makes an implicit decision about something the design didn't specify; the reviewer raises the issue; the author either defends the decision or changes the code; either way, the conversation that should have happened at design time happens now, against a more constrained context where the code already exists and reflects one particular choice.

The same question answered during testing costs more again. A test fails, or a case turns out to be missing, or an edge case wasn't anticipated. The developer has to revisit not just the immediate code but the design decisions the code rested on. Sometimes the design has to change. Sometimes the test has to be reframed. Either way, the work is at least an order of magnitude more expensive than the original design conversation would have been.

The same question answered after release is the most expensive case, and the case discussions of the cost-curve tend to be most graphic about. The deployed system encounters an input or condition the design didn't account for. The system behaves in some way that the team has to investigate, diagnose, and remediate, often under time pressure. The cost includes not just the engineering time to fix the issue but the operational impact, the customer impact, the trust impact, and the institutional memory of the incident. The single question that would have been fifteen minutes at design time is now days of work distributed across multiple people.

These ratios are not theoretical. Every developer with a few years of experience has lived through some version of this curve. The conclusion the curve points at is simple: the cheapest place to answer a design question is at design time, and the cost of delaying that answer compounds at each downstream stage. Teams that internalize this fact rearrange their work to put design questions before coding. Teams that have not yet internalized it pay the curve's full cost on every feature.

---

## Questions as diagnostic

A useful property of treating knowledge gathering as a first-class activity is that the *inability* to answer a question becomes diagnostic information.

If the team cannot answer "what triggers this process?", the team does not yet understand the process. The right action is not to start coding; it is to find out what triggers the process. The unanswerable question is pointing at a gap in the team's understanding of the domain, and writing code on top of that gap will not close it. The code will work for the trigger the developer assumed; it will fail when the actual trigger turns out to be different.

If the team cannot answer "what can go wrong?", the team does not yet understand the failure modes. Code will be written that assumes some failure modes and ignores others. The failures that were assumed will be handled. The ones that were ignored will arrive in production as incidents. The unanswerable question was pointing, ahead of time, at where the incidents would come from.

If the team cannot answer "what does success look like?", the team does not yet have agreement on what the system is for. Different people on the team have different mental models of what the process produces. The code will reflect whichever model the implementing developer happens to hold, which will not be the same as the model the reviewer holds, which will not be the same as the model the stakeholder holds. The mismatch will surface eventually. The unanswerable question was, again, pointing at where.

This is the diagnostic property of the methodology. Failure to answer a phase's questions is a finding, not a stuck state. The finding locates where the team's design attention is needed. The team's response is not to push through the questions with guesses; the response is to recognize that the guesses are the source of the downstream cost, and to do the work — usually a conversation, sometimes more — that produces real answers.

A team operating this way reports a different relationship with the development process than a team that does not. Bugs caught in production decline, because the cases that would have produced bugs were either handled at design time or surfaced as unanswerable questions at design time. Refactoring becomes less frequent, because the design decisions that would have needed revision were made in a context where revision was cheap. The team's confidence in shipping increases, because the questions whose unanswered presence would have caused worry have already been answered.

These improvements are structural consequences of the discipline, not contingent benefits. They follow from the property that questions are answered upstream rather than downstream, and they apply to any team that maintains the discipline consistently enough for the property to hold.

---

## The shape of a design conversation

What does knowledge gathering look like in the daily work of a team that does this seriously?

A design conversation, in the typical case, happens between a developer and a domain expert before any code is written for a new feature. The developer has the methodology's questions in mind — the six properties a use case needs. The expert has knowledge of the work the feature is supposed to do. The conversation goes through the questions in roughly the order the methodology suggests, with the developer asking and the expert answering, occasionally with the developer translating into the methodology's vocabulary and the expert correcting the translation.

The questions are concrete enough that the expert can answer them. *"What sets this off — a customer clicking a button, a scheduled job, an event from another system?"* That is a question a domain expert can answer. *"What information do you need to start — what comes in when this is triggered?"* That is another. *"What does success produce, from the user's point of view?"* That is another. *"What are the ways this can go wrong, and what should each one do?"* And so on through the list.

The answers reveal not just what the feature needs but, often, what the business has not yet decided. The expert might say: *"I don't know what should happen when the payment fails after the shipping has been dispatched. We've never thought about that case."* The developer has now found a real gap — not in the code, but in the business's understanding of its own process. The next conversation is between the expert and whoever in the business owns the decision. The developer's question surfaced the gap. The methodology's discipline forced the question to be asked.

This is how design conversations differ from coding conversations. A coding conversation is about how to write the code. A design conversation is about what the code is supposed to do. The first cannot succeed if the second has not produced answers; the first can only invent answers, which is exactly the failure mode this chapter has been describing.

A team that handles this well usually has a recognizable rhythm. Feature requests arrive. The team holds a short design conversation, typically less than an hour, that walks through the methodology's questions for the new use case. The output is a written specification — names, types, failure modes, composition — that the implementing developer uses as their working document. Code follows the specification. When the implementing developer finds something the specification did not anticipate, they raise it as a design question, not as an implementation puzzle. The design conversation reopens briefly, the question gets answered, the specification is updated, the code continues.

The rhythm sounds slower than the default rhythm of "start coding and figure it out as we go." In practice it is faster, because the time spent in design conversations is more than recovered by the time not spent on rework, refactoring, debugging, and the production incidents that would otherwise have followed from skipped design work.

---

## What the methodology does not provide

It would overstate the case to suggest that the methodology generates knowledge the team did not previously have. The methodology asks questions. It does not answer them.

The answers come from the domain expert, from the business, from the team's accumulated experience with the domain, from documentation of regulatory requirements, from conversations with customers, from operational data about how previous features have behaved. None of these sources are produced by the methodology. The methodology's contribution is to make the questions explicit so that the team knows which sources to consult.

This distinction matters because methodologies sometimes overclaim. A methodology that promised to generate domain knowledge would be inviting disappointment; the knowledge has to come from somewhere, and the somewhere is the people and the systems that already have it. What a methodology can do is to be precise about what it needs to know, so that the team's effort to get that knowledge is well-directed.

PFD's framework provides the questions whose answers the team needs. It does not provide a domain expert who can answer them. It does not provide a business that has decided the failure modes. It does not provide regulatory clarity where the regulations are ambiguous. Where the necessary knowledge does not exist, the methodology surfaces that fact — through the unanswerable questions described above — and points at the gap. Closing the gap is work the team has to do outside the methodology, with the methodology's questions as a guide to which work matters.

A team using the methodology should expect to spend real time on the work of getting answers. The reward for that time is that the answers, once obtained, propagate through the design, the types, the code, and the operational system in a structured way that does not require the same answers to be rediscovered repeatedly. A question answered once stays answered. A gap acknowledged once becomes a known item the team can plan for. The methodology turns ad-hoc knowledge management into something closer to a structured inventory of what the system needs to know and what it has been told.

---

## Where this lives in the work

Knowledge gathering is the part of software development where senior judgment has the most leverage and the most room to compound over a career.

Coding is a skill that plateaus relatively early. A developer with three years of focused work can write code at a level that a developer with thirty years of experience will not substantially exceed in raw production. The thirty-year developer is better, but the improvement is incremental and the bottleneck is not the typing.

Design is different. The same conversation conducted with ten more years of domain exposure will surface failure modes, implicit assumptions, and overstated certainties that a less seasoned conversation would not reach. That is not a claim about individuals; it is a property of the methodology. Design conversation quality grows with pattern exposure, and patterns accumulate across projects.

The methodology described here gives experienced pattern-recognition a structured place to operate, and it gives less experienced developers a scaffold so that the right questions get asked regardless of who is asking them. The questions are explicit; the failure modes are named; the diagnostic signals are recognizable. A developer who does not yet have the exposure to invent the questions themselves can still ask them, can still recognize an unanswerable question as a finding, and can still surface the gaps the code would otherwise paper over.

This is the answer to a question that has dogged software methodology for decades: how does a discipline accumulate across careers when each individual project is unique? PFD's answer is that the questions accumulate. The specific answers to specific questions are project-specific and don't transfer. The questions themselves — the methodology's framework for what to ask — do transfer, and they get sharper with each project the team applies them to. A team that has used the methodology on twenty domains has learned not just twenty domains; they have learned what kinds of questions tend to be hard, where the answers tend to be hidden, which gaps tend to be load-bearing. The framework is the durable artifact. It is what experience brings to the next project, and what the methodology shares with every member of the team regardless of where they are in their career.

---

## Why this is the interesting work

Earlier chapters have referenced *the interesting work* as one of the things working developers want more of. Knowledge gathering is what that phrase points at.

A design conversation with a domain expert about a feature the system is supposed to support is interesting work in the specific sense that the conversation depends on judgment, on listening, on recognizing what the expert means even when they are saying something else, on noticing patterns from other domains that might apply here, on asking the question that has not been asked. None of this is mechanical. None of it can be done by tooling, including AI assistance, because the inputs are not visible to tooling. The expert's knowledge of the work, the developer's experience with similar designs, the team's understanding of the operational context — these are the inputs, and they live in the conversation.

The work that AI assistance is genuinely good at — generating syntactically correct code for known patterns — is downstream of this. Once the design conversation has produced a specification, AI assistance can help with the implementation. Before the design conversation has produced a specification, AI assistance has nothing useful to contribute, because the specification is exactly what the assistance would need as input. The interesting work is the work that produces the specification. The mechanical work is the work that turns the specification into code. PFD's methodology pushes attention toward the first and lets the second be handled by whatever assistance is available.

This is the redistribution of work that the AI-era chapter discussed in different language. The work that compounds with experience moves upstream; the work that benefits from tooling moves downstream; the boundary between them lines up with where each kind of work belongs. Working developers report wanting more of the upstream work and less of the downstream toil. The methodology produces that redistribution as a structural property rather than as a stated goal.

The upstream work is the part of the job that experienced developers describe, in interviews and retrospectives, as the part they came to software for in the first place. The downstream work is the part most teams have been spending too much of their time on. PFD's framework is one route to getting that ratio closer to what the work actually deserves.

---

Part I diagnosed why teams stay stuck: cost-of-change curves that invert the natural attention gradient, failure modes that arrive late and invisibly, and a default workflow that answers design questions inside the wrong activity. Part II has been showing the convergence already underway — six independent practitioners arriving at process-first conclusions, semantic types making design decisions tangible, and knowledge gathering as the upstream discipline that holds the others together.

That convergence needs a working vocabulary. Part III introduces the smallest operational unit of PFD practice: the set of type-honest shapes, composition primitives, and reasoning altitudes that the rest of the book builds from. The vocabulary is small enough to learn in an afternoon and composable enough to handle the full range of system behavior. What follows is that vocabulary.
