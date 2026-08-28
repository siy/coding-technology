---
title: "Software's Second Free Lunch"
description: "Development doesn't scale, and AI doesn't fix it. Borrow the trick that makes GPUs scale, uniform and independent parallel units, and it does."
tags: [softwareengineering, architecture, softwaredesign, programming]
canonical_url: https://pragmatica.dev/articles/softwares-second-free-lunch
published: true
---

# Software's Second Free Lunch

Two decades ago Herb Sutter wrote ["The Free Lunch Is Over"](http://www.gotw.ca/publications/concurrency-ddj.htm). The lunch was hardware: for years you could write ordinary single-threaded code and wait for next year's faster chip to speed it up, for free. Then clock speeds stalled, and the bill arrived as an instruction. If you want more performance now, you have to parallelize your code.

There is a second free lunch, and it has been running much longer. It is the belief that you can scale software development by adding developers. It is ending the same way Sutter's did, for a structurally identical reason, and the bill reads almost the same.

## The problem is scaling

Strip the topic down and it is one word: scaling. Not the software's runtime scaling, the familiar kind, but the scaling of the act of building it. You would like output to grow with the size of the team, and it does not. Fred Brooks named the failure fifty years ago: adding people to a late project makes it later. The cause was never idleness. It was communication. Put n people on one tangled task and the pairs who must coordinate grow as n(n-1)/2, so past a small team most of the added labor goes to keeping everyone consistent rather than producing anything.

The reflex answer today is not "add people." It is "add AI." And it is worth being blunt about this, because AI is sold as the thing that finally makes development scale, and it does not. AI attacks the cost of a single worker. Each agent writes code faster and cheaper. It does nothing to the coupling that caps how many workers can help at once. Point a swarm of agents at a tangled system and you get Brooks amplified: merge conflicts, agents holding inconsistent pictures of the same design, the quadratic coordination surface fully intact and now without even the tacit human coordination that used to soften it. The fundamental limiter stays exactly where it was.

So both easy answers fail for the same reason, and naming it is the whole point of what follows. Development does not scale because the work is coupled. Until that changes, more workers, human or synthetic, buy less and less.

## We have tried to scale, and we know how it goes

Every serious attempt to scale development is, underneath, a way of partitioning the work so that pieces can proceed at once. Microservices cut the system into services and give each to a team. Vertical slices cut by feature. Domain-driven design cuts by bounded context. Offshoring cuts by handing whole areas to another building. They differ in the cut; they agree in the strategy.

They also tend to stall in the same place, and it is instructive. They partition by the wrong key. Cut by noun, by domain object, by a service boundary drawn on a whiteboard, and the pieces you get still change together, because the thing that actually forces code to change was not what you cut along. So the parts stay coupled across the new boundaries, the coordination you tried to remove reappears as cross-service choreography and shared databases and integration meetings, and Brooks collects his tax through the back door. The partition was real; the independence was not.

## Borrow the trick that actually scales

There is a kind of computing that scales almost perfectly, and the reason is worth stealing. A GPU gets its throughput by demanding two things of the work: that the pieces be **uniform**, the same operation shape repeated, and that they be **independent**, needing little or no communication with each other. Give it work with those two properties and it runs thousands of pieces at once. Give it tangled or divergent work and it crawls. The hardware did not invent parallelism; it insisted the *work* be shaped for it.

Shape development the same way and it parallelizes the same way. Split the design into units that are as uniform and as independent as you can make them, and you can run them at once across as many builders as you have, human or agent, because the builders barely need to talk. That is not a new wish. Shared-nothing architectures, embarrassingly parallel workloads, and vertical slices are all reaching for it. What has been missing is a reliable way to actually get the two properties, rather than draw a boundary and hope.

Independence comes from cutting along the right key. Attribute each use case to the change driver that moves it, group the ones that share a driver, and let groups meet only through stated contracts and a few named coordination points. Now two units that change for different reasons have no shared code to collide in, and the coordination that generated Brooks' quadratic simply has nothing to attach to.

Uniformity comes from building every unit out of the same small structural vocabulary, so any builder can pick up any unit and already know its shape. This is where a disciplined implementation earns its keep: when every unit looks alike, onboarding to a unit costs almost nothing, and a worker is fungible across the whole system rather than trapped in the one subsystem they happened to learn.

And it goes deeper than the use case, which is the part that surprised me. Inside a single use case the steps share only their typed input and output. That makes them independently buildable even when they are not independently *runnable*: a chain that executes strictly in order, A then B then C, still has three pieces that three people can build separately, because each needs to know only its own input and output type and the composition wires them together. Development parallelism is not runtime parallelism. So the grain is adjustable, use case or step, and the finer you cut the more parallel you go. The cut is not free, defining an intermediate type is its own small tax, so there is an optimal grain the way a GPU has a thread-launch overhead. A uniform implementation is what keeps that per-cut tax down to little more than a type signature.

The payoff is the list you would expect from the GPU: near-zero onboarding, workers you can reassign for free because the units are interchangeable, a team you can grow without the coordination explosion. And notice who the ideal worker now is. A cheap, fungible, zero-onboarding worker that executes a well-specified unit and needs no water-cooler context is exactly what an AI agent is. AI was never the parallelization strategy. It is the workforce that strategy unlocks, and it is why doing this is worth more now than it has ever been.

## The bottleneck this uncovers

Push development parallelism to its limit and the ceiling does not disappear; it moves. When coding no longer bottlenecks, the thing that does is the act of deciding the decomposition itself. And here a second quadratic lies in wait. Judged the usual way, deciding whether a set of use cases is cohesive is a pairwise question asked of every pair, which grows with the square of their number and is re-argued every time the system does. Solve coding-scaling and you would simply hit design-scaling instead, having moved the wall rather than removed it.

The same key that bought independence pays this debt too. Because each use case is attributed to its own driver rather than weighed against every other, grouping becomes a labeling pass and a sort instead of an all-pairs comparison, and the cost of keeping a decomposition coherent grows quasi-linearly with the number of use cases rather than quadratically. Design scales. Both layers scale now, and what is left strictly serial is only the derivation, the act of deciding the cuts and the contracts. Set those, and everything below is parallel all the way down.

## Does this contradict Brooks? No.

It confirms him. Brooks' law is dominated by two costs, ramp-up and communication. Uniformity drives ramp-up toward zero; independence drives communication toward zero. Brooks even named the escape himself: people and months become interchangeable, he wrote, when a task can be partitioned among workers with "no communication among them." That is not a loophole in the law. It is a condition the law states outright, and the method is built to meet it on purpose.

What governs the work once you have stepped out of Brooks' regime is a different law, Amdahl's. The speedup is bounded by the fraction that stays serial, and that fraction is now just the derivation plus the shared kernel and the final integration. Because the derivation itself was made quasi-linear, that serial fraction is small, and a small serial fraction is exactly what a high ceiling looks like. Less Brooks, more Amdahl, and that trade is the entire reason it scales.

## The lunch

The second free lunch is not that development became free. It is that the workforce did. A cheap, endlessly available, zero-onboarding workforce now exists, and the only thing standing between it and a system is whether the work has been shaped into pieces it can take independently. That shaping is the price of the lunch, and it is a design problem, not a model problem.

Sutter's bill said: parallelize your code. This one says: parallelize your development. It turns out to be the same recipe, uniform and independent pieces run in parallel, and it was always going to be, because the constraint was never really about silicon or about people. It was about coupling.

The method, and the worked derivations behind it, are at [pragmatica.dev](https://pragmatica.dev/).
