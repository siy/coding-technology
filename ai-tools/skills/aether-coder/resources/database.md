# Database: @Sql & @PgSql

## Generic SQL: @Sql

```java
static MySlice mySlice(@Sql SqlConnector db) { ... }
```

Config in `aether.toml`:
```toml
[database]
type = "POSTGRESQL"
host = "localhost"
port = 5432
database = "myapp"
username = "app"
password = "${secrets:db/password}"
```

SqlConnector API (requires `RowMapper<T>` for queries):
```java
db.queryOne(sql, mapper, params...)           // Promise<T>
db.queryOptional(sql, mapper, params...)      // Promise<Option<T>>
db.queryList(sql, mapper, params...)          // Promise<List<T>>
db.update(sql, params...)                     // Promise<Integer>
db.batch(sql, paramsList)                     // Promise<int[]>
db.transactional(conn -> conn.update(...))    // Promise<T>
```

## Type-Safe PostgreSQL: @PgSql

Compile-time generated persistence with named parameters and auto-CRUD:

```java
@PgSql
public interface OrderPersistence {
    @Query("SELECT * FROM orders WHERE id = :id")
    Promise<Option<OrderRow>> findById(long id);

    @Query("SELECT * FROM orders WHERE status = :status ORDER BY created_at DESC LIMIT :limit")
    Promise<List<OrderRow>> findByStatus(String status, int limit);

    Promise<OrderRow> save(OrderRow order);        // Auto-generated INSERT/UPDATE
    Promise<Unit> deleteById(long id);              // Auto-generated DELETE
}
```

Wire into slice: `static OrderService orderService(@PgSql OrderPersistence orders) { ... }`
