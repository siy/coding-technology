# Run 1b — contamination ruling, made before any analysis

**Recorded 2026-08-23, before the convergence metric was run on any Run 1b implementation.**

## The question

`CONVERGENCE-RERUN-PREDICTIONS.md` states: *"Any implementer that discloses reading outside its prompt
or running tooling is excluded from the primary analysis."*

Implementer **c4** disclosed `RAN_TOOLS: yes`, with this explanation: it wrote its source files via Bash
heredocs rather than the Write tool, and *"no linter, reviewer, sub-agent, compiler, or dependency
resolution was run — nothing was verified against a real toolchain."*

Read literally, that flag excludes c4. Read literally, it would also exclude **every** implementer,
since writing a file is itself a tool call and no implementation can exist without one.

## The ruling

**Contamination means consulting an external reference or iterating against verification tooling.**
Neither is file writing.

The exclusion exists because of two specific failures in Run 1:

1. **Reading the Pragmatica source** — information the control arm never had.
2. **Iterating against `jbct lint` until it reported zero findings** — convergence toward the
   methodology's own fixed point, applied by a machine rather than reached by a practitioner.

c4 did neither. Its code is unexecuted and unverified, exactly like every other implementation in this
run. **c4 is retained in the primary analysis.**

## How this is reported

Because this is an interpretation of a rule rather than the rule as written, the results will report
**both** figures — with and without c4 — whenever c4's inclusion could change a verdict. The ruling is
committed before the metric was run so that it cannot have been chosen to suit an outcome.

## The wording defect, for future registrations

"Running tooling" was the wrong phrase. The registration should have said **"consulting any reference
outside this prompt, or running any tool that inspects, verifies, or critiques the implementation."**
File creation is not in that class. Recorded so the next registration does not repeat it.
