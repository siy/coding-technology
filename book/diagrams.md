# JBCT Diagrams

This appendix contains visual diagrams to aid understanding of JBCT concepts.

---

## Pattern Flow Diagrams

### Sequencer Pattern

```mermaid
flowchart LR
    subgraph Sequencer["Sequencer (Linear Chain)"]
        direction LR
        Input([Request]) --> Step1[Step 1]
        Step1 -->|Success| Step2[Step 2]
        Step2 -->|Success| Step3[Step 3]
        Step3 -->|Success| Output([Response])

        Step1 -->|Failure| Error([Error])
        Step2 -->|Failure| Error
        Step3 -->|Failure| Error
    end
```

**Code Pattern:**
```java
return step1.apply(input)
    .flatMap(step2::apply)
    .flatMap(step3::apply);
```

---

### Fork-Join Pattern

```mermaid
flowchart TB
    subgraph ForkJoin["Fork-Join (Parallel)"]
        Input([Input]) --> Fork{Fork}
        Fork --> A[Step A]
        Fork --> B[Step B]
        Fork --> C[Step C]
        A --> Join{Join}
        B --> Join
        C --> Join
        Join -->|All Success| Output([Combined Result])
        Join -->|Any Failure| Error([First Error])
    end
```

**Code Pattern:**
```java
return Promise.all(stepA.apply(input),
                  stepB.apply(input),
                  stepC.apply(input))
              .map(CombinedResult::new);
```

---

### Condition Pattern

```mermaid
flowchart TB
    subgraph Condition["Condition (Routing)"]
        Input([Input]) --> Decide{Discriminator}
        Decide -->|Case A| PathA[Handler A]
        Decide -->|Case B| PathB[Handler B]
        Decide -->|Case C| PathC[Handler C]
        PathA --> Output([Output])
        PathB --> Output
        PathC --> Output
    end
```

**Code Pattern:**
```java
return switch (input.type()) {
    case TYPE_A -> handlerA.apply(input);
    case TYPE_B -> handlerB.apply(input);
    case TYPE_C -> handlerC.apply(input);
};
```

---

### Iteration Pattern

```mermaid
flowchart TB
    subgraph Iteration["Iteration (Collection Processing)"]
        Input([List of Items]) --> Map[Map Each Item]
        Map --> Process[Process Function]
        Process --> Collect[Collect Results]
        Collect --> Output([List of Results])
    end
```

**Code Pattern:**
```java
return Promise.allOf(items.stream()
                          .map(processor::apply)
                          .toList());
```

---

### Aspects Pattern

```mermaid
flowchart TB
    subgraph Aspects["Aspects (Cross-Cutting)"]
        Input([Request]) --> Aspect1[Timeout Wrapper]
        Aspect1 --> Aspect2[Retry Wrapper]
        Aspect2 --> Aspect3[Audit Wrapper]
        Aspect3 --> Core[Core Operation]
        Core --> Output([Response])
    end
```

**Code Pattern:**
```java
return withTimeout(
    withRetry(
        withAudit(
            coreOperation.apply(input))));
```

---

### Leaf Pattern

```mermaid
flowchart LR
    subgraph Leaf["Leaf (Adapter)"]
        Input([Domain Request]) --> Adapter[Adapter Layer]
        Adapter --> External[(External System)]
        External --> Adapter
        Adapter --> Output([Domain Result])
    end

    subgraph Wrapping["Exception Wrapping"]
        Try[Promise.lift] --> External2[(Throwing API)]
        External2 -->|Exception| Cause([Cause])
        External2 -->|Success| Result([Result])
    end
```

**Code Pattern:**
```java
return Promise.lift(
    DatabaseError::new,
    () -> jdbcTemplate.queryForObject(sql, mapper, params)
);
```

---

## Type Transformation Diagrams

### Type Hierarchy

```mermaid
flowchart TB
    subgraph Types["Type Hierarchy (Information Content)"]
        T["T<br/>(Pure Value)"]
        Option["Option&lt;T&gt;<br/>(May Be Absent)"]
        Result["Result&lt;T&gt;<br/>(May Fail)"]
        Promise["Promise&lt;T&gt;<br/>(Async + May Fail)"]

        T -->|"wrap"| Option
        Option -->|"add error channel"| Result
        Result -->|"add async"| Promise
    end
```

