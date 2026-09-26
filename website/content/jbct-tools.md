# JBCT Tools

Most of JBCT's rules can be checked by a machine, and two tools do the checking: the `jbct` command-line tool and the `jbct-maven-plugin`. Both run the same formatter and the same linter, read the same `jbct.toml`, and ship in the same Pragmatica release. This page describes release **{{PRAGMATICA_VERSION}}**.

The linter checks **[72 rules](/java/jbct/rules/)**. Each rule on that list links to the course section that explains it, or says plainly that the book does not cover it.

## What a clean run means, and what it doesn't

- **The rules work from syntax alone.** Each file is judged on its own facts: its declarations, its package, its imports. There is no type resolution and no cross-file analysis, so a violation that only shows up once you know a type or follow a call is out of reach.
- **The layering rules only see packages they can classify.** `JBCT-ARCH-*` and `JBCT-MIX-01` place a package in a layer by a keyword in its name (`domain`, `application`/`usecase`, `adapter`/`integration`/`infra`, `bootstrap`/`main`), or by globs in `[lint.layers]`. A package that matches neither gets no layering diagnostics at all.
- **Two rules are off unless you turn them on.** `JBCT-SHAPE-02` and `JBCT-SHAPE-03` are census rules that are disabled by default. Enable them in `[lint.rules]` when you want a shape census.
- **Test sources aren't checked by default.** The Maven goals skip `src/test/java` unless `jbct.includeTests` is set. The CLI checks exactly the paths you give it.
- **A run over zero files usually passes.** `lint`, `check` and `format` print `No Java files found.` and exit 0 (`score` exits 1). The Maven goals print a warning instead of a file count and pass. On a real run each goal logs a count (`Linting N Java file(s)`, `Running JBCT check on N Java file(s)`), so read that count rather than trusting a green build.

## Install the CLI

The CLI needs JDK 25 or later. To install this release on Linux or macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/pragmaticalabs/pragmatica/v{{PRAGMATICA_VERSION}}/jbct/install.sh | sh -s -- --version {{PRAGMATICA_VERSION}}
```

The installer puts `jbct.jar` in `~/.jbct/lib` (set `JBCT_HOME` to change that) and writes a `jbct` wrapper to `~/.jbct/bin`. If `~/.zshrc`, `~/.bashrc` or `~/.bash_profile` exists, it appends `export PATH="$HOME/.jbct/bin:$PATH"` to the first one it finds. That line always names the default directory, so with a custom `JBCT_HOME` you need to add its `bin` to `PATH` yourself. Without `--version` it installs the newest release. To install by hand instead, download `jbct.jar` from the [GitHub release](https://github.com/pragmaticalabs/pragmatica/releases/tag/v{{PRAGMATICA_VERSION}}) and run `java -jar jbct.jar`.

Check the installation with `jbct --version`.

## CLI commands

| Command | What it does |
|---|---|
| `jbct format <path>...` | Formats files in place. `--check` reports without writing; `--dry-run` shows what would change. |
| `jbct lint <path>...` | Runs the rules. `-f text\|json\|sarif` chooses the output format; `-w` / `--fail-on-warning` fails on warnings too. |
| `jbct check <path>...` | Format check plus lint in one pass: the CI command. Also takes `-w`. |
| `jbct score <path>...` | Reports violation density (violations per 1,000 non-blank lines; lower is better). `--max-density N` fails when density is above `N`. |
| `jbct shape-census <path>...` | Reports how methods distribute across JBCT's structural patterns. It's a report, not a gate. |
| `jbct obligations --coverage <jacoco.xml> <path>...` | Lists compensations and absorbed failures that no test exercises. |
| `jbct init [dir]` | Creates a project. Aether slice by default; `--no-slice` gives a plain JBCT project. |
| `jbct upgrade` | Updates the CLI itself. `--check` only reports. |

Every analysis command takes `--config <file>`, which overrides `jbct.toml` key by key. `jbct --help` lists the rest, including the Aether slice scaffolding commands.

Warnings fail the CLI only with `-w`: the CLI ignores `failOnWarning` in `jbct.toml`, which only the Maven goals read.

In `score`, the `STYLE` category is **advisory**: it covers formatting, logging, member ordering and zone naming. Those rules are counted and reported separately, and they are left out of the total density, so they can't inflate the headline number.

### Exit codes

The commands don't use exit codes the same way in this release, so check the one your CI runs. For every command, an unknown option or bad argument also exits 2.

| Command | 0 | 1 | 2 |
|---|---|---|---|
| `lint` | no errors (warnings allowed) | warnings, with `-w` | **any ERROR finding**, or a file that could not be parsed |
| `check` | everything passed | a formatting issue, a lint error, or warnings with `-w` | a file the formatter or parser could not process |
| `format --check` | all files formatted | some file needs formatting | a file the formatter could not process |
| `score` | at or below `--max-density` (files that fail to parse are left out, not failed) | above `--max-density`, or no Java files found | — |

### What a finding looks like

This is real output from `jbct lint` at {{PRAGMATICA_VERSION}}, on a value object whose factory returns `null`:

```text
Email.java:6:13: ERROR [JBCT-RET-03] Method 'email' returns null; use Option<T> instead
Email.java:4:19: ERROR [JBCT-RET-06] Parameter 'raw' in method 'email' is checked for null - use Option<T> instead

