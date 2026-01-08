---
name: jbct-review
description: Thorough parallel JBCT code review. Launches multiple focused reviewers to check all 18 JBCT compliance areas simultaneously.
---

# JBCT Parallel Code Review

Comprehensive JBCT compliance review using parallel focused workers.

## Usage

```
/jbct-review                           # Full codebase, all focus areas
/jbct-review src/main/java             # Specific path, all focus areas
/jbct-review --focus="fold(),Lambdas"  # Specific focus areas only
/jbct-review src --focus="Void,Null"   # Combined path and focus
```

## Arguments

- `path` (optional): Directory or file to review. Default: entire codebase
- `--focus` (optional): Comma-separated list of focus areas. Default: all 18 areas

## Focus Areas

| Short Name | Full Focus Area |
|------------|-----------------|
| `VOFactories` | Value Object Factories |
| `VOImmutability` | Value Object Immutability |
| `UCStructure` | Use Case Structure |
| `UCComposition` | Use Case Composition |
| `Result/Promise` | Return Types - Result/Promise |
| `Void` | Return Types - Void → Unit |
| `Exceptions` | Return Types - Exceptions |
| `Leaf` | Structural: Leaf |
| `Sequencer` | Structural: Sequencer |
| `Fork-Join` | Structural: Fork-Join |
| `fold()` | Composition: fold() Abuse |
| `Lambdas` | Composition: Lambda Complexity |
| `Null` | Null Policy |
| `Logging` | Logging Patterns |
| `ThreadSafety` | Thread Safety |
| `Naming` | Naming Conventions |
| `Testing` | Testing Patterns |
| `Security` | Security + Performance |

## Execution Steps

### Step 1: Parse Arguments

```
1. Extract path argument (if provided, default to current directory)
2. Extract --focus argument (if provided, default to all 18 areas)
3. Parse focus areas into list
```

### Step 2: Discover Files

```
1. Use Glob to find all Java files in target path: **/*.java
2. Filter out test files if reviewing production code only
3. Count total files to review
```

### Step 3: Launch Parallel Workers

**For each focus area**, launch a jbct-reviewer agent with the focus parameter:

```
Task tool call:
  subagent_type: "jbct-reviewer"
  prompt: |
    Review the following Java files for JBCT compliance.

    **Focus Area:** [FOCUS_AREA_NAME]

    Check ONLY for violations in this specific area. Ignore other issues.

    Files to review:
    [LIST_OF_FILES]

    Report findings with severity levels (Critical/Warning/Suggestion/Nitpick).
```

**Launch all workers in parallel** using multiple Task tool calls in a single message.

### Step 4: Collect Results

Wait for all workers to complete. Each returns structured findings.

### Step 5: Consolidate Report

Merge all findings into a unified report, organized by severity:

```markdown
# JBCT Parallel Review Report

**Path:** [TARGET_PATH]
**Files Reviewed:** [COUNT]
**Focus Areas:** [LIST or "All 18"]

## Summary

| Severity | Count |
|----------|-------|
| Critical | X |
| Warning | Y |
| Suggestion | Z |
| Nitpick | W |

**Recommendation:** ✅ APPROVE | ⚠️ APPROVE WITH CHANGES | ❌ REQUEST CHANGES

---

## 🔒 Critical Issues

[All critical findings from all workers, with focus area tag]

### [Focus Area]: Issue Title
**File:** `path/to/file.java:line`
**Problem:** [Description]
**Fix:** [Suggested code]

---

## ⚠️ Warnings

[All warnings from all workers]

---

## 🛠️ Suggestions

[All suggestions from all workers]

---

## 🧹 Nitpicks

[All nitpicks from all workers]

---

## 🔧 Quick Fixes Summary

1. **Critical:** [One-line summary]
2. **Patterns:** [Key pattern improvements]
3. **Composition:** [fold() and lambda fixes]
```

## Example Execution

```
User: /jbct-review src/main/java

1. Parse: path = "src/main/java", focus = all 18 areas
2. Discover: 47 Java files found
3. Launch 18 parallel workers:
   - Worker 1: focus="Value Object Factories"
   - Worker 2: focus="Value Object Immutability"
   - ...
   - Worker 18: focus="Security + Performance"
4. Wait for all to complete
5. Consolidate: 3 Critical, 12 Warning, 8 Suggestion, 5 Nitpick
6. Output unified report
```

## Notes

- Each worker reviews ALL files but only checks for violations in its focus area
- This ensures thoroughness: narrow focus = deeper analysis
- Parallel execution: all 18 workers run simultaneously
- Deduplication: if multiple workers flag the same issue, keep one instance
