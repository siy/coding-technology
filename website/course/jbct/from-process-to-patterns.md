## blurb
How a business process becomes a data dependency graph, and why pattern choice follows from it.

## learn
- The process as the unit of design, not shared entities
- Backend processes as knowledge gathering
- The data dependency graph (DDG) and its mapping to JBCT patterns
- The telescope: how workflows, subsystems, and systems emerge
- What earns a place in code: workflows, entities, shared modules
- Hide the machinery, keep the meaning: the inventory of business facts the code preserves

## note
Conceptual - no code by the end of this lesson. Read it slowly: every pattern lesson later in the
course refers back to the data dependency graph introduced here.

## exercise
### Map Your Own Process | ~20 min
Pick one backend endpoint or workflow you maintain. Sketch its data dependency graph: what does each
step need, and what does it add to the accumulated knowledge? Note where the process could stop early
versus where it must gather everything before it can answer.
