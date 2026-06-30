# Spiral 0 — The Decisions a Use Case Forces

*Ask three competent teams to build "buy a ticket" and you get three codebases that pass review and disagree on nearly everything that matters. Not because anyone was wrong — because the use case forces a dozen small decisions, every one of them has a defensible answer, and nothing made them answer the same way. This chapter is those decisions, before any methodology is in the room.*

---

## What this chapter does

This is a warm-up, not a pass. The spiral that follows walks a real methodology through four altitudes; before it starts, it is worth seeing the problem the methodology exists to solve — not as an argument, but as a list of decisions you already make.

Take the smallest unit of real work: a customer buys a ticket for a specific seat at a specific event. One trigger, one outcome. It looks trivial. It is not, and the reason it is not has nothing to do with difficulty. The work is easy. What is hard is that the use case quietly forces a series of decisions, each one has several defensible answers, and without a shared method you answer them by instinct — differently on Tuesday than you did on Monday, differently from the developer at the next desk, differently in this use case than in the one beside it.

The chapter walks those decisions. It does not show code, because the point is not that someone wrote bad code; competent people write defensible code for every one of these. **The point is that the decisions are unavoidable and the consistency is not automatic.** That gap is what the methodology closes.

---

## The decisions

**Where do the failures live?** Buying a ticket can fail: the seat was taken a moment ago, the payment was declined, the event closed sales, the customer is not eligible. Those are not edge cases bolted on later; they are part of what "buy a ticket" *means*. So where do they go? Exceptions thrown and caught somewhere up the stack? Error codes returned and checked? A result object carrying success or a named failure? Some of each? Every answer is defensible, and you must pick one — there is no version of this use case that does not decide where failure lives. Most codebases decide it more than once, differently each time, and the documentation drifts from the code the first week.

**Is this "customer" the same "customer" as everywhere else?** The use case needs the customer who is buying. Is that the same `Customer` that registration creates, that profile-update mutates, that billing charges — one shared class used everywhere — or a shape specific to buying? Pick the shared class and it grows a field for every use case that ever touched it, until no use case wants all of it. Pick a local shape and you have to say what relates it to the others. You must decide, and the decision compounds: every use case that mentions a customer inherits it.

**What happens to the reservation when payment fails after it?** To take the money you first hold the seat. Then the payment is declined. Now there is a held seat and no sale. Release it immediately? Leave it for a cleanup job to sweep later? Trust an expiry to handle it? Forget it exists? You must decide — the held seat is real whether or not you decided on purpose — and this is the decision most often made implicitly, which is to say made by whoever later debugs the orphaned holds.

**If the same logic has to fire from a queue tomorrow, what moves?** Today buying a ticket is an HTTP endpoint. Tomorrow a partner integration needs the same booking driven from a message queue, or an admin tool needs it from a script. How much of what you wrote was about *buying a ticket* and how much was about *being an HTTP request*? You must decide where the trigger ends and the business begins — and if you never decided, the answer is "they are tangled," and the second trigger means copy-paste.

**Where do logging, retries, and audit go?** Every operation needs to be observable, some calls need to be retried, money movements need an audit trail. In the method body, inline with the business steps? Scattered across helpers? In a wrapper around the call? You must decide, and without a convention the answer is "wherever each developer put it," which is to say inconsistently, which is to say the observability is uneven exactly when you need it to be uniform.

None of these is exotic. There are five here and the real use case has more. Every one is small. Every one has a reasonable answer. And every one is answered, every time, by everyone who builds the use case — there is no opting out.

---

## You are already answering these

That is the whole point, and it is easy to miss because the decisions feel too small to notice. You are already answering all of them. **The only question is whether you answer them *consistently* — the same way in this use case as the last, the same way as the developer beside you — or *ad hoc*, by individual judgment, freshly each time.**

Without a shared method, it is ad hoc. Not through carelessness; through the absence of anything that would make it otherwise. Each developer answers each decision reasonably, and the reasonable answers differ, and the differences accumulate. The cost is not in any single answer — any one of them is fine. The cost is the *drift*: a codebase where failure lives in three places, where "customer" means four things, where compensation is a pattern in one corner and a bug in another, where half the use cases are weldable to their trigger and half are not. **That drift is what "this codebase is hard to work in" actually is, decomposed.**

This is why architectural arguments feel endless. They are often these decisions, surfaced as preference — one developer prefers exceptions, another result types, and both are defending a reasonable answer to a question that has several. The argument does not resolve because nothing about the question forces a single answer. **What ends it is not winning the argument; it is a method that answers the question once, the same way every time, so the question stops being asked.**

---

## Why the answers can be simple

Here is the part that is easy to disbelieve: the methodology that follows answers every one of these decisions, and the answers are as simple as the questions.

Failures live in the return type, as a closed set of named outcomes the caller must address. "Customer" is a small shared value object where it means the same thing everywhere, plus a shape local to each use case where it does not. The held seat's fate is a named compensation, decided when the use case is designed rather than when it is debugged. The trigger is one of the use case's six properties, named separately from the business so a second trigger costs nothing. Logging, retries, and audit are quarantined — business code stays clean, the runtime supplies them uniformly. Each answer fits in a sentence.

**The simplicity is not a happy accident; it is the mechanism.** A methodology you can apply from memory is one you actually apply — every use case, the same way, without opening a manual. A methodology you have to look things up to follow gets applied unevenly, or abandoned under deadline. The power is not despite the simplicity; it is *because* of it. **Simple decisions, answered the same way every time, are the only kind that get answered consistently across a team and a codebase and a year — and consistency, not cleverness, is what makes a large system stay legible.** The decisions in this chapter are trivial. That is exactly why a small, fixed set of answers can dissolve them.

---

## Into the methodology

The decisions do not go away. There is no design so clever that "buy a ticket" stops needing to know where its failures live or what becomes of a held seat. **The methodology does not remove the decisions; it answers them once, simply, and the same way every time, so that you stop re-deciding them and the codebase stops drifting.**

Surfacing a decision early does one more thing, quieter than consistency: it is a chance to fix the business behind it, not only the code in front of it. The held seat with no sale is a gap in the business process itself, and naming it while that process is still being designed is when it is cheapest to close. **Answering these decisions by construction is a way to harden the business before any of it is written down.**

The chapters that follow supply the answers. The next names the vocabulary — the small fixed set of shapes, patterns, and properties the answers are built from. The spiral after it walks that vocabulary through the same use case you just met, then up through workflows, subsystems, and the whole system, applying the same answers at every scale. Watch, as you read, how few new things you have to learn after the first pass. **That is the methodology keeping the promise this chapter makes: the decisions are small, the answers are small, and small is what lets them hold.**
