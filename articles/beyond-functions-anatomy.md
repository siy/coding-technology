---
title: "Beyond Function's Anatomy"
description: "One-item processing is a graph of data dependencies before you write a line of it. Ordinary code hides that graph. Code built from a handful of patterns says it out loud, and the saying is what pays."
tags: [java, architecture, softwaredesign, programming]
canonical_url: https://pragmatica.dev/articles/beyond-functions-anatomy
published: false
---

# Beyond Function's Anatomy

A few years ago I wrote about the anatomy of a function. The claim was small: look inside almost any function and the same phases show up in the same order. Here is the example that article used, an ordinary Java method that adds a comment to a publication.

```java
public Comment.Id addComment(User.Id userId, Publication.Id publicationId, String text) {
    if (userId == null || userService.find(userId) == null) {
        throw new UnknownUserException();
    }
    if (publicationId == null || publicationService.find(publicationId) == null) {
        throw new UnknownPublicationException();
    }
    if (text == null) {
        throw new InvalidComment();
    }

    var comment = Comment.newComment(userId, publicationId, text);

    return commentService.addComment(comment);
}
```

The phases are visible once you look for them. **Validation** checks the arguments, which is everything down to the last throw. **Consolidation** gathers what the work needs, which is the comment being assembled. **Action** does the thing the method is named after, which is the final line. A fourth, **Reaction**, adapts values to the contract and is smeared across the whole body: here it is the three throws and the return.

The article ended with a mild suggestion. If a phase is doing enough work to notice, give it its own function. The phases are defined relative to the Action, so a Validation that moves out stops being a Validation and becomes an Action of its own, in a function named for it.

I did not know what I was opening. Do that consistently, everywhere, for a while, and you look up one day and the interesting thing is no longer inside any of the functions. It is above them.

## The shape that keeps showing up

Take any processing that fits one sentence: receive one item, process it, produce a result. A backend request. A command line invocation. One message off a queue. This is a large fraction of what backends do all day.

The suggestion on its own gets you smaller functions and nothing else. Three further decisions do the real work. Failures come back as values instead of being thrown, so what a step can do to you is in its return type. Each function does one thing, so a node has one job rather than an agenda. Steps that need nothing from each other are kept separate rather than merely adjacent, so independence survives contact with the code.

Apply all four to the method above and the phases come apart into named functions. Only the signatures matter here:

```java
Result<UserId>        userId(String raw);
Result<PublicationId> publicationId(String raw);
Result<CommentText>   commentText(String raw);
Promise<User>         findUser(UserId id);
Promise<Publication>  findPublication(PublicationId id);
Promise<CommentId>    storeComment(User user, Publication publication, CommentText text);
```

Read them and the wiring falls out without being written down anywhere. Nothing connects the three parsers; each takes a raw string and hands back one checked value. `findUser` needs what `userId` produced. `findPublication` needs what `publicationId` produced, and nothing from `findUser`. `storeComment` needs all three of the things that survived.

The first article had a name for the values a function collects before it can act: its *data dependencies*. Inside a single body they are hard to see, just a stretch of lines between the checks and the work. Pulled out into functions they become the only relation left between the pieces, and the relation is always the same one. This operation needs what that one produced.

Do that to one method and you have six functions. Do it to a hundred methods and something else shows up: you keep assembling them the same few ways. The three parses run independently and their results are joined. So do the two lookups. The method as a whole runs its steps in order, and it runs them in that order because each step needs what the one before it produced. Nothing else imposes the sequence. Work through enough use cases and you notice that functions keep taking the same shapes. Besides that step-by-step, there are five: a function that does the work itself and calls nothing further; independent steps run at once and their results joined, which the parses and the lookups above already are; a choice between branches; a repetition over a collection; and a wrapper that adds something around a step without changing what the step does. So far no others have turned up.

Java Backend Coding Technology names them: Leaf for the function that does the work, and Sequencer, Fork-Join, Condition, Iteration and Aspects for the ways work gets assembled. Whether it is exactly six matters less than that it is small and stops growing.

