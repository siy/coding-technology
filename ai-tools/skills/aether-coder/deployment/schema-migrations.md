# Schema Migrations

Flyway-style versioned migrations in `schema/` directory:

```
src/main/resources/schema/
├── V001__create_orders_table.sql
├── V002__add_status_index.sql
└── V003__add_shipping_address.sql
```

## Multi-Datasource

Subdirectories map to config sections:
```
schema/                    # → [database] (default)
schema/analytics/          # → [database.analytics]
```

## Naming

`V{NNN}__{description}.sql` — double underscore between version and description.

## Gating

Slices won't activate until their schema migrations complete. Per-blueprint opt-out via `schema_required = false`.

## Migration Types

- **V** (Versioned) — applied once, in order
- **R** (Repeatable) — re-applied when checksum changes
- **U** (Undo) — rollback a versioned migration
- **B** (Baseline) — mark existing schema as baseline