---

### Type Conversions

```mermaid
flowchart LR
    subgraph Conversions["Safe Type Conversions"]
        O[Option] -->|".toResult(cause)"| R[Result]
        O -->|".async(cause)"| P[Promise]
        R -->|".async()"| P
        P -->|".await()"| R
        R -->|".option()"| O
    end
```

**Lifting (Safe - adds information):**
- `Option` → `Result`: `.toResult(cause)`
- `Option` → `Promise`: `.async(cause)`
- `Result` → `Promise`: `.async()`

**Lowering (Loses information):**
- `Promise` → `Result`: `.await()` (blocks)
- `Result` → `Option`: `.option()` (loses error)

---

### Return Type Decision Tree

```mermaid
flowchart TB
    Start([Method Return Type?]) --> Q1{Can it fail?}
    Q1 -->|No| Q2{Is value optional?}
    Q1 -->|Yes| Q3{Is it async/IO?}

    Q2 -->|No| T["Return T"]
    Q2 -->|Yes| Option["Return Option&lt;T&gt;"]

    Q3 -->|No| Result["Return Result&lt;T&gt;"]
    Q3 -->|Yes| Promise["Return Promise&lt;T&gt;"]

    style T fill:#90EE90
    style Option fill:#87CEEB
    style Result fill:#FFD700
    style Promise fill:#FF6B6B
```

---

## Architecture Diagrams

### Three Zones

```mermaid
flowchart TB
    subgraph External["External Zone"]
        HTTP[HTTP Request]
        DB[(Database)]
        API[External API]
        Queue[Message Queue]
    end

    subgraph Adapter["Adapter Zone"]
        Controller[Controllers]
        Repository[Repositories]
        Client[HTTP Clients]
        Consumer[Queue Consumers]
    end

    subgraph Domain["Domain Zone"]
        UseCase[Use Cases]
        ValueObject[Value Objects]
        StepInterface[Step Interfaces]
    end

    HTTP --> Controller
    Controller --> UseCase
    UseCase --> StepInterface
    StepInterface -.->|implemented by| Repository
    StepInterface -.->|implemented by| Client
    Repository --> DB
    Client --> API
    Consumer --> Queue
```

---

### Use Case Structure

```mermaid
flowchart TB
    subgraph UseCase["Use Case Interface"]
        Execute["execute(Request)"]

        subgraph Records["Nested Records"]
            Request[Request]
            ValidRequest[ValidRequest]
            Response[Response]
        end

        subgraph Steps["Step Interfaces"]
            Step1["Step1: Fn1&lt;Promise, In&gt;"]
            Step2["Step2: Fn1&lt;Promise, In&gt;"]
            Step3["Step3: Fn1&lt;Promise, In&gt;"]
        end

        Factory["static factory method"]
    end

    Execute --> Request
    Request -->|"validate"| ValidRequest
    ValidRequest --> Step1
    Step1 --> Step2
    Step2 --> Step3
    Step3 --> Response
```

---

### Package Structure

```mermaid
flowchart TB
    subgraph Package["com.example.feature"]
        subgraph domain["domain/"]
            VO[Value Objects]
            Errors[Error Types]
        end

        subgraph usecase["usecase/"]
            UC[Use Case Interface]
        end

        subgraph adapter["adapter/"]
            subgraph persistence["persistence/"]
                Repo[Repository Impl]
            end
            subgraph web["web/"]
                Ctrl[Controller]
                DTO[DTOs]
            end
            subgraph external["external/"]
                Client[API Clients]
            end
        end

        subgraph config["config/"]
            Config[Spring Config]
        end
    end

    UC --> VO
    UC --> Errors
    Ctrl --> UC
    Repo -.-> UC
    Client -.-> UC
    Config --> UC
    Config --> Repo
    Config --> Client
```

---

## Error Handling Diagrams

### Result Aggregation

```mermaid
flowchart TB
    subgraph All["Result.all() - Accumulates All Errors"]
        R1["Result 1: ✓"]
        R2["Result 2: ✗ Error A"]
        R3["Result 3: ✗ Error B"]

        R1 --> All1{all}
        R2 --> All1
        R3 --> All1

        All1 --> Composite["CompositeCause<br/>[Error A, Error B]"]
    end
```

