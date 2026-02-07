Most Java codebases start with classes. Interface extraction happens later — reluctantly — when testing forces it or the second implementation appears.

Flip this.

Every component — use case, step, adapter — starts as an interface with a static factory method. Not as convention. For three specific reasons:

1. Substitutability without magic. Anyone can implement the interface. Testing becomes trivial — plain lambdas, no mocking framework, no @Mock annotations, no when().thenReturn() chains. Stubbing incomplete implementations during development is equally straightforward. The team working on inventory doesn't wait for the payment team.

2. Implementation isolation. No shared base classes. No abstract methods to override. No coupling between implementations. Each intersection between implementations is unnecessary coupling with corresponding maintenance overhead — up to needing deep understanding of two projects instead of one, with zero benefit.

3. Disposable implementation. The factory returns a lambda. Nothing references the implementation by class name. Nothing can. The implementation is replaceable by definition. The interface is the design artifact; the implementation is incidental.

The compound effect: testing is configuration, refactoring is safe, complexity is bounded, incremental development is natural.

The interface is what you design. The implementation is what you happen to write today.

Full article with code examples:
dev.to: https://dev.to/siy/why-interface-factory-the-java-pattern-that-makes-everything-replaceable-3pm4
Medium: https://medium.com/@sergiy-yevtushenko/why-interface-factory-the-java-pattern-that-makes-everything-replaceable-16341bf53aed

#java #softwarearchitecture #designpatterns #functionalprogramming #backend
