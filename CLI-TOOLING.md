# JBCT CLI

Command-line tools for Java Backend Coding Technology - formatting, linting, and project management.

## Overview

JBCT CLI provides:

| Command | Purpose |
|---------|---------|
| `jbct format` | Format Java source files to JBCT style |
| `jbct lint` | Check code for JBCT compliance (37 rules) |
| `jbct check` | Combined format check + lint |
| `jbct init` | Create new JBCT-compliant project |
| `jbct update` | Update AI tools from repository |
| `jbct upgrade` | Self-update to latest version |
| `jbct verify-slice` | Validate Aether slice configuration |

## Installation

### Quick Install (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/siy/jbct-cli/main/install.sh | sh
```

The installer:
- Verifies Java is installed (JDK 25+ required)
- Downloads latest release from GitHub
- Installs to `~/.jbct/lib/jbct.jar`
- Creates wrapper script at `~/.jbct/bin/jbct`
- Adds `~/.jbct/bin` to PATH in your shell RC file

Custom install location:
```bash
JBCT_HOME=/custom/path sh install.sh
```

### Manual Installation

Download `jbct.jar` from [releases](https://github.com/siy/jbct-cli/releases) and run:

```bash
java -jar jbct.jar --help
```

### Build from Source

```bash
git clone https://github.com/siy/jbct-cli.git
cd jbct-cli
mvn package -DskipTests
# JAR: jbct-cli/target/jbct.jar
```

### Verify Installation

```bash
jbct --version
```

---

## Commands

### format

Format Java source files in-place to JBCT style.

```bash
jbct format src/main/java
```

**Options:**

| Option | Description |
|--------|-------------|
| `--check` | Report files needing formatting, exit 1 if any found |
| `--dry-run` | Show what would be formatted without writing |
| `--verbose` | Show detailed output |

**Examples:**

```bash
# Format all Java files
jbct format src/main/java

# Check formatting without modifying (for CI)
jbct format --check src/main/java

# Preview changes without writing
jbct format --dry-run src/main/java

# Format with verbose output
jbct format --verbose src/main/java
```

**Exit codes:**
- `0` - All files formatted or already compliant
- `1` - Files need formatting (with `--check`)

### lint

Check code for JBCT compliance using 37 lint rules.

```bash
jbct lint src/main/java
```

**Options:**

| Option | Description |
|--------|-------------|
| `--format <text\|json\|sarif>` | Output format (default: text) |
| `--fail-on-warning` | Treat warnings as errors |
| `--verbose` | Show detailed output |

**Examples:**

```bash
# Lint with text output
jbct lint src/main/java

# Lint with JSON output (for tooling)
jbct lint --format json src/main/java

# Lint with SARIF output (for GitHub Code Scanning)
jbct lint --format sarif src/main/java

# Fail on any warning
jbct lint --fail-on-warning src/main/java
```

**Exit codes:**
- `0` - All checks passed
- `1` - Lint issues found
- `2` - Internal error (parse failure, etc.)

### check

Combined format check and lint (recommended for CI).

```bash
jbct check src/main/java
```

**Options:**

| Option | Description |
|--------|-------------|
| `--fail-on-warning` | Treat warnings as errors |
| `--verbose` | Show detailed output |

**Examples:**

```bash
# Full check (format + lint)
jbct check src/main/java

# Strict mode (warnings are errors)
jbct check --fail-on-warning src/main/java
```

**Exit codes:**
- `0` - All checks passed
- `1` - Format or lint issues found
- `2` - Internal error

### init

Create a new JBCT-compliant project.

```bash
jbct init my-project
```

**Options:**

| Option | Description |
|--------|-------------|
| `--group-id <id>` | Custom Maven group ID |
| `--slice <name>` | Create Aether slice project |

**Examples:**

```bash
# Create new project in directory
jbct init my-project

# Initialize current directory
jbct init .

# With custom group ID
jbct init --group-id com.example my-project

