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

# Streaming
[streams.audit-log]
partitions = 8
retention = "time"
retention-value = "24h"

# Notifications
[notification]
provider = "smtp"
host = "smtp.example.com"

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
