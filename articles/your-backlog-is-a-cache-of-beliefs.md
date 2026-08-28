---
title: "Your Backlog Is a Cache of Beliefs"
description: "Plans do not fail by tangling, they fail by rotting. Treat the backlog as a cache of beliefs about a moving codebase, and staleness stops being a feeling and becomes something you can compute."
tags: [softwareengineering, projectmanagement, agile, programming]
published: false
---

# Your Backlog Is a Cache of Beliefs

Cache invalidation is famously one of the two hard things in computer science. The joke survives because the pain is real: keep a copy of something, and the moment the original changes, your copy starts lying to you. It lies silently, with a straight face, and it lies hardest to the people who trust it most.

Here is the uncomfortable part. You are operating a large cache right now, and you are not invalidating it at all. It is called your backlog.

## What a ticket actually is

A cache is a sticky note about something you checked once, kept because checking again is expensive. That is the whole concept. The note is cheap to read, and that is its value. The note does not know when the thing it describes changes, and that is its danger.

A ticket is exactly that note. "This endpoint is broken." "This refactoring depends on that migration." "This is worth doing before the release." Every ticket records what somebody believed on the day of filing, about a codebase that changed the next day, and the day after, and every day since. The same goes for every dependency link between tickets, and every priority call. None of it is work. All of it is belief, frozen at write time.

So a backlog does not fail the way rope fails, by tangling. It fails the way milk fails, by rotting. Quietly, past its date, while everyone keeps trusting the fridge.

We measured the rot on a live project: a production distributed-systems codebase driving toward a major release, with a dependency graph of 139 tickets. A one-day audit re-checked every ticket's premise against the current code. Roughly one in four premises was stale or partially wrong. A dozen tickets described work that was already done, and eleven of them were closed the same day. Three genuine blockers sat hidden on the critical path, invisible because the beliefs around them were out of date. And one number mattered more than all the others: of all the value the audit produced, roughly 80 percent came from refreshing premises and only 20 percent from fixing the graph's structure. The plan was not tangled. It was expired.

## The two reflex answers, and why both fail

The first reflex is periodic grooming. Once a week, or once a sprint, everyone sits down and walks the backlog. In cache terms this is expiry by calendar: throw the whole cache out every Friday and rebuild it. Its cost grows with the size of the backlog, not with the rate of change, which is why it gets skipped the moment the backlog gets big enough to actually need it. And it is always late, because the belief that went stale on Monday still steers decisions until Friday.

The second reflex is to update everything immediately. Every new fact triggers a full sweep: who else does this affect, what else must change. In cache terms this is write-through on every write, and on a busy project it thrashes. The team stops building and starts curating. This one gets abandoned even faster than grooming, and for a better reason.

Caching theory has known both dead ends for fifty years. It also knows the way out.

## Borrow the discipline that works

Caches that work at scale share one design decision: they stop chasing global freshness. They do not try to keep every entry true at every moment, because that is unaffordable and, more importantly, unnecessary. They guarantee coherence only where reads happen.

A backlog has very few real read points. Nobody reads the whole plan at breakfast. The plan is actually consulted at a handful of moments: when someone picks the next piece of work, when a decision is being made that reshapes work, and when something ships. Between those moments the plan can be knowingly, harmlessly stale, because nothing is reading it there.

That single observation splits the maintenance problem into two cheap halves. At write time, when knowledge is created, you record what it touches, in one line, while it is fresh. At read time, at one of those few real moments, you verify only the beliefs you are about to act on. Everything else waits, and that is fine.

Call the discipline Read-Point Planning, RPP for short: the plan is guaranteed true where it is read, and only there. The rest of this article is what that costs in practice, which is very little.

## The mechanics, small enough to try today

None of this needs tooling. It needs two habits and one shell command.

**Habit one: two questions at filing.** Every new ticket answers two one-line questions. What existing knowledge does this invalidate? What does this genuinely depend on? Ten seconds, written by the person who just created the knowledge, at the only moment the answer is cheap. A new ticket is not just new work, it is new information, and new information is precisely the thing that expires old notes. If nobody prices that at filing time, someone pays retail for it later, during an incident.

