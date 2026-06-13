# Chapter 15a: Focused Example - PublishArticle

This focused example demonstrates the **Condition pattern** for routing logic in a content management domain.

---

## Requirements

**Business Goal:** Allow authors to submit articles for publication through an approval workflow.

**Flow:**
1. Validate article submission
2. Route based on author tier:
   - **Premium authors:** Auto-approve, publish immediately
   - **Standard authors:** Queue for editorial review
   - **New authors:** Queue for senior review + plagiarism check

**Business Rules:**
- Premium authors bypass review (auto-publish)
- Standard authors need one editorial approval
- New authors need senior approval AND plagiarism check passes
- All articles go through content validation (length, format)

---

## Domain Model

```java
public enum AuthorTier { PREMIUM, STANDARD, NEW }

public record ArticleId(String value) { /* factory omitted for brevity */ }

public record AuthorId(String value) { /* factory omitted for brevity */ }

public record Article(
    ArticleId id,
    AuthorId authorId,
    String title,
    String content,
    AuthorTier authorTier
) {}

public enum PublishStatus {
    PUBLISHED,
    PENDING_EDITORIAL_REVIEW,
    PENDING_SENIOR_REVIEW
}

public record PublishResult(ArticleId articleId, PublishStatus status) {}
```

---

## Error Types

```java
public sealed interface PublishError extends Cause {

    enum General implements PublishError {
        TITLE_TOO_SHORT("Title must be at least 10 characters"),
        CONTENT_TOO_SHORT("Content must be at least 500 characters"),
        PLAGIARISM_DETECTED("Content failed plagiarism check"),
        SAVE_FAILED("Failed to save article");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }
}
```

---

## Validated Request

```java
public record ValidArticle(
    AuthorId authorId,
    String title,
    String content,
    AuthorTier authorTier
) {
    private static final int MIN_TITLE_LENGTH = 10;
    private static final int MIN_CONTENT_LENGTH = 500;

    public static Result<ValidArticle> validArticle(
        String authorId,
        String title,
        String content,
        AuthorTier tier
    ) {
        return Result.all(
            AuthorId.authorId(authorId),
            validateTitle(title),
            validateContent(content),
            Result.success(tier)
        ).map(ValidArticle::new);
    }

    private static Result<String> validateTitle(String title) {
        return Verify.ensure(title, Verify.Is::notBlank)
            .flatMap(t -> t.trim().length() >= MIN_TITLE_LENGTH
                ? Result.success(t.trim())
                : PublishError.General.TITLE_TOO_SHORT.result());
    }

    private static Result<String> validateContent(String content) {
        return Verify.ensure(content, Verify.Is::notBlank)
            .flatMap(c -> c.trim().length() >= MIN_CONTENT_LENGTH
                ? Result.success(c.trim())
                : PublishError.General.CONTENT_TOO_SHORT.result());
    }
}
```

---

## Use Case with Condition Pattern

```java
public interface PublishArticle {

    Promise<PublishResult> execute(ArticleRequest request);

    // Step interfaces
    interface SaveArticle {
        Promise<ArticleId> apply(ValidArticle article);
    }

    interface CheckPlagiarism {
        Promise<ValidArticle> apply(ValidArticle article);
    }

    interface QueueForReview {
        Promise<PublishResult> apply(ArticleId id, PublishStatus status);
    }

    // Factory demonstrating Condition pattern
    static PublishArticle publishArticle(
        SaveArticle saveArticle,
        CheckPlagiarism checkPlagiarism,
        QueueForReview queueForReview
    ) {
        return request -> ValidArticle.validArticle(
                request.authorId(),
                request.title(),
                request.content(),
                request.authorTier()
            )
            .async()
            .flatMap(article -> routeByAuthorTier(
                article, saveArticle, checkPlagiarism, queueForReview
            ));
    }

    // CONDITION PATTERN: Routing only, no transformation
    private static Promise<PublishResult> routeByAuthorTier(
        ValidArticle article,
        SaveArticle saveArticle,
        CheckPlagiarism checkPlagiarism,
        QueueForReview queueForReview
    ) {
        return switch (article.authorTier()) {
            case PREMIUM -> publishImmediately(article, saveArticle);
            case STANDARD -> queueForEditorialReview(article, saveArticle, queueForReview);
            case NEW -> queueWithPlagiarismCheck(article, saveArticle, checkPlagiarism, queueForReview);
        };
    }

    // Route 1: Premium - auto-publish
    private static Promise<PublishResult> publishImmediately(
        ValidArticle article,
        SaveArticle saveArticle
    ) {
        return saveArticle.apply(article)
            .map(id -> new PublishResult(id, PublishStatus.PUBLISHED));
    }

    // Route 2: Standard - editorial review
    private static Promise<PublishResult> queueForEditorialReview(
        ValidArticle article,
        SaveArticle saveArticle,
        QueueForReview queueForReview
    ) {
        return saveArticle.apply(article)
            .flatMap(id -> queueForReview.apply(id, PublishStatus.PENDING_EDITORIAL_REVIEW));
    }

    // Route 3: New - plagiarism check + senior review
    private static Promise<PublishResult> queueWithPlagiarismCheck(
        ValidArticle article,
        SaveArticle saveArticle,
        CheckPlagiarism checkPlagiarism,
        QueueForReview queueForReview
    ) {
        return checkPlagiarism.apply(article)
            .flatMap(saveArticle::apply)
            .flatMap(id -> queueForReview.apply(id, PublishStatus.PENDING_SENIOR_REVIEW));
    }
}
```

