# HTTP Client: @Http

Default config section `"http"`:
```java
static MySlice mySlice(@Http HttpClient client) {
    return request -> client.post("/endpoint", requestBody)
                            .map(HttpResult::body);  // Promise<HttpResult<String>>
}
```

For multiple HTTP clients, define custom qualifiers:
```java
@ResourceQualifier(type = HttpClient.class, config = "http.payment-gateway")
@Retention(RUNTIME) @Target(PARAMETER)
public @interface PaymentGateway {}
```

Config:
```toml
[http]
base_url = "https://api.example.com"

[http.payment-gateway]
base_url = "https://payments.example.com"
timeout_ms = 5000
```

HttpClient API returns `Promise<HttpResult<String>>`:
```java
client.get(path)                          // GET
client.post(path, body)                   // POST
client.put(path, body)                    // PUT
client.delete(path)                       // DELETE
client.patch(path, body)                  // PATCH
// All have overloads with Map<String, String> headers parameter
```
