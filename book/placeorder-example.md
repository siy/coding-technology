# Complete Example - PlaceOrder

This chapter walks through building a complete e-commerce order placement use case from requirements to production-ready code.

---

## Requirements

**Business Goal:** Allow customers to place orders for items in their cart.

**Flow:**
1. Validate the order request
2. Check inventory for all items (parallel)
3. Reserve inventory
4. Process payment
5. Create order record
6. Send confirmation notification

**Business Rules:**
- All items must be in stock
- Payment must succeed before inventory is committed
- If payment fails, release reserved inventory
- Order confirmation is best-effort (don't fail order if notification fails)

**Error Scenarios:**
- Invalid request (missing fields, invalid quantities)
- Insufficient inventory for one or more items
- Payment declined
- Payment timeout
- Database failure

---

## Domain Analysis

### Value Objects

| Type | Validation | Notes |
|------|------------|-------|
| OrderId | UUID format | Generated, not user input |
| CustomerId | Non-empty, UUID format | From session/auth |
| ProductId | Non-empty, UUID format | |
| Quantity | Positive integer, max 100 | Per-item limit |
| Money | Non-negative, max 2 decimal places | |
| Address | Street, city, postal code, country | Composite |

### Patterns Identified

| Step | Pattern | Rationale |
|------|---------|-----------|
| Validate request | Fork-Join | Multiple independent field validations |
| Check inventory | Fork-Join | Check all items in parallel |
| Reserve + Pay + Create | Sequencer | Strict ordering required |
| Send notification | Leaf with Aspect | Best-effort, don't fail order |

---

## Package Structure

```
com.example.shop.usecase.placeorder/
  PlaceOrder.java           # Use case interface + factory
  OrderError.java           # Sealed error interface
  ValidOrderRequest.java    # Validated request record
  OrderLine.java            # Validated line item
  ReservedInventory.java    # Intermediate state

com.example.shop.domain.shared/
  CustomerId.java
  ProductId.java
  Quantity.java
  Money.java
  Address.java
  OrderId.java
```

---

## Step 1: Value Objects

### ProductId

```java
package com.example.shop.domain.shared;

import org.pragmatica.lang.Result;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.utils.Causes;
import org.pragmatica.lang.parse.Network;

public record ProductId(String value) {
    private static final Cause INVALID_PRODUCT_ID = Causes.cause("Invalid product ID format");

    public static Result<ProductId> productId(String raw) {
        return Network.parseUUID(raw)
            .mapError(_ -> INVALID_PRODUCT_ID)
            .map(uuid -> new ProductId(uuid.toString()));
    }
}
```

### Quantity

```java
package com.example.shop.domain.shared;

import org.pragmatica.lang.Result;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.utils.Causes;
import org.pragmatica.lang.utils.Verify;

public record Quantity(int value) {
    private static final Cause NOT_POSITIVE = Causes.cause("Quantity must be positive");
    private static final Cause EXCEEDS_LIMIT = Causes.cause("Quantity cannot exceed 100");

    public static Result<Quantity> quantity(int raw) {
        return Verify.ensure(raw, Verify.Is::positive)
            .mapError(_ -> NOT_POSITIVE)
            .filter(EXCEEDS_LIMIT, v -> Verify.Is.lessThanOrEqualTo(v, 100))
            .map(Quantity::new);
    }

    public boolean isGreaterThan(Quantity other) {
        return this.value > other.value;
    }
}
```

### Money

```java
package com.example.shop.domain.shared;

import org.pragmatica.lang.Result;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.utils.Causes;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record Money(BigDecimal value) {
    private static final Cause NEGATIVE = Causes.cause("Money cannot be negative");
    private static final Cause TOO_MANY_DECIMALS = Causes.cause("Money allows max 2 decimal places");

    public static Result<Money> money(BigDecimal raw) {
        if (raw.compareTo(BigDecimal.ZERO) < 0) {
            return NEGATIVE.result();
        }
        if (raw.scale() > 2) {
            return TOO_MANY_DECIMALS.result();
        }
        return Result.success(new Money(raw.setScale(2, RoundingMode.HALF_UP)));
    }

    public static Result<Money> money(String raw) {
        return Result.lift(() -> new BigDecimal(raw))
            .mapError(_ -> Causes.cause("Invalid money format"))
            .flatMap(Money::money);
    }

    public Money add(Money other) {
        return new Money(this.value.add(other.value));
    }

    public Money multiply(int quantity) {
        return new Money(this.value.multiply(BigDecimal.valueOf(quantity)));
    }

    public static final Money ZERO = new Money(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
}
```

### Address

```java
package com.example.shop.domain.shared;

import org.pragmatica.lang.Result;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.utils.Causes;
import org.pragmatica.lang.utils.Verify;

public record Address(
    String street,
    String city,
    String postalCode,
    String country
) {
    private static final Cause STREET_REQUIRED = Causes.cause("Street is required");
    private static final Cause CITY_REQUIRED = Causes.cause("City is required");
    private static final Cause POSTAL_CODE_REQUIRED = Causes.cause("Postal code is required");
    private static final Cause COUNTRY_REQUIRED = Causes.cause("Country is required");

    public static Result<Address> address(String street, String city, String postalCode, String country) {
        return Result.all(
            validateField(street, STREET_REQUIRED),
            validateField(city, CITY_REQUIRED),
            validateField(postalCode, POSTAL_CODE_REQUIRED),
            validateField(country, COUNTRY_REQUIRED)
        ).map(Address::new);
    }

    private static Result<String> validateField(String value, Cause error) {
        return Verify.ensure(value, Verify.Is::notBlank)
            .mapError(_ -> error)
            .map(String::trim);
    }
}
```

---

## Step 2: Error Types

```java
package com.example.shop.usecase.placeorder;

import org.pragmatica.lang.Cause;
import org.pragmatica.lang.utils.Causes;
import com.example.shop.domain.shared.ProductId;
import com.example.shop.domain.shared.Quantity;

import java.util.List;

public sealed interface OrderError extends Cause {

    // Fixed-message errors grouped in enum
    enum General implements OrderError {
        EMPTY_ORDER("Order must contain at least one item"),
        PAYMENT_DECLINED("Payment was declined"),
        PAYMENT_TIMEOUT("Payment service timed out"),
        DATABASE_ERROR("Failed to save order");

        private final String message;

        General(String message) {
            this.message = message;
        }

        @Override
        public String message() {
            return message;
        }
    }

    // Errors with data
    record InsufficientInventory(List<ProductId> products) implements OrderError {
        @Override
        public String message() {
            return "Insufficient inventory for products: " +
                products.stream().map(ProductId::value).toList();
        }
    }

    record InvalidQuantity(ProductId productId, Quantity requested, Quantity available)
        implements OrderError {
        @Override
        public String message() {
            return String.format("Product %s: requested %d, available %d",
                productId.value(), requested.value(), available.value());
        }
    }

    record PaymentFailed(Throwable cause) implements OrderError {
        @Override
        public String message() {
            return "Payment processing failed: " + Causes.fromThrowable(cause);
        }
    }
}
```

---

## Step 3: Validated Request

### Raw Request (from API)

```java
package com.example.shop.usecase.placeorder;

import java.util.List;

public record OrderRequest(
    String customerId,
    List<LineItemRequest> items,
    AddressRequest shippingAddress
) {
    public record LineItemRequest(String productId, int quantity) {}
    public record AddressRequest(String street, String city, String postalCode, String country) {}
}
```

### Validated Order Line

```java
package com.example.shop.usecase.placeorder;

import org.pragmatica.lang.Result;
import com.example.shop.domain.shared.ProductId;
import com.example.shop.domain.shared.Quantity;

public record OrderLine(ProductId productId, Quantity quantity) {

    public static Result<OrderLine> orderLine(OrderRequest.LineItemRequest raw) {
        return Result.all(
            ProductId.productId(raw.productId()),
            Quantity.quantity(raw.quantity())
        ).map(OrderLine::new);
    }
}
```

### Validated Request

```java
package com.example.shop.usecase.placeorder;

import org.pragmatica.lang.Result;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.utils.Causes;
import com.example.shop.domain.shared.CustomerId;
import com.example.shop.domain.shared.Address;

import java.util.List;

public record ValidOrderRequest(
    CustomerId customerId,
    List<OrderLine> items,
    Address shippingAddress
) {
    private static final Cause EMPTY_ORDER = OrderError.General.EMPTY_ORDER;

    public static Result<ValidOrderRequest> validOrderRequest(OrderRequest raw) {
        return Result.all(
            CustomerId.customerId(raw.customerId()),
            validateItems(raw.items()),
            Address.address(
                raw.shippingAddress().street(),
                raw.shippingAddress().city(),
                raw.shippingAddress().postalCode(),
                raw.shippingAddress().country()
            )
        ).map(ValidOrderRequest::new);
    }

    private static Result<List<OrderLine>> validateItems(List<OrderRequest.LineItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return EMPTY_ORDER.result();
        }

        return Result.allOf(
            items.stream()
                .map(OrderLine::orderLine)
                .toList()
        );
    }
}
```

---

## Step 4: Step Interfaces

```java
package com.example.shop.usecase.placeorder;

import org.pragmatica.lang.Promise;
import org.pragmatica.lang.Result;
import com.example.shop.domain.shared.OrderId;
import com.example.shop.domain.shared.Money;

public interface PlaceOrder {

    record Response(OrderId orderId, Money total) {}

    Promise<Response> execute(OrderRequest request);

    // Step 1: Check inventory for all items (Fork-Join)
    interface CheckInventory {
        Promise<ValidOrderRequest> apply(ValidOrderRequest request);
    }

    // Step 2: Reserve inventory
    interface ReserveInventory {
        Promise<ReservedInventory> apply(ValidOrderRequest request);
    }

    // Step 3: Process payment
    interface ProcessPayment {
        Promise<PaymentConfirmation> apply(ReservedInventory reservation, Money total);
    }

    // Step 4: Create order record
    interface CreateOrder {
        Promise<OrderId> apply(ReservedInventory reservation, PaymentConfirmation payment);
    }

    // Step 5: Send confirmation (best-effort)
    interface SendConfirmation {
        Promise<Unit> apply(OrderId orderId, ValidOrderRequest request);
    }

    // Step 6: Release inventory (compensation)
    interface ReleaseInventory {
        Promise<Unit> apply(ReservedInventory reservation);
    }

    // Factory
    static PlaceOrder placeOrder(
        CheckInventory checkInventory,
        ReserveInventory reserveInventory,
        ProcessPayment processPayment,
        CreateOrder createOrder,
        SendConfirmation sendConfirmation,
        ReleaseInventory releaseInventory,
        PriceCalculator priceCalculator
    ) {
        return request -> ValidOrderRequest.validOrderRequest(request)
            .async()
            .flatMap(checkInventory::apply)
            .flatMap(valid -> executeWithCompensation(
                valid,
                reserveInventory,
                processPayment,
                createOrder,
                releaseInventory,
                priceCalculator
            ).onSuccess(response -> sendConfirmation.apply(response.orderId(), valid)
                .onFailure(e -> { /* log but don't fail */ })));
    }

    private static Promise<Response> executeWithCompensation(
        ValidOrderRequest request,
        ReserveInventory reserveInventory,
        ProcessPayment processPayment,
        CreateOrder createOrder,
        ReleaseInventory releaseInventory,
        PriceCalculator priceCalculator
    ) {
        var total = priceCalculator.calculate(request);

        return reserveInventory.apply(request)
            .flatMap(reservation -> processPayment.apply(reservation, total)
                .flatMap(payment -> createOrder.apply(reservation, payment))
                .map(orderId -> new Response(orderId, total))
                .fold(result -> result.fold(
                    cause -> compensateAndFail(reservation, releaseInventory, cause),
                    Promise::success)));
    }

    private static Promise<Response> compensateAndFail(
        ReservedInventory reservation,
        ReleaseInventory releaseInventory,
        Cause cause
    ) {
        return releaseInventory.apply(reservation)
            .flatMap(_ -> cause.promise());
    }
}
```

---

## Step 5: Supporting Types

### ReservedInventory

```java
package com.example.shop.usecase.placeorder;

import java.time.Instant;
import java.util.List;

public record ReservedInventory(
    String reservationId,
    List<ReservedItem> items,
    Instant expiresAt
) {
    public record ReservedItem(String productId, int quantity) {}
}
```

### PaymentConfirmation

```java
package com.example.shop.usecase.placeorder;

import java.time.Instant;

public record PaymentConfirmation(
    String transactionId,
    Instant processedAt
) {}
```

### PriceCalculator

The only leaf in this use case with a decision space worth counting. Everything else here
either validates one field or calls one adapter; this one combines three independent rules
and has to resolve what happens when two of them apply at once.

```java
package com.example.shop.usecase.placeorder;

import com.example.shop.domain.shared.Money;
import com.example.shop.domain.shared.ProductId;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Unit prices and product facts. Products are known to exist: CheckInventory ran first. */
public interface PriceList {
    Money unitPrice(ProductId productId);
    boolean isOversized(ProductId productId);
}

public interface PriceCalculator {
    Money calculate(ValidOrderRequest request);

    Money FLAT_SHIPPING      = new Money(new BigDecimal("9.99"));
    Money OVERSIZED_SHIPPING = new Money(new BigDecimal("49.99"));
    BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("500.00");
    BigDecimal LARGE_ORDER_THRESHOLD   = new BigDecimal("1000.00");

    static PriceCalculator priceCalculator(PriceList prices) {
        return request -> {
            var subtotal = request.lines()
                                  .stream()
                                  .map(line -> prices.unitPrice(line.productId())
                                                     .multiply(line.quantity().value()))
                                  .reduce(Money.ZERO, Money::add)
                                  .value();

            var itemCount = request.lines()
                                   .stream()
                                   .mapToInt(line -> line.quantity().value())
                                   .sum();

            // Rule 1: volume, by item count.
            var volumeRate = itemCount >= 50 ? new BigDecimal("0.10")
                           : itemCount >= 20 ? new BigDecimal("0.05")
                           : BigDecimal.ZERO;

            // Rule 2: order value.
            var valueRate = subtotal.compareTo(LARGE_ORDER_THRESHOLD) >= 0
                            ? new BigDecimal("0.05")
                            : BigDecimal.ZERO;

            // Rule 3: they do not stack. The customer gets the better of the two.
            var discounted = subtotal.multiply(BigDecimal.ONE.subtract(volumeRate.max(valueRate)));

            // Rule 4: shipping, decided after the discount.
            var oversized = request.lines()
                                   .stream()
                                   .anyMatch(line -> prices.isOversized(line.productId()));
            var shipping = oversized                                          ? OVERSIZED_SHIPPING.value()
                         : discounted.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO
                                                                              : FLAT_SHIPPING.value();

            return new Money(discounted.add(shipping).setScale(2, RoundingMode.HALF_UP));
        };
    }
}
```

**Count the decisions before writing tests.** Three volume bands, two order-value bands,
three shipping outcomes: **eighteen combinations**, and the stacking rule is only
observable in the ones where both discounts are non-zero and unequal.

That number is what decides how this leaf gets tested, and it is available before a single
test exists. A branch count would say seven or eight; line coverage would go green well
short of eighteen. Neither instrument sees the space.

---

## Step 6: Step Implementations

### CheckInventory (Fork-Join Pattern)

```java
package com.example.shop.adapter.inventory;

import org.pragmatica.lang.Promise;
import com.example.shop.usecase.placeorder.PlaceOrder.CheckInventory;
import com.example.shop.usecase.placeorder.ValidOrderRequest;
import com.example.shop.usecase.placeorder.OrderLine;
import com.example.shop.usecase.placeorder.OrderError;
import com.example.shop.domain.shared.ProductId;

import java.util.List;

public class InventoryChecker implements CheckInventory {
    private final InventoryClient inventoryClient;

    public InventoryChecker(InventoryClient inventoryClient) {
        this.inventoryClient = inventoryClient;
    }

    @Override
    public Promise<ValidOrderRequest> apply(ValidOrderRequest request) {
        // Check all items in parallel (Fork-Join)
        var checks = request.items().stream()
            .map(this::checkItem)
            .toList();

        return Promise.allOf(checks)
            .flatMap(results -> aggregateResults(results, request));
    }

    private Promise<OrderLine> checkItem(OrderLine line) {
        return inventoryClient.getAvailable(line.productId())
            .flatMap(available -> available.value() >= line.quantity().value()
                ? Promise.success(line)
                : OrderError.InvalidQuantity(
                    line.productId(),
                    line.quantity(),
                    available
                  ).promise());
    }

    private Promise<ValidOrderRequest> aggregateResults(
        List<Result<OrderLine>> results,
        ValidOrderRequest request
    ) {
        var failures = results.stream()
            .filter(Result::isFailure)
            .map(r -> r.cause())
            .toList();

        if (failures.isEmpty()) {
            return Promise.success(request);
        }

        var failedProducts = failures.stream()
            .filter(c -> c instanceof OrderError.InvalidQuantity)
            .map(c -> ((OrderError.InvalidQuantity) c).productId())
            .toList();

        return new OrderError.InsufficientInventory(failedProducts).promise();
    }
}
```

### ProcessPayment (Leaf with Error Mapping)

```java
package com.example.shop.adapter.payment;

import org.pragmatica.lang.Promise;
import com.example.shop.usecase.placeorder.PlaceOrder.ProcessPayment;
import com.example.shop.usecase.placeorder.ReservedInventory;
import com.example.shop.usecase.placeorder.PaymentConfirmation;
import com.example.shop.usecase.placeorder.OrderError;
import com.example.shop.domain.shared.Money;

import java.time.Instant;
import java.util.concurrent.TimeoutException;

public class PaymentProcessor implements ProcessPayment {
    private final PaymentGateway gateway;

    public PaymentProcessor(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    @Override
    public Promise<PaymentConfirmation> apply(ReservedInventory reservation, Money total) {
        return Promise.lift(
            OrderError.PaymentFailed::new,
            () -> gateway.charge(total.value())
        ).map(txId -> new PaymentConfirmation(txId, Instant.now()))
         .mapError(this::mapPaymentError);
    }

    private Cause mapPaymentError(Cause cause) {
        return switch (cause) {
            case OrderError.PaymentFailed pf -> {
                if (pf.cause() instanceof TimeoutException) {
                    yield OrderError.General.PAYMENT_TIMEOUT;
                }
                if (isDeclined(pf.cause())) {
                    yield OrderError.General.PAYMENT_DECLINED;
                }
                yield cause;
            }
            default -> cause;
        };
    }

    private boolean isDeclined(Throwable t) {
        return t.getMessage() != null && t.getMessage().contains("declined");
    }
}
```

### CreateOrder (Leaf - Database)

```java
package com.example.shop.adapter.persistence;

import org.pragmatica.lang.Promise;
import org.jooq.DSLContext;
import com.example.shop.usecase.placeorder.PlaceOrder.CreateOrder;
import com.example.shop.usecase.placeorder.ReservedInventory;
import com.example.shop.usecase.placeorder.PaymentConfirmation;
import com.example.shop.usecase.placeorder.OrderError;
import com.example.shop.domain.shared.OrderId;

import java.util.UUID;

import static com.example.shop.adapter.persistence.Tables.*;

public class JooqOrderRepository implements CreateOrder {
    private final DSLContext dsl;

    public JooqOrderRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Promise<OrderId> apply(ReservedInventory reservation, PaymentConfirmation payment) {
        return Promise.lift(
            _ -> OrderError.General.DATABASE_ERROR,
            () -> {
                var orderId = UUID.randomUUID().toString();

                dsl.insertInto(ORDERS)
                    .set(ORDERS.ID, orderId)
                    .set(ORDERS.RESERVATION_ID, reservation.reservationId())
                    .set(ORDERS.PAYMENT_TX_ID, payment.transactionId())
                    .set(ORDERS.STATUS, "CONFIRMED")
                    .execute();

                for (var item : reservation.items()) {
                    dsl.insertInto(ORDER_ITEMS)
                        .set(ORDER_ITEMS.ORDER_ID, orderId)
                        .set(ORDER_ITEMS.PRODUCT_ID, item.productId())
                        .set(ORDER_ITEMS.QUANTITY, item.quantity())
                        .execute();
                }

                return new OrderId(orderId);
            }
        );
    }
}
```

---

## Step 7: Testing

### Value Object Tests

```java
class QuantityTest {

    @Nested
    class ValidationSucceeds {
        @Test
        void quantity_succeeds_forPositiveValue() {
            Quantity.quantity(5)
                .onFailure(Assertions::fail)
                .onSuccess(q -> assertEquals(5, q.value()));
        }

        @Test
        void quantity_succeeds_forMaxValue() {
            Quantity.quantity(100)
                .onFailure(Assertions::fail)
                .onSuccess(q -> assertEquals(100, q.value()));
        }
    }

    @Nested
    class ValidationFails {
        @Test
        void quantity_fails_forZero() {
            Quantity.quantity(0).onSuccess(Assertions::fail);
        }

        @Test
        void quantity_fails_forNegative() {
            Quantity.quantity(-1).onSuccess(Assertions::fail);
        }

        @Test
        void quantity_fails_forExceedingLimit() {
            Quantity.quantity(101).onSuccess(Assertions::fail);
        }
    }
}
```

### Complex Leaf Tests: the decision space

`PriceCalculator` has eighteen nominal combinations. Counting them first pays off twice:
it tells you how many vectors you need, and it tells you which cells cannot happen.

**Three of the eighteen are structurally impossible.** An order of 1000 or more, after a
discount of at most 10%, is still 900 or more, which always clears the free-shipping
threshold. A large order can never pay flat shipping. That is not a gap in the tests; it
is a fact about the rules, and you only see it because you counted.

Fifteen remain, and they go in a table, where a missing row is a visible hole:

```java
class PriceCalculatorTest {

    @ParameterizedTest
    @CsvSource({
        // unit,  items, oversized, expected  -- subtotal / volume band / value band / shipping
        "  20.00,     5, false,      109.99",  //   100 / none / low  / flat
        "   4.00,    25, false,      104.99",  //   100 / 5%   / low  / flat
        "   2.00,    50, false,       99.99",  //   100 / 10%  / low  / flat
        " 120.00,     5, false,      600.00",  //   600 / none / low  / free
        "  24.00,    25, false,      570.00",  //   600 / 5%   / low  / free
        "  12.00,    50, false,      540.00",  //   600 / 10%  / low  / free
        "  20.00,     5, true,       149.99",  //   100 / none / low  / oversized
        "   4.00,    25, true,       144.99",  //   100 / 5%   / low  / oversized
        "   2.00,    50, true,       139.99",  //   100 / 10%  / low  / oversized
        " 200.00,     5, false,      950.00",  //  1000 / none / high / free
        "  40.00,    25, false,      950.00",  //  1000 / 5% vs 5%: equal, so no stacking
        "  20.00,    50, false,      900.00",  //  1000 / 10% beats 5%: volume wins
        " 200.00,     5, true,       999.99",  //  1000 / none / high / oversized
        "  40.00,    25, true,       999.99",  //  1000 / 5%   / high / oversized
        "  20.00,    50, true,       949.99",  //  1000 / 10%  / high / oversized
    })
    void calculate_computesTotal_acrossTheDecisionSpace(BigDecimal unitPrice,
                                                        int items,
                                                        boolean oversized,
                                                        BigDecimal expected) {
        var prices = priceListOf(unitPrice, oversized);

        assertEquals(expected, PriceCalculator.priceCalculator(prices)
                                              .calculate(orderOf(items))
                                              .value());
    }

    /** Every unit costs the same, so the subtotal is unit price times item count. */
    static PriceList priceListOf(BigDecimal unitPrice, boolean oversized) {
        return new PriceList() {
            public Money unitPrice(ProductId id)  { return new Money(unitPrice); }
            public boolean isOversized(ProductId id) { return oversized; }
        };
    }
}
```

Two rows carry the stacking rule on their own: at 1000 and 25 items both discounts are 5%,
so an implementation that added them would return 900.00 instead of 950.00. At 1000 and 60
items the volume rule wins. Neither fact is visible from any single row.

### The one test that belongs at the composition

The table cannot see whether the calculated price is the price actually charged. That is a
fact about the chain, so it needs exactly one test in `PlaceOrderTest` -- and it needs an
**interaction assertion**, because the total does not appear in the use case's response:

```java
@Test
void execute_chargesTheCalculatedTotal() {
    var charged = new AtomicReference<Money>();

    PlaceOrder.ProcessPayment processPayment = (reserved, total) -> {
        charged.set(total);
        return Promise.success(new PaymentConfirmation("tx-456", Instant.now()));
    };
    // The REAL PriceCalculator, over the same price list the table uses:
    // 4.00 a unit, not oversized. Twenty-five items is 100.00, less 5% volume,
    // plus flat shipping.
    var priceCalculator = PriceCalculator.priceCalculator(
        PriceCalculatorTest.priceListOf(new BigDecimal("4.00"), false));
    // ... remaining stubs

    useCase.execute(orderRequestOf(25))
           .await()
           .onFailure(Assertions::fail)
           .onSuccess(_ -> assertEquals(new BigDecimal("104.99"), charged.get().value()));
}
```

**One composition test, fifteen isolated vectors.** Run the arithmetic the other way and
the cost is obvious: each composition vector needs six stubs, a request with lines and an
address, and an `await()` -- roughly fourteen lines against one row in a table. Fifteen of
those is about two hundred lines that assemble the whole use case to check a multiplication,
and every failure reports "PlaceOrder failed" rather than naming the rule that broke.

### Adapter Contract Tests

Every stub above is an assumption about a boundary. `checkInventory` returning
`Promise.success` asserts that the real `InventoryChecker` succeeds that way, and nothing
in the use case tests checks it. **That is what adapter contract tests are for, and a suite
without them is a suite whose stubs nobody has verified.**

Adapters get success and error modes -- not thirty repetitions of the happy path:

```java
class InventoryCheckerTest {
    @Test
    void apply_succeeds_whenAllItemsInStock() {
        var checker = new InventoryChecker(stockOf(PRODUCT, 10));

        checker.apply(requestFor(PRODUCT, 2))
               .await()
               .onFailure(Assertions::fail);
    }

    @Test
    void apply_fails_whenAnItemIsOutOfStock() {
        var checker = new InventoryChecker(stockOf(PRODUCT, 1));

        checker.apply(requestFor(PRODUCT, 2))
               .await()
               .onSuccess(Assertions::fail);
    }

    @Test
    void apply_wrapsTheFailure_whenTheInventoryServiceIsDown() {
        var checker = new InventoryChecker(failingClient(new IOException("connection reset")));

        checker.apply(requestFor(PRODUCT, 2))
               .await()
               .onSuccess(Assertions::fail)
               .onFailure(cause -> assertInstanceOf(OrderError.InventoryUnavailable.class, cause));
    }
}
```

The third one matters most: it pins the translation from an exception at the boundary to a
typed failure inside the domain. That translation is the adapter's entire job, and it is
the one thing no use case test can reach.

### Use Case Integration Test

```java
class PlaceOrderTest {
    private PlaceOrder useCase;

    @BeforeEach
    void setup() {
        // All stubs - happy path
        PlaceOrder.CheckInventory checkInventory = req -> Promise.success(req);
        PlaceOrder.ReserveInventory reserveInventory = req -> Promise.success(
            new ReservedInventory("res-123", List.of(), Instant.now().plusMinutes(15))
        );
        PlaceOrder.ProcessPayment processPayment = (res, total) -> Promise.success(
            new PaymentConfirmation("tx-456", Instant.now())
        );
        PlaceOrder.CreateOrder createOrder = (res, pay) -> Promise.success(
            new OrderId("order-789")
        );
        PlaceOrder.SendConfirmation sendConfirmation = (id, req) -> Promise.success(null);
        PlaceOrder.ReleaseInventory releaseInventory = res -> Promise.success(null);
        PriceCalculator priceCalculator = req -> new Money(BigDecimal.valueOf(99.99));

        useCase = PlaceOrder.placeOrder(
            checkInventory, reserveInventory, processPayment,
            createOrder, sendConfirmation, releaseInventory, priceCalculator
        );
    }

    @Nested
    class HappyPath {
        @Test
        void execute_succeeds_forValidOrder() {
            var request = new OrderRequest(
                "550e8400-e29b-41d4-a716-446655440000",
                List.of(new OrderRequest.LineItemRequest(
                    "660e8400-e29b-41d4-a716-446655440001", 2
                )),
                new OrderRequest.AddressRequest("123 Main St", "City", "12345", "US")
            );

            useCase.execute(request)
                .await()
                .onFailure(Assertions::fail)
                .onSuccess(response -> {
                    assertEquals("order-789", response.orderId().value());
                });
        }
    }

    @Nested
    class ValidationFailures {
        @Test
        void execute_fails_forEmptyOrder() {
            var request = new OrderRequest(
                "550e8400-e29b-41d4-a716-446655440000",
                List.of(),
                new OrderRequest.AddressRequest("123 Main St", "City", "12345", "US")
            );

            useCase.execute(request)
                .await()
                .onSuccess(Assertions::fail);
        }
    }

    @Nested
    class StepFailures {
        @Test
        void execute_fails_whenInventoryInsufficient() {
            PlaceOrder.CheckInventory failingCheck = req ->
                new OrderError.InsufficientInventory(List.of()).promise();

            var failingUseCase = PlaceOrder.placeOrder(
                failingCheck, null, null, null, null, null, null
            );

            failingUseCase.execute(validRequest())
                .await()
                .onSuccess(Assertions::fail);
        }

        @Test
        void execute_releasesInventory_whenPaymentFails() {
            var released = new AtomicBoolean(false);

            PlaceOrder.ReserveInventory reserveInventory = req -> Promise.success(
                new ReservedInventory("res-123", List.of(), Instant.now().plusMinutes(15))
            );
            PlaceOrder.ProcessPayment failingPayment = (res, total) ->
                OrderError.General.PAYMENT_DECLINED.promise();
            PlaceOrder.ReleaseInventory releaseInventory = res -> {
                released.set(true);
                return Promise.success(null);
            };

            var failingUseCase = PlaceOrder.placeOrder(
                req -> Promise.success(req),
                reserveInventory,
                failingPayment,
                null,
                null,
                releaseInventory,
                req -> Money.ZERO
            );

            failingUseCase.execute(validRequest())
                .await()
                .onSuccess(Assertions::fail);

            assertTrue(released.get(), "Inventory should be released on payment failure");
        }
    }

    private OrderRequest validRequest() {
        return new OrderRequest(
            "550e8400-e29b-41d4-a716-446655440000",
            List.of(new OrderRequest.LineItemRequest(
                "660e8400-e29b-41d4-a716-446655440001", 2
            )),
            new OrderRequest.AddressRequest("123 Main St", "City", "12345", "US")
        );
    }
}
```

---

## Key Patterns Demonstrated

| Pattern | Where Used | Purpose |
|---------|------------|---------|
| Fork-Join | ValidOrderRequest, CheckInventory | Parallel field validation, parallel inventory checks |
| Sequencer | Main flow | Reserve -> Pay -> Create |
| Leaf | ProcessPayment, CreateOrder | Single I/O operations |
| Condition | Error mapping in ProcessPayment | Route to specific error types |
| Aspects | SendConfirmation | Best-effort with failure tolerance |

## Compensation Pattern

This example demonstrates compensation (rollback) when payment fails after inventory is reserved:

```
reserve() -> pay() -> create()
              |
              v (failure)
         release() -> propagate error
```

The `recover()` method enables clean compensation logic without try-catch.

---

## Exercises

1. **Add discount support:** Modify `PriceCalculator` to accept a discount code and validate it as a value object.

2. **Add idempotency:** Ensure the same order request doesn't create duplicate orders. What value object would you create?

3. **Add retry aspect:** Wrap `ProcessPayment` with a retry aspect that retries on timeout but not on declined.

4. **Test the compensation:** Write a test verifying that inventory is released when `CreateOrder` fails (not just `ProcessPayment`).

---

## Summary

PlaceOrder demonstrates:

- **Fork-Join for validation** - All fields validated in parallel, errors accumulated
- **Fork-Join for I/O** - Inventory checked for all items in parallel
- **Sequencer with compensation** - Reserve -> Pay -> Create with rollback on failure
- **Error type hierarchy** - Grouped enum for fixed messages, records for data-carrying errors
- **Best-effort operations** - Notification doesn't fail the order
- **Adapter isolation** - All external calls wrapped in Promise.lift

The pattern composition remains simple despite the complex business requirements. Each step is independently testable, and the compensation logic is explicit rather than hidden in catch blocks.
