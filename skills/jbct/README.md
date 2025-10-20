# JBCT Skill for Claude Code

A comprehensive Claude Code skill for designing, implementing, and reviewing Java Backend Coding Technology (JBCT) code.

## Installation

1. **Create skills directory** (if it doesn't exist):
   ```bash
   mkdir -p ~/.claude/skills
   ```

2. **Copy this skill**:
   ```bash
   cp -r skills/jbct ~/.claude/skills/
   ```

3. **Verify installation**:
   ```bash
   ls ~/.claude/skills/jbct/SKILL.md
   ```

## What This Skill Provides

The JBCT skill gives Claude Code deep understanding of:

- **Four Return Kinds**: `T`, `Option<T>`, `Result<T>`, `Promise<T>`
- **Parse, Don't Validate**: Making invalid states unrepresentable
- **Six Structural Patterns**: Leaf, Sequencer, Fork-Join, Condition, Iteration, Aspects
- **Use Case Design**: Factories, validated inputs, step composition
- **Project Structure**: Vertical slicing, package organization
- **Naming Conventions**: Factory methods, validated inputs, error types
- **Testing Patterns**: Functional assertions with `onSuccess`/`onFailure`
- **Common Anti-Patterns**: Mistakes to avoid

## How It Works

Once installed, Claude Code automatically activates this skill when:
- Working with `Result`, `Option`, or `Promise` types
- Implementing value objects or use cases
- Discussing JBCT patterns or monadic composition
- Reviewing code for functional Java backend patterns

No explicit invocation needed - the skill activates based on context.

## Progressive Detalization

The skill is structured with three tiers of information:
1. **Quick Reference** - Essential patterns and rules
2. **Detailed Guidance** - Complete examples and explanations
3. **Advanced Topics** - Edge cases, testing, project organization

Claude Code retrieves only what's needed for each task, optimizing context usage.

## Related Resources

- **[CODING_GUIDE.md](../../CODING_GUIDE.md)** - Complete technical reference (100+ pages)
- **[series/](../../series/)** - 6-part progressive learning path
- **[jbct-coder.md](../../jbct-coder.md)** - Code generation subagent
- **[jbct-reviewer.md](../../jbct-reviewer.md)** - Code review subagent

## Version

Based on Java Backend Coding Technology v1.7.0

## License

MIT License - see [LICENSE](../../LICENSE) for details
