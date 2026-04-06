# Step Composition

Slice → Step → Leaf pattern with transitive resource provisioning and transitive method-level annotations.

## Pattern

```java
@Slice
public interface OrderProcessor {
    Promise<OrderConfirmation> processOrder(OrderRequest request);

    // Steps as plain interface dependencies — NOT @Slice, NOT annotated
    static OrderProcessor orderProcessor(ValidateOrder validate,
                                          PersistOrder persist,
                                          OrderEventListener listener) {
        return request -> validate.apply(request)
                                   .flatMap(persist::apply)
                                   .map(OrderConfirmation::from);
    }
}
```

## Step Interfaces

**Pure step (no resources):**
```java
public interface ValidateOrder {
    Promise<ValidOrder> apply(OrderRequest raw);
    static ValidateOrder validateOrder() {
        return raw -> ValidOrder.validOrder(raw).async();
    }
}
```

**Step with transitive resource:**
```java
public interface PersistOrder {
    Promise<Order> apply(ValidOrder order);
    static PersistOrder persistOrder(@Sql SqlConnector db) {
        return order -> db.update("INSERT INTO orders ...", order.id())
                          .map(_ -> order.toOrder());
    }
}
```

**Step with transitive subscription:**
```java
public interface OrderEventListener {
    @OnOrderEvent  // @ResourceQualifier(type = Subscriber.class, config = "messaging.order-events")
    Promise<Unit> onOrderPlaced(OrderPlacedEvent event);
    static OrderEventListener orderEventListener(@Sql SqlConnector db) {
        return event -> db.update("INSERT INTO order_audit ...", event.orderId())
                          .map(_ -> Unit.unit());
    }
}
```

## How the Processor Handles It

1. Detects plain interface dependencies (have factory method, no @Slice)
2. Scans factory parameters for `@ResourceQualifier` → transitive resource provisioning
3. Scans interface methods for reactive annotations → transitive method-level annotations
4. Generates qualified method name: `{stepParamName}{capitalize(methodName)}`
5. Includes transitive handlers in `Slice.methods()` list
6. Writes reactive entries in manifest with qualified names
