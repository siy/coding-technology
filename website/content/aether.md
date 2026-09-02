# Aether

Pragmatica Aether is a distributed Java runtime, under active development at release-candidate stage. It is not ready for production use, and this page will say so plainly for as long as that stays true.

The current candidate is 1.0.0-rc3 (2026-09-02). It is on Maven Central as `org.pragmatica-lite:core:1.0.0-rc3` and `org.pragmatica-lite.aether:*:1.0.0-rc3`; binaries are on the [GitHub release](https://github.com/pragmaticalabs/pragmatica/releases/tag/v1.0.0-rc3).

The goal: the same composition you write for a single process — `Result`, `Option`, `Promise`, the JBCT patterns — deploys unchanged whether it runs as one instance or many. Deployment topology is a decision made at deploy time, not one baked into how the business logic is written.

A book on Aether is planned, after the runtime stabilizes. No release date is set for either.
