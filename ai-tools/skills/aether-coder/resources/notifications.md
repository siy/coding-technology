# Notifications: @Notify

Email sending (`Notification` is a sealed type, today an `Email`). Default config section `"notification"`:

```java
static OrderMailer orderMailer(@Notify NotificationSender mail) {
    return order -> mail.send(Notification.Email.email(
            "orders@shop.example",
            List.of(order.customerEmail()),
            "Order received",
            NotificationBody.Text.text("Thanks. We have your order.")))
        .mapToUnit();
}
```

`Email.email(from, to, subject, body)` leaves cc, bcc and reply-to empty; add them with `withCc`, `withBcc`, `withReplyTo`. `NotificationBody` is `Text` or `Html`.

Config: the `backend` key selects `smtp` or `http`; the `Notification` you build is the same either way, so switching providers is a config change.
```toml
[notification]
backend = "smtp"

[notification.smtp_config]
host = "smtp.example.com"
port = 587
tls_mode = "STARTTLS"

[notification.smtp_config.auth]
username = "${secrets:smtp/username}"
password = "${secrets:smtp/password}"
```

`backend = "http"` sends through a provider API and uses `[notification.http_config]` (`provider_hint`, `api_key`); the set of providers behind it is the part most likely to grow, so check the resource reference for the current list.

Delivery: `@Notify` email is at-least-once with retries and may duplicate; it is not pub-sub and carries no dead-letter queue.

**Note:** `@Notify` is for email notifications, NOT for PostgreSQL LISTEN/NOTIFY. See [pg-notifications.md](pg-notifications.md) for database notifications.
