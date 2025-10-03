# Beyond Best Practices. 
_Less art, more engineering._

Over the years, we’ve adopted “best/bad practices” as a way to preserve empirical knowledge about software development: what works, what does not, what we feel good or bad. The problem with this approach that, in most cases, we have no idea why it works. At best, we’re using some subjective criteria like “readability”, which have no meaningful definition. Obviously, the subjective nature of best practices makes them prone to manipulation and abuse. Even if there would be no other issues with “best practices”, collecting countless number of them for each decision we’re making during development makes the whole approach unsustainable.

So, there is a need to replace “best practices” with something less subjective. While working on my personal research dedicated to optimizing coding practices for best productivity, I’ve developed my own set of criteria. I’m using it to assess various elements of software development, from the coding styles to languages and frameworks.

The list is quite short:

-   **Mental Overhead**
-   **Business/Technical Ratio**
-   **Design Impact**
-   **Reliability**
-   **Complexity**

All these criteria could be either somehow measured or, at least, checked for presence/absence. While absolute numbers might not be that useful per se, they enable objective comparison of different approaches.

Let’s take a closer look at each element in the list:

## Mental Overhead

This term (in the form “cognitive load”) comes from cognitive psychology and has a specific meaning — [it’s the amount of effort you have to put to hold the mental model of a software system in your working memory](https://medium.com/@eldermael/notes-on-mental-overhead-and-build-heroes-91a29ee46a78#:~:text=it%E2%80%99s%20the%20amount%20of%20effort%20you%20have%20to%20put%20in%20order%20to%20hold%20the%20mental%20model%20of%20a%20software%20system%20in%20your%20working%20memory.). For simplicity, we can split this load into two parts — inherent load caused by the nature of the task in hand and extra load caused by tools/languages/design/etc. It is the second part, which I’ll be calling “mental overhead” below because it happens on top of inherent load.

The mental overhead appears in the software development in two main forms:

-   “Native” to specific tools, languages or coding styles/practices. It appears in the form “Don’t forget to …” or “Keep in mind that …”. For example: “Don’t forget to check the pointer for NULL” or “Keep in mind, that function you’re calling may throw a business exception in case of an error”.  
    Since we know the form, it’s straightforward to assess the presence and the size of this mental overhead — just by counting how many things one should keep in mind. Comparing different approaches and languages by this parameter also relatively easy.
-   “Induced” by other causes. This type of mental overhead (along with examples) mentioned in more details below.

Mental overhead often can be mitigated by tooling. For example, the compiler can catch many specific errors and even guide the developer to fix them. In many practical scenarios, it is desirable to shift mental overhead to the compiler. Nevertheless, it’s not always possible. There are cases, when, despite compiler support, mental overhead still negatively impacts productivity and/or design. The most notable example — Rust memory management. Although the compiler ensures borrowing and ownership rules are followed, these rules have to be constantly kept in mind during code design. And any “keep in mind that …” is a mental overhead.

It also should be noted, that seasoned developers are used to “keep in mind that…” stuff and often don’t even notice it. This does not mean that mental overhead disappears, it still continues to negatively impact productivity.

## Business/Technical Ratio

This criterion has two closely related parts: context preservation and minimization of the technical details in the code.

### Context Preservation

Each application has a business context (domain) associated with it. Regardless of the nature of the context, the better context is preserved, the easier to understand what does the code we’re dealing with from the business perspective (given we know the domain).

Loss of context causes read/write impedance mismatch: writing code is usually easier than reading it because during writing we have full context, but while reading we have to restore context which is not preserved in the code. Obviously, restoring context requires additional efforts, which is nothing else than pure mental overhead. In extreme cases, it might be easier to rewrite part of the code from scratch than recover the initial context.

The most obvious part of the context preservation lies in naming. Types, methods/functions and fields/parameters/variables named after corresponding elements of the domain are essential for context preservation. But context preservation does not end here. Domain modelling provides many other possibilities to preserve context:

-   Modelling relationships between domain elements (“is A” vs “contains A”) using inheritance and composition.
-   Use of enumeration types to encode fixed sets of domain values using enums.
-   Use of the sum types to model related elements of the domain along with the data specific for each element using sealed classes/interfaces/enums/tagged unions
-   Modelling of business outcomes with functional style containers (monads) Result/Either/etc. instead of business exceptions.
-   Modelling of the “data not present” cases with functional style containers (monads) Option/Maybe/Optional

### Minimization of Technical Details

Technical details are inevitable just because we’re using technical tools like languages, frameworks, build tools, infrastructure, etc. Nevertheless, different approaches leak different amounts of technical details into the code. A typical example is the use of [high-level operations for the processing elements in collections versus using loops](https://medium.com/@abhishekkhaiwale007/zero-cost-abstractions-in-rust-writing-high-level-code-that-performs-like-low-level-code-b11135203e59#:~:text=The%20Magic%20Behind%20the%20Scenes).

### Business/Technical Ratio Summary

This ratio could be roughly assessed by counting domain elements and technical details which have no corresponding representation in the domain. Again, the absolute value might be not that useful, but it enables comparison of different techniques. Quite often, the same business logic with the same amount of preserved context can be implemented using different technical approaches. In this case, it’s straightforward to choose which one provides better visibility of the business logic. For example, some operations could be performed in parallel to improve performance. Parallel execution can use different variants of parallel processing API’s — threading, lightweight threading, reactive streams, callbacks, Promises/Futures, async/await, etc. Since parallelization is a purely technical solution, it has no representation in the business domain, so the more details about starting processing and collecting results are present in the code, the lower be final Business/Technical ratio for the same use case.

It should be noted, that Business/Technical ration has nothing to do with the focus on conciseness, which is often used as a criterion (“in language XXX this code has fewer keystrokes!”). Conciseness is rarely a really valuable characteristic, as it is often achieved by dropping a significant part of the context and increasing “read/write impedance”. It also often requires mentally “expanding” the code, which negatively impacts productivity.

## Design Impact

Many “best practices” are intended to improve design. Some even actually do. But some advertised as “tools to simplify of developers’ life”, but actually break design and make codebase inconsistent. For example, part, which belongs to business logic, gets detached from it and moved into the depth of the underlying framework instead.  
There is another source of the design impact: sometimes ideas behind a programming language enforce specific ways of design and discourage others, making them inconvenient or inefficient. One such example is the Rust ownership/borrowing rules, which inevitably affect code design.

## Reliability

The reliability determines how a particular approach/technique/best practice/etc. makes code resistant to user mistakes (usually by employing the compiler to catch user mistakes). In most cases, this is a binary criterion: user mistakes are, either, caught by the compiler or form a yet another “don’t forget to…” item of mental overhead. There are several techniques, which explicitly focus on the increasing of the reliability. Most of them are coming from functional programming:

-   Use of monads to represent various special states of the variables — missing value, computation result or error, eventually available computation result or error. All of them share the same property: state is either, propagated or explicitly handled, and the compiler ensures that this is so.
-   “Make invalid state unrepresentable”. This technique ensures that there is no way to create values with an invalid state. For example, connection to a database could be represented with different types (NotConnected, Connected, Authenticated), which have different API’s and prevent performing operations which are not allowed in this state. Another example — the “[parse, don’t validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)” approach, which encourages use of different types as input is gets processed and enriched on its way to output. This technique ensures that invalid input can’t be submitted to the subsequent processing stage.

## Complexity

Every design decision in software development has an impact on the complexity of the final product. This criterion, therefore, compares complexity of application of different approaches/techniques/best practices. Usually, this means just counting how many elements are involved and how many links between these elements present. Nevertheless, sometimes complexity manifests itself as a coupling. One of the worst things with coupling is that it is insidious, difficult to spot and may appear in the scenarios which look innocent. A typical example is optional chaining. The statement like:

_var value = object?.property1?.property2?.property3;_

looks convenient and concise, but the code, which contains this statement now is tightly coupled with the structure of the object and its properties.

Since coupling often in difficult to notice, assessing complexity might not be so straightforward as in other cases.

## Some Examples

Below I’ll try to apply the criteria described above to various best practices, approaches and frameworks.

For the beginning, let’s take a [randomly chosen article](https://medium.com/@raviyasas/spring-boot-best-practices-for-developers-3f3bdffa0090) with “best practices” in the title and try to check some of them. In this example, each criterion adds 1 or 0 depending on each compared variants. This enables quick assessment without the need to calculate absolute values.

1.  “**Proper packaging style**”. Two styles are proposed, one based on type and another based on feature.  
    \- **Mental overhead**:  
    Type-based approach requires more navigation while working on a new feature. Feature-based: +1, Type-based: 0.  
    \- **Business/Technical ratio**:  
    Feature-based adds elements of context into the package structure, therefore better preserving the context. Naming packages after business elements (customer, inventory, order, etc.) instead of technical elements (controller, exception, repository, etc.) improves the business/technical ratio. Feature-based: +1, Type-based: 0.  
    \- **Design impact**:  
    Separating related parts of the feature and grouping unrelated negatively impacts design. Feature-based has no issues like this. Feature-based: +1, Type-based: 0.  
    \- **Reliability**:  
    Both approaches equally susceptible to user mistakes and there are no safeguards. Feature-based: 0, Type-based: 0.  
    \- **Complexity**:  
    In the type-based approach, packages which contain the same technical entities are linked with virtually every feature, significantly increasing complexity. Feature-based: +1, Type-based: 0.  
    **Summary:** Feature-based packaging style is a clear winner in 5 out of 6 criteria.
2.  “**Use Spring Boot Starters**”. Two alternatives should be considered: use starters or select packages one by one.  
    \- **Mental overhead**:  
    Starters require less version management, but what is actually included into the starter is opaque and requires referring to documentation and/or checking dependencies to reveal details. No clear advantage for each approach.  
    \- **Business/Technical ratio**:  
    This is a pure technical decision, the amount of business context elements does not depend on it. No advantages for each approach.  
    \- **Reliability**:  
    Starters less prone to user-inflicted version mismatch issues. Starters: +1  
    \- **Complexity**:  
    Starters are simpler to maintain, but may cause hard to nail down issues and/or version conflicts with manually added dependencies because of lack of transparency of what is included in the starter. No advantages for each approach.  
    **Summary**: starters have a minor advantage overall.

## Conclusion

Of course, the method described in this article is far from ideal, but it is much closer to objective and, well, just five criteria could replace tons of best practices.

## Embedded Content

---