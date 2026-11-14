# Configuration Reference: aether.toml

```toml
# Database
[database]
type = "POSTGRESQL"
host = "localhost"
port = 5432
database = "myapp"
username = "app"
password = "${secrets:db/password}"

[database.pool_config]
min_connections = 5
max_connections = 30

# Multiple datasources
[database.analytics]
type = "POSTGRESQL"
host = "analytics-db.internal"
database = "analytics"

# HTTP clients
[http.external-api]
base_url = "https://api.example.com"
timeout_ms = 5000

# Messaging (Pub-Sub)
[messaging.order-events]
topic_name = "order-events"

# Streaming (snake_case keys; usually shipped as the slice's resources.toml, see resources/streaming.md)
[streams.audit-log]
partitions = 8
retention = "time"
retention_value = "24h"

# Notifications
[notification]
backend = "smtp"

[notification.smtp_config]
host = "smtp.example.com"
port = 587
tls_mode = "STARTTLS"

# PostgreSQL Notifications
[pg-notifications.order-changes]
datasource = "database"
channels = ["orders_changed"]

# Endpoints (resolved per-node)
[endpoints.payment-gateway]
host = "gateway.internal"
port = 443
```

Secret resolution: `${secrets:path}` resolved via cloud provider (AWS SM, GCP SM, Azure KV, Hetzner env vars).

Layering: `aether.toml` overrides the slice's own defaults (`META-INF/resources.toml`); operator changes via the management API override both. See [configuration.md](../resources/configuration.md).
