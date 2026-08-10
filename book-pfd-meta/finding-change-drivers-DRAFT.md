# Finding Change Drivers — section draft

> Status: DRAFT for the consolidated PFD pass. Target home: Foundations (after the telescope +
> cohesion test) or Architecture Synthesis. **SRP-free** (Loth's *Why SRP Is Wrong* refutes the
> one-reason cardinality claim; see the reviewer-feedback decomposition thread). Manuscript em-dash
> style used here.

## The gap this closes

The cohesion test — *does one change force all of these, and only these?* — tells you whether a
grouping is right. It does not tell you how to find the **change driver** in the first place. That is
the residual judgment the methodology leans on, and this section attacks it directly: where change
drivers come from, how to find them at the desk and measure them in an existing codebase, and the one
mistake that masquerades as finding them.

## What a change driver is (one line)

A change driver is a *reason code changes* — a force that, when it moves, forces the code to move with
it. A boundary is correct when everything inside it changes for the same reason, and nothing outside it
changes for that reason.

## The convergence (corroboration)

Three independent derivations, across five decades, reach that criterion from different directions:

- **Parnas (1972), information hiding** — decompose by hiding the design decisions *likely to change*;
  the module list follows the change list, not the flowchart.
- **Löwy, *Righting Software*** — decompose by *volatility*, not by function: encapsulate what varies,
  leave the nature of the business alone.
- **Loth, Independent Variation Principle** — partition by *change-driver assignment*: unify
  same-driver elements, separate different-driver ones; the partition is a fact about causal structure,
  not a preference.

This is a *second* convergence, complementing the practitioner convergence the book already anchors on.

## Finding them: two modes

### Ask forward (at the desk)

The primary question, where all three derivations converge:

> **Who, or what, would ask for this to change?**

Each independent decision authority is a change driver: a stakeholder/team, a regulator, an external
partner on its own release schedule, a pricing/commercial policy, a technical concern (storage,
transport). Two independent authorities able to demand changes to the same unit = two drivers = a split.

Supporting questions:
- **Parnas** — what is the riskiest, least-certain decision here, the assumption that would ripple
  widest if it changed? Name it; hide it.
- **Löwy, two axes** — what changes for one customer *over time*? what differs *across customers* now?
  Anything mapping to neither is not volatility; it is functional decomposition in disguise.
- **Löwy, solutions-masquerading-as-requirements** — when a requirement is really one possible solution
  ("we need a cooking module"), the underlying need ("feed the user") is the volatility to encapsulate.
- **Löwy, competitor test** — would a competitor in the same domain use this component identically? If
  yes, it is the nature of the business — do not encapsulate it. If no, the delta is the driver.

### Measure backward (existing codebase)

The git history records how the system actually changed.
- **Co-change / change coupling** — files that change together in the same commits share a driver. Rule
  of thumb: co-change in more than ~30% of the commits that touch either file. If those files live in
  different modules, a driver is cutting across your boundary.
- **Hotspots** — rank files by (change-frequency × size); the top is where drivers concentrate, the
  first place to look.
- **Read it with one correction: co-change is partly endogenous.** Files change together partly
  *because the current decomposition forces them to*, so raw co-change is downstream of the structure
  it is being used to judge. Measure the co-change that **crosses a boundary**, and trust the coupling
  that **survives a known restructure** — what vanishes with the restructure was an artifact of it.
- Tools: `code-maat` automates the coupling analysis; group commits by author in a 24h window first to
  tame messy histories. The measurement is not new — logical coupling goes back to Gall (1998) and
  Zimmermann (2004) in the mining-software-repositories literature; Tornhill later productized it as
  change coupling.

Empirical detection turns "where are the drivers?" from speculation into measurement, and lets you
*check* a proposed cut against the system's actual behaviour — provided the check is read with the
endogeneity correction above.

## Where-to-look taxonomy (checklist)

