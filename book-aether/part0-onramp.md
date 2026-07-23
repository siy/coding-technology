# Part 0 — On-ramp

## What you already know: JBCT in one sitting

This part is a reminder. If the ideas below are new, the JBCT book teaches them
properly; here they are compressed to the few you will lean on constantly.

Start with the one idea everything rests on: every request is an act of knowledge
gathering. When a request arrives you do not yet know enough to answer it, so you
gather. Parsing the input into a trustworthy value is knowledge about its shape.
Reading a record from a store is knowledge about the world. Applying a rule turns facts
into a decision. Each step adds a piece, and the work continues until you have gathered
enough to respond. "Input, transform, output" is the mechanical description; gathering
knowledge until you can answer is what is actually happening, and it reads the same
whether a step runs in memory or crosses a network.

A failure is knowledge too. "The card was declined" or "that email is malformed" is
something you now know, and usually it is enough to answer the request, with a rejection. This is why a use case treats failures as values
rather than thrown exceptions: a failure is one more piece of knowledge moving through
the pipeline, typed so the compiler and the next reader can both see it. A use case
names its failure modes as a sealed interface that extends `Cause`, so every way it can
end is visible and
handled by pattern matching, not guessed at.

The four return shapes are four kinds of knowledge a step can hand back, and which one
you use is forced by two questions, not chosen by taste:

- `T`: certain knowledge. A value, always.
- `Option<T>`: knowledge that may be absent. Absence is a fact, not an error.
- `Result<T>`: the knowledge, or the typed reason you could not get it, synchronously.
- `Promise<T>`: the same, except the knowledge arrives later. Any input or output makes
  a step a `Promise`, and the `Promise` carries its failure with it.

Two habits complete the vocabulary. Parse, don't validate: a value object is built only
through a factory that validates, so once a `CustomerId` or a `Money` exists, every line
downstream trusts it without re-checking. And the six patterns that cover every data
flow: Leaf (one atomic step), Sequencer (this, then that), Fork-Join (independent steps
combined), Condition (choose a path), Iteration (the same step over a collection),
Aspects (wrap a step with retry, timeout, or logging). There is no seventh. Data either
transforms once, chains, combines, branches, repeats, or gets wrapped.

Put together, a use case is a short pipeline that gathers knowledge until it can answer:

```java
Promise<OrderPlaced> placeOrder(PlaceOrder request) {
    return ValidOrder.validOrder(request)   // parse, don't validate -> Result<ValidOrder>
                     .async()               // Result -> Promise
                     .flatMap(inventory::reserve)
                     .flatMap(payment::charge)
                     .map(OrderPlaced::from);
}
```

Read top to bottom, that is a Sequencer of three steps. Each step adds what the next one
needs, each returns a `Promise`, and every way it can fail is already part of the return
type. You did not decide that the method should be asynchronous or where its errors go;
the shapes decided for you. This is the leverage JBCT gives within one process, and the
leverage this book extends to a cluster.

## Let Java be Java

Java was built for managed environments. Applets ran inside the browser. Servlets ran
inside an application server. Enterprise beans ran inside a container, and OSGi bundles
ran inside a runtime framework. Every generation kept the same division of labor: a
managed runtime hosts the application, the application carries the business logic, and
the runtime carries the infrastructure.

Then the industry changed the deal. Docker offered one packaging format for every
language, and Java followed the languages that compile to standalone binaries. We
began bundling a web server, a serialization library, a dependency-injection
container, a service-discovery client, health checks, a metrics library,
configuration, and retry logic into every application, then wrapping the result in a
container and handing it to an orchestrator that re-implements the infrastructure
management older Java runtimes already provided.

Look at what that costs. A typical service's `pom.xml` makes no distinction between a
business dependency and an infrastructure one. They compile together, deploy together,
and break together. A security patch in the embedded web server means rebuilding every
service, because every service embeds one. Swap the message broker and you edit,
rebuild, and redeploy everything that touches messaging. The infrastructure is wearing
a business-logic mask, stitched to your code at the dependency level.

That is an architecture problem, and architecture problems have architectural answers.
Aether is one. You write a `@Slice` interface and its business logic; the runtime
provides the rest: provisioning, scaling, discovery, transport, retries, circuit
breaking, configuration, observability, security. None of those are application
concerns, so none of them appear in your application. A method call through an imported
interface is the only contract you see, and where the target slice runs and how the
call reaches it are the runtime's business, not yours.

The model asks one thing of your code in return: slice methods should be idempotent,
so the same request handled by any instance produces the same result. That single
requirement is what makes transparent retry, scaling, and failover possible, and it is
why the cluster keeps serving as long as a majority of its nodes are alive. Part II
returns to idempotency as a design discipline; for now it is enough to know it is the
price of admission, and a low one.

This is the way Java was meant to run, with the heavy coat of bundled infrastructure
taken off.

## Two kinds of dependency injection

Aether does dependency injection, and it splits one idea that most Java frameworks keep
merged. There are two reasons a piece of your code holds something it did not make, and
Aether treats them as separate jobs with separate rules.

The first is **assembling**: wiring the parts of your application to each other. An order
service needs an inventory service; a slice needs a validator. Aether assembles these
automatically. When it builds a slice it reads the factory's parameters and supplies each
one, instantiating a local dependency from its own factory and obtaining another slice as a
proxy that routes to wherever it runs. You declare a dependency by naming its type as a
parameter, and that is all: no annotations, no modules, no binding configuration. The type
tells the runtime what to supply.

The second is **provisioning**: obtaining a resource from outside the application, such as a
database, an HTTP client for a remote API, or a message topic. This is automatic too, but
it carries one decisive difference: it is environment-dependent. A resource is requested
with a qualifier, an annotation that links a resource type to a configuration section. Some
qualifiers are built in, like `@Sql` for a database connector bound to the `database`
section; you define your own with a meta-annotation when you need another instance or a
custom resource:

```java
@ResourceQualifier(type = SqlConnector.class, config = "database.orders")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface OrderDb {}
```

The qualifier is the whole link between code and configuration. Your code names a section by
qualifier; the section, in the current environment, says what the resource actually is. The
runtime reads the section, builds the resource, and hands it to the slice.

That difference is the reason for the split. Assembling is environment-independent: the
shape of your application is the same everywhere, so it is wired once, automatically, and
verified at compile time. Provisioning is environment-dependent: the resource changes
between laptop, staging, and production, so it is deferred to configuration and resolved
when the slice loads. This is the seam behind "configuration change, not code change":
assembling never varies between environments, provisioning varies only in configuration,
and neither varies in the slice.

Default configuration targets local development. The configuration that ships with a slice
is the one that makes it run on your laptop with no setup: a local database, a local topic,
sensible local values. Every other environment is written as a set of overrides on that
default, changing only the pieces that differ, such as the database host and credentials in
production. You get the local case for free and describe staging and production as deltas.

The split shows in the code at a glance. A plain interface or another slice as a factory
parameter is assembling; the same parameter carrying a resource qualifier like `@Sql` or
`@OrderDb` is provisioning. Every later chapter leans on these two words, so it is worth
fixing them now: assembling wires your parts together, provisioning hands your parts the
outside world.

The next part opens the hood and shows exactly what the runtime generates and does on your
behalf, assembling and provisioning included. If you would rather start building and trust
the machinery for now, skip to Part II.
