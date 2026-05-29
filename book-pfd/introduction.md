# Introduction

*Software design is the last craft in the building. The chips were standardized, then the languages, the protocols, the deployment — and the shape of the code was left to taste, so that the same business problem yields a different structure in every shop and every sprint. This book is about the part that never got standardized, and the quiet evidence that it is standardizing anyway.*

---

## The thesis

Process-First Design is a way of deciding what software is made of. Its claim is one sentence: **the unit of design is the process, not the entity** — what the software *does*, not what it *is*. You design a thing that happens, a trigger producing an outcome, and you shape the data around the processes that use it rather than around a model of the domain that exists before any use.

That is a small statement with a large consequence, because the dominant tradition runs the other way. Entity-first design starts from a shared model of each domain concept — one `Customer`, one `Order`, one `Product` — and builds behavior on top of it. Process-first inverts the order: the process comes first, and types belong to processes. A "customer" in one process is the shape that process needs; what is genuinely common across processes is a small, shared kernel of value objects, and nothing else is shared by default.

The book's subtitle is *less art, more engineering*, and it is meant literally. Most of what makes software design feel like art is the absence of a method for the decisions it forces — so the decisions get answered by taste, and taste varies by person, by mood, by deadline. A method does not remove the judgment that genuinely belongs to design; it removes the judgment that never should have been judgment, the dozen small structural decisions that have a right shape and were being re-litigated every time. What remains for human judgment is the part worth a human: the architecture, the domain, the hard trade-offs. The mechanical part becomes engineering.

This is the methodology layer. It is language-neutral: the principles hold in Scala, Kotlin, Rust, C#, TypeScript as readily as in Java. Where the book shows code, it shows Java, because the Java implementation — Java Backend Coding Technology — is the most fully developed instance and the audience is largely Java. But the methodology is the *why*; JBCT is one *how*. A reader can adopt process-first design in any of those languages without opening the JBCT book.

---

## A convergence, not an invention

The methodology does not claim to have discovered process-first design. It claims to have *named* something practitioners keep arriving at independently.

Across the last several years, designers working in different languages, different domains, and different communities have converged on the same structural move: organize around business operations rather than shared entities; shape types to the process; compose small, pure, well-typed operations instead of layering services over a data model. Scott Wlaschin reached it in F#, modeling domains as workflows with typed inputs and outputs. Debasish Ghosh reached it in Scala through algebraic composition. Jimmy Bogard reached it in .NET by organizing code in vertical slices. Sandro Mancuso reached it from craftsmanship, letting the domain emerge from use. Rico Fritzsche reached it building capability-owned processing units. None cites the others as the source; they were solving the same problem and the same structure fell out. From a different direction entirely — formal rather than empirical — Yannick Loth's Independent Variation Principle reaches the same partition by asking what causes each element to change. The full survey of this convergence is a story in itself, developed in the author's *The Quiet Consensus*; here it is enough to know that the convergence exists and that it is wide.

That convergence is this book's anchor, and it is worth being precise about what an anchor is. It is not proof. Six practitioners agreeing does not make a methodology correct; the book's actual case rests on the methodology *working*, demonstrated on real code through the spiral that follows, not on the company it keeps. The convergence does something narrower and still valuable: it suggests the structure is real — discovered, not imposed — because independent people keep discovering it. A method that merely recognizes what good designers already do, and makes it teachable and consistent, is on firmer ground than one inventing a new way to think.

It also reframes what the book is doing. It is not arguing that the industry *ought* to standardize on process-first design. It is observing that the industry is *already* converging on it, and offering a vocabulary for what is emerging. The reader is invited to observe, not to be persuaded — the same way every other engineering discipline industrialized, moving from craft, where each artifact is unique and taste-driven, to standardized practice, where parts are interchangeable and the process is predictable, without ever losing the room for genuine design. The author's *Software's Industrialization Moment* develops that parallel; this book is what the standardized practice looks like for backend software design.

---

