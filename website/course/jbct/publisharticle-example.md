---
reviewed-at: 53c9d127989bef2998f7f17f21577875d6caa038
---

## blurb
The Condition pattern in a real workflow: routing an article's approval path by author tier.

## learn
- Condition pattern: routing by author tier
- Each branch runs a different workflow
- A switch expression returns the same type from every branch

## exercise
### Route Your Own Workflow | ~15 min
Find a place in your codebase that branches on a status, tier, or type field using if/else chains.
Rewrite it as a switch expression, one case per branch, each returning the same type - matching
PublishArticle's author-tier routing.
