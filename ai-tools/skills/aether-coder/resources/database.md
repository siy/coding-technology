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

## jOOQ Integration

### Offline Code Generation via pg-tools

pg-tools generates jOOQ `XMLDatabase`-compatible XML from PostgreSQL migration files — no live DB, no Docker, no H2:

```bash
mvn pg:export-jooq-xml     # generates src/main/resources/jooq/jooq-schema.xml
```

CI drift detection:
```xml
<execution>
  <id>check-jooq-schema</id>
  <phase>verify</phase>
  <goals><goal>check-jooq-xml</goal></goals>
</execution>
```

Then wire standard jOOQ codegen against the XML:
```xml
<plugin>
  <groupId>org.jooq</groupId>
  <artifactId>jooq-codegen-maven</artifactId>
  <configuration>
    <generator>
      <database>
        <name>org.jooq.meta.xml.XMLDatabase</name>
        <properties>
          <property><key>xmlFile</key>
            <value>${project.basedir}/src/main/resources/jooq/jooq-schema.xml</value></property>
          <property><key>dialect</key><value>POSTGRES</value></property>
        </properties>
      </database>
    </generator>
  </configuration>
</plugin>
```

Workflow: edit migration → `mvn pg:export-jooq-xml` → commit XML alongside migration → jOOQ codegen reads XML offline.

Supported types: all PG built-ins (int, text, uuid, jsonb, timestamptz, arrays, enums, domains, composites as USER-DEFINED). 

### jOOQ Runtime Connectors

```java
static MySlice mySlice(@JooqConnector JooqConnector jooq) { ... }
```

Available connectors: `JdbcJooqConnector` (sync), `JooqR2dbcConnector` (reactive). Both support `transactional()` with auto-commit/rollback.