Backend change drivers almost always come from one of:
- **Stakeholder / team** — a group with authority to request changes (the requester question).
- **Regulation** — a compliance regime on its own cadence (PCI, tax, GDPR).
- **External partner / system** — an integration with its own release schedule and contract.
- **Commercial / product policy** — pricing, promotion, eligibility, refund rules.
- **Technical volatility** — storage, transport, serialization: things that vary without the business
  asking.

Cadence is a tell: parts that change weekly do not belong in the same unit as parts that change yearly.

## The guardrail: similarity is not a change driver

Two pieces of code that look alike — even identical today — may answer to different drivers; merging
them couples what the domain leaves separate. Before extracting shared code, ask *"do these change for
the same reason?"* If not, leave the copies apart.

The converse is worth stating, because the first half is easy to over-read: a cohesive unit may
legitimately answer to *more than one* change driver. An **adapter** between two interfaces changes when
*either* interface changes — it carries both drivers by its nature, and splitting it to separate them
would destroy the mediation it exists to provide. That is not a fault to fix; it is **essential
coupling** at a boundary, the dual of a workflow's shared state machine. What makes a unit cohesive is
not the *number* of drivers it carries, but that they are exactly the drivers its job requires — and
nothing else.

## The organizational diagnostic

The requester question makes change drivers organizational: an authority that requests changes is
usually a team. So change-driver boundaries and team boundaries should coincide. When they persistently
diverge, the symptom is concrete — cross-team coordination for single features, co-change clusters that
straddle teams, and (load-bearing) **sagas forced across team-owned service boundaries**. Detection
loop:
1. Run co-change analysis on the git history.
2. Map the co-change clusters to teams.
3. A cluster straddling two teams is a Conway signal: the wrong unit is the boundary of ownership.
4. Realign (inverse-Conway: shape teams to the change-driver boundaries) or split by a genuine cadence
   difference.

Framing: this **requires attention** — a flag to investigate, not a verdict (org structure also
reflects skills, geography, history). In scope, because the symptom is a *workflow-altitude saga*.

## Worked example: Order / Stock / Catalog

A checkout must create an order, reserve stock, and price from the catalog.

- **Noun cut (entity-first):** `OrderService`, `StockService`, `ProductCatalogService`. Checkout now
  spans three services, so one business outcome needs a cross-service saga to hold together — and
  `OrderService` becomes the system's heaviest hotspot, because promotions, fulfilment, and payment
  retries all touch "Order" while answering to different drivers. The saga is the symptom; the cut is
  the cause.
- **Driver cut:** "Order", "Stock", "Catalog" are *nouns* (data); "checkout", "replenish", "reprice"
  are *verbs* (change drivers). The checkout transaction (reserve and place) is a single **use case** —
  the transaction's consistency boundary — so its data stays co-governed and there is no saga. Pricing
  answers to its own driver (the pricing team's cadence) and replenishment to another (operations'
  cadence); each is a separate service reached through published *facts*, never reached into inside the
  checkout transaction. The cross-service saga disappears because the transaction no longer crosses a
  boundary.

The lesson, once: **cutting by noun fragments one change driver across services; cutting by driver keeps
it whole.**

## Desk checklist (summary)

1. Who would ask for this to change? (independent authorities = drivers)
2. What is the riskiest decision that would ripple if it changed? (Parnas)
3. What varies over time for one customer, and across customers now? (Löwy two-axis)
4. Is a stated requirement actually one solution hiding the real need? (Löwy)
5. Would a competitor use this identically? (Löwy — nature of the business vs the delta)
6. Before deduplicating: do these change for the same reason? (guardrail)
7. Does the git history show these changing together? (empirical check)
8. Do our team boundaries match the change-driver boundaries? (Conway diagnostic)

## Author note (caveat)

Use the **convergence**, not any single author's full method — Löwy's volatility-based method (IDesign)
is borrow-the-insight, not adopt-wholesale. The strength is that independent derivations agree on the
core.
