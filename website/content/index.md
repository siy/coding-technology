# Java Backend Coding Technology

Executable business process specifications. Code that reads like a business process, because it is one. A framework-agnostic methodology for writing predictable, testable Java backend code optimized for human-AI collaboration.

<p class="cta-row"><a class="cta cta-primary" href="book/index.html">Read the book free</a> <a class="cta" href="books.html">Books</a> <a class="cta" href="CONTACT.html">Work with us</a></p>

## Here's what changes

**Without JBCT**

```java
// Hidden failure modes, unclear control flow
public User findUser(String userId) throws NotFoundException {
    long id;
    try {
        id = Long.parseLong(userId);
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Invalid user ID");
    }

    User user = repository.findById(id);
    if (user == null) {
        throw new NotFoundException("User not found: " + id);
    }

    return user;
    // Multiple failure modes hidden in throws
    // Caller must read docs to know what exceptions to catch
}
```

**With JBCT**

```java
// Parse don't validate - invalid states unrepresentable
public record UserId(long value) {
    // Records can't hide the canonical constructor; userId() is the construction path

    public static Result<UserId> userId(String raw) {
        return Number.parseLong(raw)
                     .map(UserId::new);
    }
}

public interface FindUser {
    Promise<User> execute(UserId id);
}

// Usage
UserId.userId(userIdStr)
      .async()
      .flatMap(findUser::execute)
      // Parsing errors: Result<UserId>
      // Not found errors: Promise<User>
      // All failures typed, compiler enforces handling
```

**Result:** Parse-don't-validate makes invalid states impossible. Typed errors eliminate hidden exceptions. Type signatures document failure modes.

## One discipline, from design to deployment

- **Design — [Process-First Design](books.html).** The unit of design is the process, not the entity. The methodology book: how the structure of a backend is derived from what the business does, not from a data model. The condensed edition is free — the whole argument in about 25 minutes.
- **Code — [Java Backend Coding Technology](book/index.html).** The Java realization this site documents: typed failures, parse-don't-validate, composition patterns, testing strategy, worked examples. The complete book is free to read online.
- **Run — [Pragmatica Aether](https://pragmaticalabs.io/aether.html).** A distributed Java runtime, currently in pre-release development, where the same composition deploys unchanged — business logic stays free of infrastructure code.

## Where to start

- **Developers** — read the [book](book/index.html), then wire up the [AI and CLI tooling](AI-TOOLING.html).
- **Engineering leaders** — the [management perspective](MANAGEMENT_PERSPECTIVE.html): the business case for structural standardization.
- **Teams adopting** — [work with us](CONTACT.html): assessment, training, architecture review, adoption sprints.

## Why "Technology"?

A methodology tells you what good looks like; a technology makes it reproducible. JBCT ships with the pieces that make the discipline mechanical rather than aspirational: a [CLI linter](CLI-TOOLING.html) and [Maven plugin](MAVEN-PLUGIN.html) that enforce the structural rules, [AI skills and subagents](AI-TOOLING.html) that generate and review compliant code, and a [book](book/index.html) that derives every rule instead of decreeing it.