## What this book commits to

Five principles run through every chapter. They are stated here and enforced throughout; where the book seems to make a choice, it is usually one of these.

1. **Legibility first.** Code is written to be read — by the next developer, by the author a year later, by the reviewer who met neither. Every structural choice is a concession to that reader. Extra words that aid the reader are purchased legibility, not ceremony.

2. **Show possibilities, don't make claims.** The book describes what the methodology makes possible and demonstrates it on real code. It does not promise productivity multipliers, fewer bugs, or compliance readiness. Where evidence is absent, it says so plainly, and leaves the reader to map the possibilities onto their own situation.

3. **More time for the interesting work.** The discipline offloads the mechanical decisions — where failures live, how state threads through a process — so attention moves up to architecture and domain judgment. Most developers want more of that work, not less; this is how the structure buys it for them.

4. **Methodology fits the work, not the reverse.** The vocabulary scales with complexity. Trivial code stays trivial; the methodology earns its weight only where complexity demands it. It is a tool, not a recipe to be applied at uniform strength to everything.

5. **Show it's happening; don't argue it should.** The book reveals a convergence rather than advocating a position. The reader becomes an observer of something already underway, not the target of a case for adoption.

There is also a discipline of scope, load-bearing enough to state once and keep: this methodology is bounded to enterprise backend software — systems large enough and long-lived enough for structural coupling to become the dominant cost. It does not claim to be the right tool for real-time control loops, numerical kernels, game engines, or throwaway scripts. Knowing where a method does not apply is part of applying it honestly.

---

## The running example

One example runs through the whole book: a ticketing platform. It starts as small as software gets — a customer buys a ticket for a specific seat at a specific event — and grows, pass by pass, into a multi-venue, multi-tenant platform. The domain never changes; only its scope expands.

This is deliberate. A methodology's claims are easy to make on a fresh toy in each chapter and hard to make on the same material at increasing magnification. Carrying one domain up through every altitude — use case, workflow, subsystem, system — is the honest test: the reader watches the methodology handle the same seats, holds, and payments at four scales and can judge whether it holds together or frays. Event ticketing is chosen because it is universally recognizable, because its concepts (seats, holds, reservations, prices, events) are rich enough to exercise every part of the methodology, and because nobody needs a domain expert to follow it.

---

## How to read this book

The book is built to be read in one sitting — start to finish in an afternoon, not a chapter a week. That target is not a courtesy; methodology read in fragments loses its connective tissue, and a reader who cannot hold the whole vocabulary in working memory cannot see the through-line. The structure serves that reading:

- **Spiral 0** comes before any methodology: the decisions a single use case forces, and why you are already answering them. It is the problem the rest of the book solves.
- **Foundations** names the vocabulary — four shapes, six patterns, six properties, the telescope, three recovery classes. Read it once; refer back as needed.
- **The spiral** is the core: four passes applying that vocabulary to the running example at successive altitudes, use case through system. The passes get shorter as they climb, and that is the point rather than an accident — each altitude reuses the vocabulary and adds only its own small delta. By the last pass you will have learned almost nothing new, which is the methodology demonstrating its central claim on itself.
- **Architecture Synthesis** then pays the debts the spiral defers: how to turn a design into an architecture, the full decision framework the passes only gesture at.
- **Brownfield** applies all of it in reverse — to a system you inherited rather than one you start clean.
- **Closing** looks at what the methodology does not cover, and what to expect.

Every chapter names, at its foot, which of the book's narrative threads it advances; a second reading can follow a thread rather than the chapters. The prose keeps a surface that lands on first read, with the deeper structure available to a reader who returns. None of it requires the second read; all of it rewards one.

The spiral begins where the work begins — at the smallest unit of it, one customer buying one ticket. But before the methodology, the problem it answers: the decisions that use case forces whether or not anyone has a method for them.

---

*Threads advanced: 3 (industrialization), 5 (legibility), 11 (the interesting work), 15 (standardization).*
