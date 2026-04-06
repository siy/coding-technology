---
name: release
description: Full release workflow — validate, wrap up, PR, merge, tag, build books, sync Leanpub, cleanup.
---

# Release

Execute the full release workflow for the coding-technology project.

## Prerequisites

- Must be on a `release-X.Y.Z` branch
- All changes should be committed or ready to commit

## Steps

### 1. Validate branch

Verify current branch matches `release-*` pattern. Extract version from branch name.

```bash
branch=$(git branch --show-current)
# Must match release-X.Y.Z
```

If not on a release branch, **stop and report**.

### 2. Pre-release check

Run `/pre-release-check`:
- Working tree clean or cleanable
- Version references consistent (JBCT version, Pragmatica Core version, lint rule count)
- No stale references outside CHANGELOG history
- CHANGELOG has entry for this version

If issues found, **fix them before continuing**.

### 3. Wrap up

Run `/wrap-up`:
- Commit any remaining changes in cohesive batches
- Update CHANGELOG if needed
- Push branch

### 4. Create PR

Check if PR already exists for this branch:
```bash
gh pr list --head release-X.Y.Z
```

If no PR exists, create one:
```bash
gh pr create --title "Release X.Y.Z" --body "..."
```

### 5. Merge PR

Merge with `--admin` flag (branch protection requires it):
```bash
gh pr merge --admin --merge
```

### 6. Switch to main and pull

```bash
git checkout main
git pull
```

### 7. Tag and push

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

### 8. Build books

```bash
cd book
echo "n" | ./build-pdf.sh
echo "n" | ./build-epub.sh
```

### 9. Sync Leanpub manuscripts

```bash
cd book
./sync-leanpub.sh
```

Note: Requires `LEANPUB_API_KEY` and `LEANPUB_BOOK_SLUG` environment variables. If not set, skip with a note.

### 10. Cleanup

Delete the release branch (local + remote):
```bash
git branch -d release-X.Y.Z
git push origin --delete release-X.Y.Z
```

## Output

Report each step's result. Final summary:
- Version released
- Tag pushed
- Books built (yes/no)
- Leanpub synced (yes/no)
- Branch cleaned up
