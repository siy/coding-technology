# Notifications: @Notify

Email/SMS sending. Default config section `"notification"`:

```java
static MySlice mySlice(@Notify NotificationSender email) {
    return request -> email.send(Notification.notification(
        "user@example.com", "Subject", "Body"));
}
```

Config:
```toml
[notification]
provider = "smtp"
host = "smtp.example.com"
port = 587
username = "${secrets:smtp/username}"
password = "${secrets:smtp/password}"
```

**Note:** `@Notify` is for email/SMS notifications, NOT for PostgreSQL LISTEN/NOTIFY. See [pg-notifications.md](pg-notifications.md) for database notifications.