---

### flatMap vs all

```mermaid
flowchart LR
    subgraph FlatMap["flatMap - Short Circuit"]
        FM1[Validate Email] -->|Fail| FMErr([Error: Invalid Email])
        FM1 -->|Success| FM2[Validate Password]
        FM2 -->|Fail| FMErr2([Error: Invalid Password])
        FM2 -->|Success| FMOut([Success])
    end

    subgraph All["Result.all - Accumulate"]
        A1[Validate Email] --> AJoin{Combine}
        A2[Validate Password] --> AJoin
        AJoin -->|Both Fail| AErr(["[Invalid Email, Invalid Password]"])
        AJoin -->|Any Fail| AErr
        AJoin -->|All Success| AOut([Success])
    end
```

---

### Recovery Pattern

```mermaid
flowchart TB
    subgraph Recovery["Error Recovery Chain"]
        Op[Operation] -->|Fail| R1{recover}
        R1 -->|TransientError| Retry[Retry]
        R1 -->|NotFound| Default[Use Default]
        R1 -->|Other| Propagate[Re-throw]

        Retry -->|Success| Out([Result])
        Default --> Out
        Propagate --> Err([Error])
        Retry -->|Fail| Err
    end
```

**Code Pattern:**
```java
operation.apply(input)
    .recover(this::handleError);

private Promise<T> handleError(Cause cause) {
    return switch (cause) {
        case TransientError e -> retry(input);
        case NotFound e -> Promise.success(defaultValue);
        default -> cause.promise();
    };
}
```

---

## Testing Diagrams

### Test Structure

```mermaid
flowchart TB
    subgraph Test["Use Case Test Structure"]
        subgraph Arrange["Arrange"]
            Stubs[Create Step Stubs]
            UC[Create Use Case]
            Input[Create Test Input]
        end

        subgraph Act["Act"]
            Execute[Execute Use Case]
            Await[Await Result]
        end

        subgraph Assert["Assert"]
            Check{Success or Failure?}
            Check -->|Success| AssertSuccess[Assert on Value]
            Check -->|Failure| AssertFailure[Assert on Cause]
        end

        Arrange --> Act --> Assert
    end
```

---

### Stub Patterns

```mermaid
flowchart LR
    subgraph Stubs["Common Stub Patterns"]
        Success["Success Stub<br/>id -> Promise.success(value)"]
        Failure["Failure Stub<br/>id -> ERROR.promise()"]
        Conditional["Conditional Stub<br/>id -> id.equals(x) ? success : failure"]
        Delayed["Delayed Stub<br/>Promise with delay"]
    end
```

---

## Pattern Selection Decision Tree

```mermaid
flowchart TB
    Start([How to structure this code?]) --> Q1{Multiple independent<br/>operations?}

    Q1 -->|Yes| Q2{Need all results?}
    Q1 -->|No| Q3{Depends on<br/>previous step?}

    Q2 -->|Yes| ForkJoin[Fork-Join]
    Q2 -->|No, first wins| Any["Promise.any()"]

    Q3 -->|Yes| Sequencer[Sequencer]
    Q3 -->|No| Q4{Route by value?}

    Q4 -->|Yes| Condition[Condition]
    Q4 -->|No| Q5{Process collection?}

    Q5 -->|Yes| Iteration[Iteration]
    Q5 -->|No| Q6{Cross-cutting concern?}

    Q6 -->|Yes| Aspects[Aspects]
    Q6 -->|No| Leaf[Leaf]

    style ForkJoin fill:#87CEEB
    style Sequencer fill:#90EE90
    style Condition fill:#FFD700
    style Iteration fill:#DDA0DD
    style Aspects fill:#FFA07A
    style Leaf fill:#F0E68C
```

---

## Summary

These diagrams visualize:

| Diagram Type | Purpose |
|--------------|---------|
| Pattern Flows | How data moves through each pattern |
| Type Transformations | Converting between Option/Result/Promise |
| Architecture | Zone boundaries and package structure |
| Error Handling | Aggregation and recovery strategies |
| Testing | Test structure and stub patterns |
| Decision Trees | Choosing return types and patterns |

Use these as reference when designing new code or reviewing existing code against JBCT patterns.
