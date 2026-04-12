## Governing Documents

RFCs: https://github.com/pragmaticalabs/pragmatica/tree/master/docs/rfc

Relevant RFCs:
- RFC-0000: Ecosystem Foundation

---

## Conversation Style

Extreme brevity. No preamble/postamble. Execute immediately, explain only for safety/clarity.

**Ask** when: ambiguous requirements, missing critical info, destructive operations, multiple valid approaches.
**Execute** when: clear requests, standard patterns, recoverable operations, obvious next steps.

**Pattern:** Read → Act → Verify. Parallel when independent. Track progress with tasks for 3+ step work.

**Responses:** Direct answers for questions. Execute + confirm for commands. Structured progress for complex tasks. Minimize words, maximize clarity.

---

## Java & Pragmatica Core

For Java formatting rules, Pragmatica Core API reference, and JBCT patterns, see the `jbct-coder` agent or `/jbct` skill. They are the authoritative sources.

---

## Project Notes

- **"The document"** = CODING_GUIDE.md unless context says otherwise.
- **Tag versions** only after explicit command. Multiple changes may precede a tag.
- **jbct-coder.md header**: Preserve during edits. Update description if needed; ask before changing other fields.
- **PR merged** → check current branch; if not main, switch to main and pull.

## ndx

`ndx` is available in this project. Use `/ndx` for full CLI reference.

Key commands: `ndx recall search "query"` (hybrid search), `ndx recall wake` (context), `ndx xref drawer <file>` (cross-ref).

Skills: `/ndx-recall-classify`, `/ndx-recall-score`, `/ndx-recall-dedupe`, `/ndx-recall-contradict`, `/ndx-recall-summarize`, `/ndx-recall-handover`.

If recall palace is not initialized, run `ndx recall init` then `ndx recall mine --from-memory`.