![The catalog applied to the six functions. The spine on the left is the Sequencer, three stages in the order the dependencies force. Two of those stages are Fork-Joins, marked all, because the three parses need nothing from each other and neither do the two lookups. The six leaves on the right are the graph's six operations, and everything left of the dashed line is the routing that assembles them, which is not an operation and is the subject of a later section.](/image/beyond-functions-assembly.svg)

The patterns are what turn a pile of functions into a shape, because each one already says how results move through it. A Sequencer says this feeds that. A Fork-Join says these need nothing from each other and their results meet here. Assembling patterns is therefore the same act as drawing edges, and you are doing it whether or not you are thinking about it. Compose them over a whole use case and what you are holding is a graph. Nodes are operations. Edges are data dependencies. Six nodes and five edges in the example. A real use case has many more, built out of the same catalog.

Nobody designs that graph, and nobody invented it. It is what the processing is. The work has these steps, they need each other in this order, and that holds before any of it reaches a keyboard. The imperative method at the top of this article runs the same graph. It declines to say so, keeping the dependencies tangled through control flow and unavailable to you or to a tool. The four decisions change one thing, which is whether the graph is written down.

It is acyclic, because within one item nothing depends on itself. It has one entry, because there is one item. It has one exit, because there is one result.

Exposure is what everything below rests on. These are properties of code that shows the graph, not properties of request handling in general, and looking for them in code written the usual way is a good way to conclude that I am making things up.

## It stays small

The first surprise is the size. However complicated the processing is, the graph does not get deep, because the problem gets simpler as you descend. The top level is the whole use case, which is genuinely complex. One level down, each node is a step with a name and a contract. Another level down, a step is three things in sequence. Keep going and you run out of problem.

At every level you are looking at a handful of things at once. The number stays small because each level hands its detail to the one below it. Twenty nodes on a level means the level below was skipped.

That gives a diagnostic, once you subtract the genuine cases. Some leaves are hard because the algorithm is hard: compression, parsing, scheduling, anything whose difficulty is the work rather than the arrangement. Decomposition does not touch those and should not be asked to. What is left is the other kind, a leaf that is complicated because it is doing several things, and that one is a bug report about the level above it, saying a decomposition did not happen.

## There are exactly two kinds of code

Look at the graph and the code splits cleanly in two, with nothing in between.

There are leaves, which do the work. They compute, they call the database, they talk to the payment provider. Everything the system actually does is in a leaf.

And there is everything else, which routes. Interior nodes take what came in, hand it to the right places, and pass results along. They make no decisions of their own. They are wiring, and the wiring is the five assembly patterns and nothing else.

Once you see that split you cannot unsee its consequence. The routing part is drawn from a finite catalog, so it is mechanical, so it can be generated, and correctly. The thinking does not disappear, it moves to two places: deciding what the graph is, and writing the leaves. Neither of them is the router. Those two are also where review effort belongs, and where it usually is not spent.

## Reading it

The router reads top to bottom in the order things happen. There is nothing to chase, no dispatch to resolve first, no framework deciding where control goes.

And you can read one level and stop. Each level is complete at its own altitude, so understanding a use case does not require descending into it. You read what the steps are and what feeds what, and that is the use case. The insides are somebody else's afternoon.

Cross cutting concerns end up with exactly one home. Since routers do nothing themselves, anything that has to happen around the work attaches at a node boundary. Retry, metrics, timing, all of it goes in one kind of place instead of being sprinkled through the parts that were supposed to be business logic.

Concurrency stops being a decision. Two nodes are independent or they are not, and that is a fact about the graph rather than an opinion about performance. Nobody has to ask whether something should run in parallel, which is a relief, because that question has never once been answered calmly.

## Debugging it

Log the input and output of every leaf. The routers need no logging, because they do nothing worth recording, and the leaves are where everything happens. That covers every effect the system has, which is a smaller claim than covering every question you might ask: a hard algorithm inside a leaf still needs its own diagnostics. What it buys is that the instrumentation you write is proportional to the number of leaves, not to the size of the codebase.

What you get back is a log with the same shape as the code. A trace reconstructs the graph, so you read the log against the source directly instead of trying to imagine which path produced it.

Meanwhile the stack trace loses most of its value. A stack trace answers "how did I get here". With a graph, nobody is asking. A leaf is a function of its input, so the only two things worth knowing are which leaf and what it was given. The first can travel in the failure value. The second is in the log.

Put differently, a stack trace gives you the route and not the cargo. It is a list of places the failure has been, with all the values carefully removed.

There is a pleasant side effect. Since a leaf is a function of its input, a logged input and output pair is a ready made test case. You reproduce the bug by running the leaf on the logged input, and the logged output is the assertion. The regression test writes itself, which is the only kind of regression test that reliably gets written.

Small leaves also make maintenance cheap in two separate ways that are easy to conflate. Finding the defect is bounded by how small the leaf is. Fixing it is bounded by the leaf's contract, because a typed signature stops a change leaking out of the node. Small alone buys you the first. The type buys you the second.

## Changing it

The graph is a simplified picture of the business process. Simplified in a specific way: it is the process with everything that is not data flow removed. No actors, no timing, no negotiation, no org chart. What is left is what the work needs and in what order.

So when the business process changes, the graph changes. That much is unremarkable, since all code changes when requirements do. The useful direction is the other one. A change to the graph that no process change explains is worth looking at, because you are adding structure the process does not have, and that structure will be there long after you have forgotten why.

This is the honest version of the debt claim. Nothing enforces the correspondence. If the process moves and the graph does not, that gap is the debt, and it is real. What the shape buys is narrower than it sounds: the debt is visible and it is located. Whether it is cheap depends on what drifted. A step that moved is a small change. A shared type sitting at the wrong altitude, or a leaf built on the wrong algorithm, costs here what it costs anywhere. What you get is being able to see which of those you have, instead of finding out later.

## Where this does not apply

Two preconditions, and both matter.

The first is the item boundary. One item in, one result out, no dependence on other items in flight.

The second is the discipline, and it is the one that gets skipped. Several of these properties are not paid for by the graph alone. The fix stays inside the leaf because the signature is typed. Failures reach one place because they are values and not exceptions. A logged input reproduces a leaf because the leaf holds no hidden state. Take those away and the graph is still there, and most of the pleasant consequences are not.

Take the item boundary away and the per-item graph stops being the right model. Aggregation across items, long running state machines, anything where the answer depends on what else is in flight: the dependencies are still there, but they are no longer a structure you can read off one item, and the properties above stop following. Sometimes the repair is to redefine the item as the batch or the session being coordinated, and then the model fits again. Know that before you go looking for a graph in a place that does not have one.

## So what

None of this was designed. It is what the work already looked like. A small idea about the inside of a function, applied long enough, wrote it down.

The phases were the interesting part in the first article. They are not the interesting part anymore. The interesting part is the shape above them, which was there before anyone wrote a line of it and which determines how the code reads, how it is tested, how it is debugged, and what a change costs.

Which leaves the practical question. The graph is there either way. The properties are not, and they arrive only when the code is written to expose it. The rules written down, the patterns named, and a tool that checks whether you actually followed them: that is Java Backend Coding Technology, and the [book](https://pragmatica.dev/java/jbct/) is free to read on the site.
