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

Slices do not begin serving until their schema migrations have succeeded (migrate, then serve). The gate is on by default; a blueprint opts out under its `[deployment]` table:

```toml
[deployment]
schema_required = false
```

Each migration is recorded with its checksum in an `aether_schema_history` table inside that datasource's own database. The engine manages tables, not databases: the datasource's database must already exist, and creating it is an environment step, not a migration. A datasource is migrated by one blueprint only; a second blueprint that migrates the same datasource is refused at publish. A migration directory whose config section is not configured cannot be migrated, so the slice is held rather than run against the wrong place.

## Migration Types

- **V** (Versioned) — applied once, in order
- **R** (Repeatable) — re-applied when checksum changes
- **U** (Undo) — rollback a versioned migration
- **B** (Baseline) — mark existing schema as baseline
