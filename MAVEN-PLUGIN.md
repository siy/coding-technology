# JBCT Maven Plugin

Build integration for Java Backend Coding Technology - automated formatting and linting in your Maven build.

## Overview

The JBCT Maven Plugin provides:

| Goal | Description | Default Phase |
|------|-------------|---------------|
| `jbct:format` | Format source files in-place | process-sources |
| `jbct:format-check` | Check formatting (fail if issues) | verify |
| `jbct:lint` | Run lint rules | verify |
| `jbct:check` | Combined format-check + lint | verify |
| `jbct:collect-slice-deps` | Collect slice API dependencies | generate-sources |
| `jbct:verify-slice` | Validate slice configuration | verify |

## Installation

Add to your `pom.xml`:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.pragmatica-lite</groupId>
            <artifactId>jbct-maven-plugin</artifactId>
            <version>0.4.6</version>
        </plugin>
    </plugins>
</build>
```

---

## Goals

### jbct:format

Format Java source files in-place to JBCT style.

```bash
mvn jbct:format
```

**Behavior:**
- Processes all Java files in `src/main/java`
- Modifies files in-place
- Reports files that were formatted

**Example output:**
```
[INFO] Formatting src/main/java/com/example/Email.java
[INFO] Formatting src/main/java/com/example/Password.java
[INFO] Formatted 2 files
```

### jbct:format-check

Check formatting without modifying files. Fails if any file needs formatting.

```bash
mvn jbct:format-check
```

**Behavior:**
- Checks all Java files in `src/main/java`
- Does not modify files
- Exits with error if files need formatting
- Ideal for CI/CD pipelines

**Example output (success):**
```
[INFO] All 47 files are properly formatted
```

**Example output (failure):**
```
[ERROR] 3 files need formatting:
[ERROR]   src/main/java/com/example/Email.java
[ERROR]   src/main/java/com/example/Password.java
[ERROR]   src/main/java/com/example/User.java
```

### jbct:lint

Run JBCT lint rules (37 rules) against source files.

```bash
mvn jbct:lint
```

**Behavior:**
- Checks all Java files against JBCT rules
- Reports violations with severity levels
- Exits with error if ERROR-level violations found

**Example output:**
```
[INFO] Linting src/main/java...
[ERROR] src/main/java/com/example/User.java:15
        JBCT-RET-04: Use Unit instead of Void
[WARNING] src/main/java/com/example/Email.java:23
          JBCT-STY-01: Prefer fluent failure: cause.result() not Result.failure(cause)
[INFO] 1 error, 1 warning
```

### jbct:check

Combined format-check and lint (recommended for CI).

```bash
mvn jbct:check
```

**Behavior:**
- Runs format-check first
- Then runs lint
- Fails if either reports issues
- Single goal for complete JBCT compliance

**Example output:**
```
[INFO] --- jbct:check ---
[INFO] Checking formatting...
[INFO] All 47 files are properly formatted
[INFO] Running lint rules...
[INFO] All checks passed
```

### jbct:collect-slice-deps

Collect API dependencies for Aether slice projects.

```bash
mvn jbct:collect-slice-deps
```

**Behavior:**
- Scans slice dependencies
- Collects API interfaces
- Prepares for slice compilation

### jbct:verify-slice

Validate Aether slice project configuration.

```bash
mvn jbct:verify-slice
```

**Behavior:**
- Checks `pom.xml` for required properties
- Verifies slice API properties exist
- Validates manifest entries

---

## Binding to Build Lifecycle

### Recommended Setup

Bind the `check` goal to automatically run during `mvn verify`:

```xml
<plugin>
    <groupId>org.pragmatica-lite</groupId>
    <artifactId>jbct-maven-plugin</artifactId>
    <version>0.4.6</version>
    <executions>
        <execution>
            <id>check</id>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

Now `mvn verify` (and `mvn install`, `mvn deploy`) automatically runs JBCT checks.

### Format on Build

Auto-format during compilation:

```xml
<executions>
    <execution>
        <id>format</id>
        <phase>process-sources</phase>
        <goals>
            <goal>format</goal>
        </goals>
    </execution>
</executions>
```

### Multiple Goals

Combine formatting and checking:

```xml
<executions>
    <execution>
        <id>format</id>
        <phase>process-sources</phase>
        <goals>
            <goal>format</goal>
        </goals>
    </execution>
    <execution>
        <id>check</id>
        <phase>verify</phase>
        <goals>
            <goal>check</goal>
        </goals>
    </execution>
</executions>
```

---

## Configuration

### Plugin Configuration