---

## Key Points: Condition Pattern

### What Condition Does

The Condition pattern performs **routing only** - it selects which execution path to follow based on input data. The switch expression returns a `Promise<PublishResult>` from each branch.

```java
return switch (article.authorTier()) {
    case PREMIUM -> publishImmediately(...);      // Route to path A
    case STANDARD -> queueForEditorialReview(...); // Route to path B
    case NEW -> queueWithPlagiarismCheck(...);    // Route to path C
};
```

### What Condition Does NOT Do

Condition does not transform data inline. Each route delegates to a separate method:

```java
// WRONG: Transformation in condition
return switch (article.authorTier()) {
    case PREMIUM -> saveArticle.apply(article)
        .map(id -> new PublishResult(id, PublishStatus.PUBLISHED));  // Too much here
    ...
};

// CORRECT: Route to method that handles the path
return switch (article.authorTier()) {
    case PREMIUM -> publishImmediately(article, saveArticle);  // Delegation
    ...
};
```

### Benefits

1. **Clear routing logic** - One place shows all possible paths
2. **Testable branches** - Each route method can be tested independently
3. **Extensible** - Adding new author tiers requires adding one case
4. **Type-safe** - Compiler warns if switch is non-exhaustive

---

## Testing

```java
class PublishArticleTest {

    @Nested
    class Routing {
        @Test
        void execute_publishesImmediately_forPremiumAuthor() {
            var saved = new AtomicReference<ValidArticle>();

            PublishArticle.SaveArticle saveArticle = article -> {
                saved.set(article);
                return Promise.success(new ArticleId("art-123"));
            };

            var useCase = PublishArticle.publishArticle(
                saveArticle,
                article -> Promise.success(article),
                (id, status) -> Promise.success(new PublishResult(id, status))
            );

            useCase.execute(requestWithTier(AuthorTier.PREMIUM))
                .await()
                .onFailure(Assertions::fail)
                .onSuccess(result -> {
                    assertEquals(PublishStatus.PUBLISHED, result.status());
                    assertNotNull(saved.get());
                });
        }

        @Test
        void execute_queuesForEditorialReview_forStandardAuthor() {
            var useCase = PublishArticle.publishArticle(
                article -> Promise.success(new ArticleId("art-123")),
                article -> Promise.success(article),
                (id, status) -> Promise.success(new PublishResult(id, status))
            );

            useCase.execute(requestWithTier(AuthorTier.STANDARD))
                .await()
                .onFailure(Assertions::fail)
                .onSuccess(result ->
                    assertEquals(PublishStatus.PENDING_EDITORIAL_REVIEW, result.status())
                );
        }

        @Test
        void execute_checksPlagiarism_forNewAuthor() {
            var plagiarismChecked = new AtomicBoolean(false);

            PublishArticle.CheckPlagiarism checkPlagiarism = article -> {
                plagiarismChecked.set(true);
                return Promise.success(article);
            };

            var useCase = PublishArticle.publishArticle(
                article -> Promise.success(new ArticleId("art-123")),
                checkPlagiarism,
                (id, status) -> Promise.success(new PublishResult(id, status))
            );

            useCase.execute(requestWithTier(AuthorTier.NEW))
                .await()
                .onFailure(Assertions::fail)
                .onSuccess(result -> {
                    assertTrue(plagiarismChecked.get());
                    assertEquals(PublishStatus.PENDING_SENIOR_REVIEW, result.status());
                });
        }

        @Test
        void execute_fails_whenPlagiarismDetected() {
            PublishArticle.CheckPlagiarism failingCheck = article ->
                PublishError.General.PLAGIARISM_DETECTED.promise();

            var useCase = PublishArticle.publishArticle(
                article -> Promise.success(new ArticleId("art-123")),
                failingCheck,
                (id, status) -> Promise.success(new PublishResult(id, status))
            );

            useCase.execute(requestWithTier(AuthorTier.NEW))
                .await()
                .onSuccess(Assertions::fail);
        }
    }

    private ArticleRequest requestWithTier(AuthorTier tier) {
        return new ArticleRequest(
            "author-123",
            "This is a valid title for testing",
            "x".repeat(600),  // Valid content length
            tier
        );
    }
}
```

---

## Exercises

1. **Add tier upgrade:** If a NEW author has 10+ published articles, route them as STANDARD. Where does this logic belong?

2. **Add scheduled publishing:** PREMIUM authors can specify a publish date. Modify the Condition to route scheduled articles differently.

3. **Extract to filter:** Rewrite the plagiarism check using `.filter()` instead of a separate step interface.

---

## Summary

PublishArticle demonstrates:

- **Condition pattern for routing** - Switch expression selects execution path
- **No transformation in conditions** - Each branch delegates to a method
- **Pattern matching with enums** - Type-safe, exhaustive routing
- **Testable branches** - Each route tested independently
- **Composable with other patterns** - Routes contain Sequencer chains