**Habit two: date your verifications.** When you check that a ticket's premise still holds, write down the commit you checked it against: "still true at abc1234." That one stamp turns staleness from a feeling into arithmetic, because now the question "can I trust this note?" has a computable answer:

```
git log --oneline abc1234..HEAD -- path/to/the/subsystem
```

If the code under the ticket has not moved since the stamp, trust the note. If it has, re-check before acting on it. This is a lease that expires on motion instead of on wall-clock time, which is exactly what you want: a ticket about a quiet corner stays trusted for months, a ticket about a hot subsystem gets challenged within days. Applied retroactively to our audit, this one check would have flagged most of the stale tickets with no audit at all. Their subsystems had visibly moved under them for weeks, and no one was looking.

**Decisions are notes too.** When you make a call that reshapes work, a cutover, a freeze, a scope change, spend one more line naming which tickets it touches. At ruling time the blast radius is usually enumerable in a single sentence. A week later it is an archaeology project. And a decision you have not made yet is itself a blocker: "waiting on a decision" deserves to be visible in the plan as much as "waiting on a ticket."

**One warning from the field: never act on suspicion automatically.** On the very first day of our audit, the staleness detector itself was wrong once. It flagged a ticket as obsolete, and a second, independent check proved the flag false. The instrument that finds rot can rot. So a suspicion mark lowers confidence, and a human, or an executing agent, verifies at the read point before anything is closed or rewired. Trust the smoke detector to wake you, not to put out the fire.

## The parts are forty years old

None of the ingredients here is new, and pretending otherwise would be poor engineering. AI researchers built [truth maintenance systems](https://www.sciencedirect.com/science/article/abs/pii/0004370279900080) in 1979: networks of beliefs with recorded justifications, where retracting a premise invalidates exactly what depended on it. Manny Lehman wrote in 1980 that every real-world program embeds assumptions the changing world silently invalidates; he was describing programs, and the same law governs plans about programs. Modern build systems recover from exactly this problem with verifying traces, a record of what was checked against what, re-validated at read time; the commit stamp above is that idea wearing work clothes. Even the leases come from distributed systems, improved for this domain by expiring on observed change rather than on a timer.

What the parts never did is get pointed at the plan. We aim all of this discipline at code and let the artifact that steers the code rot on a corkboard. The assembly is the contribution: enumerate the plan's read points, write invalidation at knowledge-creation time, verify at read time, and stamp verifications so staleness becomes a query over git history instead of an opinion.

## Why this matters more right now

Execution is getting cheap. Coding agents can burn through a well-specified batch of tickets overnight, which quietly moves the bottleneck to a place nobody is watching: deciding whether the tickets are still true. An agent pointed at a stale premise does not hesitate the way a human might; it executes the note as written, at machine speed, and delivers you a beautifully implemented answer to last month's problem. The faster execution gets, the more expensive every expired belief becomes. Fresh plans were always worth something. A cheap workforce makes them the whole game.

## Try it this week

You can start with one project and zero new tools.

1. Add the two questions to your ticket template: "invalidates what?" and "depends on what?" One line each.
2. The next time you verify any ticket is still valid, write the commit SHA into it.
3. Before you start your next batch of work, run the `git log` check on just those tickets. Re-check the ones whose code has moved, and only those.
4. The next time you make a scope-changing decision, write one line naming the tickets it touches, at the moment you make it.
5. When something is flagged as stale, verify before you act. The detector earns trust slowly and loses it in one false alarm.

That is all Read-Point Planning asks: two sentences at write time, one command at read time. Expect what we found, that a quarter of your notes are expired, that a few tickets are already done, and that at least one real blocker is hiding behind a belief nobody has checked since spring.

Your plan was never going to stay true by itself. It is a cache. Caches are wonderful, as long as somebody invalidates them.