Checked 1 file(s): 2 error(s), 0 warning(s), 0 info(s)
```

Each finding also prints an explanation with a before-and-after example, trimmed here. The command exited 2.

## Maven plugin

```xml
<plugin>
    <groupId>org.pragmatica-lite</groupId>
    <artifactId>jbct-maven-plugin</artifactId>
    <version>{{PRAGMATICA_VERSION}}</version>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

Declaring the plugin alone runs nothing. A goal runs when an execution binds it, as above (`check` binds to `verify`), or when you invoke it directly, for example `mvn jbct:check`.

| Goal | Default phase | What it does |
|---|---|---|
| `jbct:format` | `process-sources` | Formats sources in place. |
| `jbct:process` | `process-sources` | Formats in place and lints, in one pass. |
| `jbct:format-check` | `verify` | Fails if any file needs formatting. |
| `jbct:lint` | `verify` | Fails on any ERROR finding, or on warnings when `failOnWarning = true`. |
| `jbct:check` | `verify` | Format check plus lint. |
| `jbct:score` | `verify` | Reports density; fails above `jbct.density.maxPerKloc`. |

| Property | Default | Meaning |
|---|---|---|
| `jbct.skip` | `false` | Skip the goal. It logs `Skipping JBCT <goal>` and passes. |
| `jbct.includeTests` | `false` | Also process `src/test/java`. |
| `jbct.sourceDirectory` | `${project.build.sourceDirectory}` | Main sources. |
| `jbct.testSourceDirectory` | `${project.build.testSourceDirectory}` | Test sources, used only with `includeTests`. |
| `jbct.density.maxPerKloc` | none | The density gate for `jbct:score`. |

The plugin also has goals for packaging and deploying Aether slices and blueprints. Those belong to [Aether](/java/aether/), not to code checking.

## Configuration: `jbct.toml`

```toml
[format]
maxLineLength = 120
indentSize = 4

[lint]
failOnWarning = false     # read by the Maven goals only; the CLI uses -w
excludePackages = ["com.example.generated.**"]

[lint.rules]
JBCT-SHAPE-02 = "info"     # enable a default-disabled census rule
JBCT-STY-06 = "off"

[lint.layers]              # optional; omit to rely on package-name keywords
domain = ["com.example.**.domain.**"]
```

Settings are merged key by key, lowest priority first: built-in defaults, then `~/.jbct/config.toml`, then every `jbct.toml` from the repository root down to the working directory, then `--config`. Inside a git repository the walk stops at the repository root, so a `jbct.toml` above it is never read. Outside a repository nothing stops the walk, so a `jbct.toml` in any parent directory, including your home directory, applies.

A `[lint.rules]` value is `error`, `warning` (or `warn`), `info`, or `off` (or `disabled`). **Any other value is silently ignored.** A typo such as `"eror"` leaves the rule at its default, and nothing tells you.

## Suppressing a rule

Suppressions go on the element and cover it and everything inside it:

- `@SuppressWarnings("JBCT-RET-01")` suppresses one rule; pass an array for several.
- `@SuppressWarnings("all")` suppresses every JBCT rule.
- `@Contract` suppresses every JBCT rule, for a signature dictated by an external API.
- `@NullReturn` suppresses `JBCT-RET-03`, for an intentional `null` return.
- `@TerminalOperation` suppresses `JBCT-PAT-03`, for an intentional blocking `await()`.

## Links

- [The rules](/java/jbct/rules/): all 72, with defaults and course sections
- [Tool source](https://github.com/pragmaticalabs/pragmatica/tree/v{{PRAGMATICA_VERSION}}/jbct): `jbct/` in the Pragmatica repository
- [JBCT course](/java/jbct/course/): the method the rules come from
