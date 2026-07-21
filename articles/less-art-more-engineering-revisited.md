---
title: "Less Art, More Engineering: It Wasn't Measurement"
description: "Reporting back on a 2023 promise: the cure for software's subjectivity was determinism, not measurement."
tags: [softwareengineering, architecture, softwaredesign, programming]
published: true
---

# Less Art, More Engineering: It Wasn't Measurement

Two and a half years ago I wrote an article called ["Less Art, More Engineering"](https://medium.com/@sergiy-yevtushenko/less-art-more-engineering-c01582feb7cb). The argument was simple: software development calls itself engineering but mostly isn't, because it runs on subjective criteria with no verifiable definitions. Readability with no metric. Best practices that contradict each other. Design methods that offer no way to check whether a design is correct. I ended on a promise: the next step is to convert what we know into a set of clearly defined, well grounded rules and criteria. "Ideally measurable," I wrote, "but in either case easily verifiable."

I want to report back on that promise, because I got the diagnosis right and the cure wrong.

None of this began as a plan. The original goal was modest: organize code so its structure would be recognizable and its behavior predictable. I had nothing in mind beyond that. But the moment I asked what actually makes structure recognizable, the question refused to stay small. Answering it meant understanding low-level structure and the forces that shape it, and each answer uncovered the next one. That inquiry grew into Process-First Design, and Process-First Design in turn produced Architecture Synthesis. I set out to tidy functions and ended up deriving systems.

## What I tried

In 2025 I made the first real attempt, in an article called ["Beyond Best Practices"](https://medium.com/codex/beyond-best-practices-e36511c073e2). Instead of collecting an endless pile of best practices, I proposed five criteria to assess any coding decision: mental overhead, business/technical ratio, design impact, reliability, and complexity. Five stable criteria in place of countless ad-hoc rules. They work. You can hold two approaches against them and get a defensible comparison, and I still use them.

But look at what happened to the word "measurable" between the two articles. In 2023 I wanted measurement. By 2025 I was already writing that the criteria "could be either somehow measured or, at least, checked for presence/absence," and that "absolute numbers might not be that useful per se" as long as they "enable objective comparison." I had quietly retreated from measuring to comparing, and I had not noticed. That erosion, measurable to comparable to merely present-or-absent, was the whole story trying to surface. I just wasn't listening to it yet.

There was a second thing I glossed over. I called them "my own set of criteria." I chose those five, and I chose that they matter. The subjectivity I set out to remove had not left. It had gotten smaller and moved somewhere I could see it, but it was still mine.

## What surprised me

Here is the part I did not expect. The thing that actually removed subjective technical decisions was not measurement at all. It was determinism.

A measurement gives you a number. A derivation gives you an answer that two people, starting from the same inputs and following the same rules, both reach, without either of them exercising taste. That second property is what I had wanted the whole time. I had assumed the only road to it was to measure things, so I chased metrics for two years. But you do not need to measure anything to be objective in the way that matters. You need the decision to be derived by a fixed procedure rather than chosen by judgment. A derivation is reproducible even when nothing on the page is a number.

I had been treating "objective" and "measured" as the same word. Under contact with real work they came apart, and the one that did the job was not the one I had bet on.

The clearest case is architecture. I built a [procedure](https://pragmatica.dev/method/architecture-synthesis/) that takes a system's service-level objectives (latency, availability, consistency, load) and derives an architecture from them through a fixed set of rules: which parts deploy together, where data lives, where consistency holds, how failure is handled. Nobody argues about the result. You state the requirements, you apply the rules, you get an answer. Run it again tomorrow and you get the same answer. No measurement of "goodness" appears anywhere in it.

## Where the judgment went

None of this eliminates judgment. It concentrates it, and that turned out to be the actual achievement.

It concentrates in two places, honestly and in the open. The first is the criteria and the rules themselves: someone has to decide what the procedure optimizes for, and that is a judgment, made once and visibly, instead of a thousand times in the dark. The second is the business inputs. A derivation is only as good as the requirements it starts from, and those come from the business.

This shows up most sharply in failure. The technology does not prevent failure. What it does is change where failure comes from. A derived system that fails, fails because a business decision was wrong: a service-level objective that did not reflect reality, a requirement nobody stated, a constraint priced too low. The subjective technical decision, the place we used to lose systems to taste and seniority and the loudest voice in the review, is mostly gone. What is left is business truth, and business truth is the right thing to be arguing about.

I did not confirm any of this by measuring it. I confirmed it by deriving four systems I do not control, Stack Overflow, Shopify, Discord, and a national companies registrar, from their public commitments alone, registering the predictions before checking them against reality, and grading the result in the open. It gets things right and it gets things wrong. It predicted read replicas for Stack Overflow, where the real answer is a mostly memory-resident database. The miss is kept, because a method that never fails is a parlor trick. That, and not any metric, is what "verifiable" finally meant: a procedure whose output you can check, and whose failures you can point at.

## What I did not see coming

In November 2023 I was not thinking about AI. I should have been.

That article had an economic argument buried in it. Subjectivity does not scale, I wrote, because every new developer has to grow their own, unlike a method you can teach quickly. It was a headcount argument. What I did not see is that a procedure deterministic enough to teach a person quickly is also a procedure a machine can execute.

This is not a hopeful guess. When I graded those four derivations, the operators that ran them were AI agents following the written rules, with no way to browse to the answer. A machine reaching the documented architecture from the requirements and the rulebook alone is the strongest evidence I have that the method has left the realm of taste. The property I wanted for human reasons, that the method be a formula and not a feeling, is the same property that lets a machine apply it. The free lunch I predicted would end is ending, and AI is why the deterministic alternative is now the one that wins.

## Where this leaves the promise

I was right that software runs on too much subjectivity and that this cannot last. I was wrong that measurement was the way out. The way out is determinism: fixed procedures, deterministically applied, that concentrate the judgment we cannot remove into the two places it belongs, the choice of what matters and the truth of the business, and derive everything else.

That is less than I promised in 2023 and more than I expected in 2025. There is still subjectivity in it, at the criteria and at the inputs, and I would rather say so than pretend otherwise. If you want to test it, the honest way is not to read more about it. It is to take the procedure, run it on a system you know, and try to make it produce an answer you know is wrong. That is the most useful thing that could happen to it.

The procedure, the worksheet, and the four graded derivations, misses included, are at pragmatica.dev.