# Create Aether slice project
jbct init --slice my-slice
```

**What it creates:**

Standard project:
- JBCT-compliant `pom.xml`
- `jbct.toml` configuration
- AI tools installed to `~/.claude/`

Slice project (`--slice`):
- `@Slice` annotated interface with factory method
- Implementation class
- Sample request/response records
- Unit test

### update

Update AI tools from coding-technology repository.

```bash
jbct update
```

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Force update even if current |
| `--check` | Check only, don't install |

**Examples:**

```bash
# Update if new version available
jbct update

# Force update
jbct update --force

# Check for updates only
jbct update --check
```

### upgrade

Self-update JBCT CLI to the latest version.

```bash
jbct upgrade
```

**Options:**

| Option | Description |
|--------|-------------|
| `--check` | Check only, don't install |
| `--force` | Force reinstall |

**Examples:**

```bash
# Check and install latest
jbct upgrade

# Check only
jbct upgrade --check

# Force reinstall
jbct upgrade --force
```

### verify-slice

Validate Aether slice project configuration.

```bash
jbct verify-slice
```

**Options:**

| Option | Description |
|--------|-------------|
| `--strict` | Fail on warnings |

**Examples:**

```bash
# Validate current directory
jbct verify-slice

# Validate specific directory
jbct verify-slice my-slice

# Strict mode
jbct verify-slice --strict
```

**What it checks:**
- Missing `pom.xml` or `slice.class` property
- Missing `slice-api.properties` (annotation processor not run)
- Missing manifest entries

---

## Lint Rules (37 total)

### Return Kinds (5 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-RET-01` | ERROR | Business methods must use T, Option, Result, or Promise |
| `JBCT-RET-02` | ERROR | No nested wrappers (`Promise<Result<T>>`, `Option<Option<T>>`) |
| `JBCT-RET-03` | ERROR | Never return null - use `Option<T>` |
| `JBCT-RET-04` | ERROR | Use `Unit` instead of `Void` |
| `JBCT-RET-05` | WARNING | Avoid always-succeeding Result (return T directly) |

### Value Objects (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-VO-01` | WARNING | Value objects should have factory returning `Result<T>` |
| `JBCT-VO-02` | ERROR | Don't bypass factory with direct constructor calls |

### Exceptions (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-EX-01` | ERROR | No business exceptions (throw, throws, exception classes) |
| `JBCT-EX-02` | ERROR | Don't use `orElseThrow()` - use Result/Option |

### Naming (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-NAM-01` | WARNING | Factory methods: `TypeName.typeName()` |
| `JBCT-NAM-02` | WARNING | Use `Valid` prefix, not `Validated` |

### Lambda/Composition (4 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-LAM-01` | WARNING | No complex logic in lambdas (if, switch, try-catch) |
| `JBCT-LAM-02` | WARNING | No braces in lambdas - extract to methods |
| `JBCT-LAM-03` | WARNING | No ternary in lambdas - use `filter()` or extract |
| `JBCT-UC-01` | WARNING | Use case factories should return lambdas, not nested records |

### Patterns (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-PAT-01` | WARNING | Use functional iteration instead of raw loops |
| `JBCT-PAT-02` | WARNING | No Fork-Join inside Sequencer (`Result.all` inside `flatMap`) |
| `JBCT-SEQ-01` | WARNING | Chain length limit (2-5 steps) |

### Style (6 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-STY-01` | WARNING | Prefer fluent failure: `cause.result()` not `Result.failure(cause)` |
| `JBCT-STY-02` | WARNING | Prefer constructor references: `X::new` not `v -> new X(v)` |
| `JBCT-STY-03` | WARNING | No fully qualified class names in code |
| `JBCT-STY-04` | WARNING | Utility class pattern: use sealed interface with `unused` record |
| `JBCT-STY-05` | WARNING | Prefer method references over equivalent lambdas |
| `JBCT-STY-06` | WARNING | Import ordering: java → javax → pragmatica → third-party → project |

### Logging (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-LOG-01` | WARNING | No conditional logging - let log level handle filtering |
| `JBCT-LOG-02` | WARNING | No logger as method parameter - component owns its logger |

### Architecture (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-MIX-01` | ERROR | No I/O operations in domain packages |

