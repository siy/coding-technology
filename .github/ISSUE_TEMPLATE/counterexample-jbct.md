---
name: Counterexample report (JBCT)
about: Code where a JBCT rule or pattern makes the result worse, not better
title: "[counterexample] <rule or pattern>"
labels: counterexample, jbct
---

<!-- JBCT has no registered-prediction corpus yet, so reports here are read and
     answered rather than graded against a rubric. Architecture Synthesis
     counterexamples belong in the replication kit instead:
     https://github.com/siy/derivation-artifacts/issues/new/choose -->

## The rule

Which rule, pattern, or forbidden-pattern entry — quoted, with the book section or
skill file it comes from.

## The code

A compiling example, as small as it can be while staying realistic. Real code from a
system you maintain beats a constructed illustration; anonymize freely.

## What the rule produces

The version the rule demands.

## What you would write instead

The version you argue is better.

## Why the rule loses here

Be specific about the axis: correctness, readability, performance with a measurement,
testability, or something else. "It feels heavier" is a starting point, not a
counterexample — name what the reader or the machine actually pays.

## Scope

Is this a bounded exception the book should name, or does it hold generally enough
that the rule is wrong? Both are useful; they get different answers.