```xml
<plugin>
    <groupId>org.pragmatica-lite</groupId>
    <artifactId>jbct-maven-plugin</artifactId>
    <version>0.4.6</version>
    <configuration>
        <!-- Skip JBCT processing -->
        <skip>false</skip>

        <!-- Include test sources -->
        <includeTests>false</includeTests>
    </configuration>
</plugin>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `skip` | boolean | `false` | Skip JBCT processing entirely |
| `includeTests` | boolean | `false` | Include test sources in processing |

### Skipping via Command Line

```bash
# Skip JBCT for single run
mvn verify -Djbct.skip=true
```

### jbct.toml Configuration

The Maven plugin reads configuration from `jbct.toml` in your project root. All formatting and linting settings are shared between CLI and Maven plugin.

Create `jbct.toml`:

```toml
[format]
maxLineLength = 120
indentSize = 4
alignChainedCalls = true

[lint]
failOnWarning = false
businessPackages = ["**.usecase.**", "**.domain.**"]
slicePackages = ["**.usecase.**"]  # Required for JBCT-SLICE-01

[lint.rules]
JBCT-RET-01 = "error"
JBCT-STY-01 = "warning"
JBCT-LOG-01 = "off"
```

---

## CI Integration

### GitHub Actions

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '25'
          distribution: 'temurin'
          cache: maven

      - name: Build and Verify
        run: mvn verify -B
```

With the plugin bound to the verify phase, `mvn verify` automatically runs all JBCT checks.

### GitLab CI

```yaml
build:
  image: maven:3.9-eclipse-temurin-25
  script:
    - mvn verify -B
  cache:
    paths:
      - .m2/repository
```

### Jenkins Pipeline

```groovy
pipeline {
    agent {
        docker { image 'maven:3.9-eclipse-temurin-25' }
    }
    stages {
        stage('Build') {
            steps {
                sh 'mvn verify -B'
            }
        }
    }
}
```

---

## Common Patterns

### Development Workflow

```bash
# Format code before commit
mvn jbct:format

# Check everything
mvn verify
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
mvn jbct:format-check -q
if [ $? -ne 0 ]; then
    echo "JBCT format check failed. Run 'mvn jbct:format' to fix."
    exit 1
fi
```

### IDE Integration

Configure your IDE to run `mvn jbct:format` on save or use the JBCT CLI directly:

```bash
jbct format src/main/java
```

---

## Lint Rules Reference

The Maven plugin uses the same 37 lint rules as the CLI. See [CLI Tooling](CLI-TOOLING.md#lint-rules-37-total) for the complete reference.

### Rule Categories

| Category | Rules | Description |
|----------|-------|-------------|
| Return Kinds | 5 | T, Option, Result, Promise usage |
| Value Objects | 2 | Factory patterns, construction |
| Exceptions | 2 | No business exceptions |
| Naming | 2 | Factory methods, Valid prefix |
| Lambda | 4 | Complexity, braces, ternary |
| Patterns | 3 | Iteration, mixing, chain length |
| Style | 6 | Fluent failures, references, imports |
| Logging | 2 | Conditional logging, ownership |
| Architecture | 1 | I/O in domain |
| Static Imports | 1 | Pragmatica factories |
| Utilities | 2 | Parsing, verification |
| Nesting | 1 | Nested monadic ops |
| Zones | 3 | Verb consistency |
| Acronyms | 1 | PascalCase |
| Sealed Types | 1 | Error interfaces |
| Slice | 1 | API dependencies |

### Suppressing Rules with @SuppressWarnings

Use standard Java `@SuppressWarnings` annotation to suppress JBCT rules:

```java
// Suppress single rule
@SuppressWarnings("JBCT-RET-01")
public void legacyMethod() {
    // This method won't trigger JBCT-RET-01
}

// Suppress multiple rules
@SuppressWarnings({"JBCT-RET-01", "JBCT-LAM-02"})
public void anotherMethod() {
    // Won't trigger either rule
}

// Suppress all JBCT rules
@SuppressWarnings("all")
public class LegacyAdapter {
    // No JBCT rules checked in this class
}
```

**Scope:** Suppression applies to the annotated element and its children:
- On class → suppresses for entire class (all methods)
- On method → suppresses for that method only

---

## Troubleshooting

### Plugin Not Found

Ensure you have access to Maven Central:

```xml
<pluginRepositories>
    <pluginRepository>
        <id>central</id>
        <url>https://repo.maven.apache.org/maven2</url>
    </pluginRepository>
</pluginRepositories>
```

### Java Version Issues

JBCT requires Java 25+:

```xml
<properties>
    <maven.compiler.source>25</maven.compiler.source>
    <maven.compiler.target>25</maven.compiler.target>
</properties>
```

### Format vs Check Mismatch

If `format-check` fails but `format` shows no changes, ensure:
- Same Java version in CLI and Maven
- Same `jbct.toml` configuration
- No IDE auto-formatting conflicts

---

## Requirements

- Java 25+
- Maven 3.9+

---

## Resources

- [AI Tools](AI-TOOLING.md) - Claude Code integration
- [CLI Tools](CLI-TOOLING.md) - Command-line usage
- [JBCT Coding Guide](CODING_GUIDE.md) - Complete technical reference
- [GitHub Repository](https://github.com/siy/jbct-cli)

## Support

If you find this useful, consider [sponsoring](https://github.com/sponsors/siy).

## License

Apache 2.0