### Static Imports (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-STATIC-01` | WARNING | Prefer static imports for Pragmatica factories |

### Utilities (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-UTIL-01` | WARNING | Use Pragmatica parsing utilities (`Number.parseInt`, etc.) |
| `JBCT-UTIL-02` | WARNING | Use `Verify.Is` predicates for validation |

### Nesting (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-NEST-01` | WARNING | No nested monadic operations in lambdas |

### Zones (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-ZONE-01` | WARNING | Step interfaces should use Zone 2 verbs (validate, process, handle) |
| `JBCT-ZONE-02` | WARNING | Leaf functions should use Zone 3 verbs (get, fetch, parse) |
| `JBCT-ZONE-03` | WARNING | No zone mixing in sequencer chains |

### Acronyms (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-ACR-01` | WARNING | Acronyms should use PascalCase (`HttpClient`, not `HTTPClient`) |

### Sealed Types (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-SEAL-01` | WARNING | Error interfaces extending Cause should be sealed |

### Slice Architecture (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `JBCT-SLICE-01` | ERROR | External slice dependencies must use API interface |

**Note:** JBCT-SLICE-01 requires `slicePackages` configuration:
```toml
[lint]
slicePackages = ["**.usecase.**"]
```

---

## Formatter Style

The JBCT formatter enforces consistent style:

### Method Chain Alignment

Continuation aligned to receiver:

```java
return ValidRequest.validRequest(request)
                   .async()
                   .flatMap(checkEmail::apply)
                   .flatMap(saveUser::apply);
```

### Argument Alignment

Multi-line arguments aligned to opening paren:

```java
return Result.all(Email.email(raw.email()),
                  Password.password(raw.password()),
                  ReferralCode.referralCode(raw.referral()))
             .map(ValidRequest::new);
```

### Import Grouping

```java
// 1. org.pragmatica.*
import org.pragmatica.lang.Result;
import org.pragmatica.lang.Option;

// 2. java/javax
import java.util.List;

// 3. Third-party
import com.fasterxml.jackson.annotation.JsonProperty;

// 4. Project
import com.example.domain.Email;

// (blank line)

// 5. Static imports (same grouping order)
import static org.pragmatica.lang.Result.all;
```

### Other Rules

- **Indentation**: 4 spaces, no tabs
- **Line length**: 120 characters max
- **Blank lines**: One between methods, none after opening brace

---

## Configuration

JBCT uses `jbct.toml` for configuration:

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

### Priority Chain

1. CLI arguments (highest)
2. `./jbct.toml` (project)
3. `~/.jbct/config.toml` (user)
4. Built-in defaults (lowest)

### Rule Severity Levels

| Level | Description |
|-------|-------------|
| `error` | Causes non-zero exit code |
| `warning` | Reported but doesn't fail (unless `--fail-on-warning`) |
| `off` | Rule disabled |

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

## CI Integration

### GitHub Actions

```yaml
name: JBCT Check

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '25'
          distribution: 'temurin'

      - name: Install JBCT CLI
        run: curl -fsSL https://raw.githubusercontent.com/siy/jbct-cli/main/install.sh | sh

      - name: Run JBCT Check
        run: jbct check src/main/java
```

### With Maven Plugin

If using the [Maven plugin](MAVEN-PLUGIN.md), CI is simpler:

```yaml
- uses: actions/setup-java@v4
  with:
    java-version: '25'
    distribution: 'temurin'
    cache: maven

- run: mvn verify -B
```

With plugin bound to verify phase, `mvn verify` runs all checks.

---

## Requirements

- Java 25+
- Linux, macOS, or Windows (WSL)

---

## Resources

- [AI Tools](AI-TOOLING.md) - Claude Code integration
- [Maven Plugin](MAVEN-PLUGIN.md) - Build integration
- [JBCT Coding Guide](CODING_GUIDE.md) - Complete technical reference
- [GitHub Repository](https://github.com/siy/jbct-cli)

## Support

If you find this useful, consider [sponsoring](https://github.com/sponsors/siy).

## License

Apache 2.0
