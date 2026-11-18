---
title: "Design Metaprinciples: Less Art, More Engineering"
description: "Principles shape a design; metaprinciples shape how the principles are chosen. Five of them, each explained with one ordinary thing: a train."
tags: [softwareengineering, architecture, programming, design]
canonical_url: https://pragmatica.dev/articles/design-metaprinciples
published: true
---

# Design Metaprinciples: Less Art, More Engineering

Software developers love principles, and for a good reason: principles shape how a design is created. They say what to do, what to avoid and, ideally, why. Metaprinciples sit one level up. They shape how the principles themselves are chosen, and they should answer the same "why?" for the whole set.

Below are the five metaprinciples that govern the systems I design. To keep them on the ground, I will explain all five with one ordinary thing: a train.

## 1. One answer per question, or an explicit refusal
### Determinism with its honesty clause

Nobody at a railway decides how far apart the rails should be. That question was answered once, the answer is called the gauge, and because of it any car can run on any line. Where two gauges meet, everything stops: the cargo is moved or the wheels are changed, and the whole journey waits for it. That is the price of having two answers to one question.

Our work consists of decisions, a lot of them, and each decision is overhead. When there is a good way to do a thing, we choose it once and the decision space shrinks by one level. The fewer decisions we have to make at the low level, the more time we have for the decisions at the higher one.

The second half of the rule is the red signal. A train that does not know whether the track ahead is free does not guess, it stops. When the one way does not fit, the honest outcome is a refusal, not a second way invented on the spot. An honest refusal is a great indicator of a knowledge gap: it marks the exact place where something is not yet known.

## 2. Boundaries fall where forces diverge
### Change drivers first among the forces

A train travels a long way as a whole, and for all that way we can treat it as one simple, indivisible unit. Then, at some junction, each car has to go in its own direction, and there we see that there were boundaries between the cars all along.

Nobody places the couplings by taste. They are where the train will have to come apart, and nowhere else: a coupling in the middle of a car would be absurd, and two cars welded together would be a problem at the first junction.

A design works the same way. While everything moves together, a boundary earns nothing. It matters at the place where the parts are pulled in different directions, and the most common pull is change: the parts that change for different reasons are the cars that will part.

## 3. Every claim is written where it can be proven wrong
### Honest guarantees, widened

A railway makes two kinds of statements. One is on the poster: "fast, comfortable, reliable service". The other is on the timetable: "arrives 14:32, platform 4". The poster survives any outcome, so it tells you nothing. The timetable can be proven wrong by anyone with a watch, and that is exactly why you can plan your day around it.

A claim about a system is worth as much as the ease of catching it being false. "Highly available" is the poster. "Keeps accepting writes after the loss of one node out of three" is the timetable. The second one can fail tomorrow, in front of everyone, and so it is the only one of the two that carries information.

The place matters as much as the wording. The timetable hangs on the platform, next to the clock and the track. A claim should live where the thing that can contradict it also lives: in a type, in a test, in a measured number, and not in a document nobody runs.

## 4. Nothing unforced
### The answer is the minimum the evidence forces

Every car in a train is there because something has to be carried. An empty car attached "just in case" carries nothing, yet it is pulled the whole way, it burns fuel, and it is switched at every junction along with the rest.

Everything in a design gets read, maintained and asked "why is this here?". If the answer is "this requirement forces it", the question closes in one step. If there is no answer, the question stays open for every person who comes later, and each of them pays to discover that there was no reason.

This is not minimalism as taste. A long train is fine when there is a lot to carry. The evidence sets the size, in both directions.

## 5. Impossible beats forbidden
### Structure enforces; policy doesn't

A road tells the driver where to go with lines and signs, and the driver has to watch them every second. A locomotive has no steering wheel. Nobody forbids the train to leave the track, it simply cannot, and so the question never takes any of the driver's attention.

A rule that forbids a wrong choice has to be remembered by everyone, every time. A structure that makes the wrong choice impossible has to be built once. When some wrong choices cannot be expressed at all, nobody has to watch for them, and the mental overhead of guarding correctness goes down.

## One train

The five are not a list to memorise. They are five questions asked of every design decision: how many ways, where to cut, what may I claim, how much, and how to enforce. A railway answered each of them long ago, which is why a train is boring in the best sense of the word. That is what I want from software.
