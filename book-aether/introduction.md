# Introduction

You already know how to write a backend service. You can model a domain, wire a
database, expose an endpoint, and reason about what happens when a call fails. This
book assumes that fluency, and one thing more: that you have met Java Backend Coding
Technology, the functional style built on `Result`, `Option`, and `Promise`, where
answering a request means gathering knowledge step by step, and a failure is itself a
piece of that knowledge, carried as an ordinary value in the return type rather than
thrown. If that style is new to you, read the JBCT book first. Part 0 recaps its
essentials in a single sitting, as a reminder rather than a first lesson.

What you probably cannot do yet is make that service survive the loss of a node,
scale one slice to fifty instances while another idles at one, recover a half-finished
payment after a restart, or ship a new version in the middle of the afternoon without
a maintenance window. Those are the problems this book is about. Aether is the runtime
that makes their solutions routine.

The promise is specific. By the last chapter you will turn a working knowledge of
Aether into a senior one: you will architect, build, test, deploy, operate, and extend
real applications, and when the runtime gives you no ready-made answer you will derive
one from the shape of the problem. That last skill is the whole point. A framework
teaches you its API; this book teaches you to read a problem's data flow and see the
structure already in it, so writing the code becomes closer to transcription than
invention.

Every chapter works the same way. It opens with a problem stated in plain domain
terms, takes the problem apart, derives the idiomatic Aether solution, and folds that
solution into one running application. The application is an e-commerce order system:
reserve inventory, charge the customer, arrange shipping. It is small enough to keep
in your head and rich enough that every hard problem in distributed backend work
surfaces in it on its own. The order system is the spine of the book; a few
introductory passages step into other domains, such as logistics or device telemetry,
only to show that a pattern reaches past commerce.

Read the parts in order, with one exception. Part I, "Aether Slice: No Magic," is a
deep dive into what the runtime generates for you and how a slice actually assembles,
starts, and routes a request. It is written for the reader who will not trust what
they cannot see. If you would rather build first and open the hood later, skip it and
begin at Part II; the chapters that follow link back to it wherever the machinery
matters.

One rule runs through the whole book: every rule it hands you carries its reason. A
convention with no stated cause is one you cannot judge, adapt, or defend in a review,
so each arrives with the technical or organizational fact that earns it. And where
Aether has no built-in answer, the book says so and builds the answer in the open,
with code that compiles and tests that pass.

Java began as a language for managed environments. The next part makes that case and
lays down the small vocabulary the rest of the book is built from.
