# Pragmatica Aether: Let Java Be Java

We're building java applications like any other in any other language. Assembling fat jars, building docker images, deploying in kubernetes. This looks normal,
everyone does it. We're ignoring the fact, that this approach contradicts the basic principles of software engineering: proper abstraction layering and
separation of concerns. We're wearing each application into a heavy winter coat, arming it to the teeth to make it survive in the hostile environment. Why not just make
environment more friendly instead? Let the application handle business logic. Let the environment handle infrastructure. That's what Aether is all about. 

## Pragmatica Aether: Let Java Be Java
The core idea of Aether is to let application be focused on that matters: business logic. Scaling, unreliable connectivity, service discovery, retries, circuit breakers, configuration, 
observability, logging, tracing, monitoring, security, etc., etc. are not application concerns and should not be handled at business logic level. 

As a side effect, Aether makes unnecessary fat application frameworks. You still "deep" application, but not into heavy winter coat of Spring Boot, but into friendly
environment of Aether. This immediately gives a number of benefits:
- Clean separation between business logic and infrastructure -> independent maintenance, simple testing, (TODO: more advantages) 
- Instant deployment readiness: mvn package -> application is ready to run, no need to wait for docker image build
- Transparent scaling
- Consistent configuration, logging, tracing, observability
- Simple mental model: method call is just a method call
- No frameworks. No magic. No hidden complexity or processing/startup overhead.

## Aether: Closer Look
Aether is a fault-tolerant distributed runtime environment, capable of dynamic loading and execution of Java applications. The application consists of one or more components called "slices".
In traditional designs like modular monolith, each slice could be considered a service. It has a defined contract in the form of an interface. But, unlike traditional service, slice
is also a minimal unit of deployment and scaling. For convenience, entire application is defined as a blueprint - declarative configuration of slices that can be deployed as a whole.
There are no operational or complexity tradeoffs, slice could be as lean as single method. Actually this is the best recommended approach for the Aether applications. It also 
means that your application can be scaled with per use case granularity - feature unfeasible for microservices due to enormous operational overhead.

From the infrastructure perspective, Aether is cluster of identical nodes. Since runtime and business logic are decoupled, application and node upgrades are independent of each other.
Fault-tolerant nature of Aether enables seamless upgrades and rollbacks without downtime. It also enables various advanced deployment scenarios and strategies like
transparent multi-cloud deployment, transition from on-premise to cloud and back, transition between cloud providers.

## Aether: Scaling Done Right
Aether design inherently supports two levels of horizontal scaling: 
- Slices scaling: new slice instance is started at one of the already running nodes.
- Node scaling: new node is added to the cluster.

Aether has built-in configurable support for launching new nodes and replacing failed nodes. Fault tolerant nature makes it completely feasible to use cheaper 
spot instances for additional scaling needs during peak loads. Using these features does not require PhD in distributed systems or team of DevOps engineers.

But that's not all. Aether uses layered scaling decision design. At the lowest level, Aether uses decision tree to make almost instant scaling decision based on metrics. The next level is a simple
built-in predictive scaler, which observes patterns and tries to predict future load before it happens. And at the highest level, there is a configurable LLM-based scaling and cluster health monitoring.
It tries to predict long-term load patterns and monitors cluster health to make scaling and maintenance decisions.



