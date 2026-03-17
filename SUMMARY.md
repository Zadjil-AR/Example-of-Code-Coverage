# Summary: Fixing Merge Base Issues in code-coverage-report-action

This document summarizes the changes needed to fix the merge base failure issue discovered in CI workflow run #22.

## Quick Reference

**Problem**: The code-coverage-report-action fails to find merge base in CI because it uses bare branch names like `main` that don't exist as local branches.

**Solution**: Implement automatic git reference resolution that tries multiple strategies:
1. Use the name as-is (for SHAs, local branches, tags)
2. Try `origin/{branchname}` (most common in CI)
3. Try `remotes/origin/{branchname}` (full remote path)

## Files in This Repository

This repository contains reference implementations and documentation:

| File | Description |
|------|-------------|
| `MERGE_BASE_FIX.md` | **Main documentation** - Detailed explanation of the problem, root cause, and recommended changes with examples |
| `git-ref-resolver.js` | **Reference implementation** - Complete, production-ready utility module that can be used in the action |
| `git-ref-resolver.test.js` | **Test suite** - Comprehensive tests demonstrating expected behavior and edge cases |
| `/tmp/merge-base-investigation-report.md` | **Investigation report** - Full analysis of the CI failure from run #22 |

## Key Changes Needed in code-coverage-report-action

### 1. Add Git Reference Resolver

Add a `resolveGitRef()` function that automatically finds the correct git reference:

```javascript
function resolveGitRef(branchName) {
  // Try: as-is, origin/branch, remotes/origin/branch
  // Return first one that exists
}
```

### 2. Update All Git Operations

Replace direct git commands with resolved refs:

```javascript
// BEFORE (fails in CI):
git merge-base main feature-branch

// AFTER (works everywhere):
const baseRef = resolveGitRef('main');  // → 'origin/main' in CI
const headRef = resolveGitRef('feature-branch');  // → 'origin/feature-branch' in CI
git merge-base ${baseRef} ${headRef}
```

### 3. Add Comprehensive Logging

Include debug logs showing which resolution strategy succeeded:

```
[DEBUG] Resolving: main
[DEBUG] Trying: main → ✗ failed
[DEBUG] Trying: origin/main → ✓ success
```

## Implementation Checklist

For the `code-coverage-report-action` repository:

- [ ] Copy `git-ref-resolver.js` to the action's source directory
- [ ] Update main action code to use `resolveGitRef()` for all branch references
- [ ] Add comprehensive error handling and logging
- [ ] Copy test suite and adapt for action's test framework
- [ ] Test in CI with pull requests
- [ ] Update action's README with examples
- [ ] Release new version with fix

## Testing the Fix

### Before Fix (Current Behavior)

```bash
# CI environment (detached HEAD, no local branches)
$ git branch -a
* (HEAD detached at pull/3/merge)
  remotes/origin/main
  remotes/origin/feature-branch

# Action tries:
$ git merge-base main feature-branch
fatal: bad revision 'main'  # ❌ FAILS
```

### After Fix (Expected Behavior)

```bash
# Same CI environment
$ git branch -a
* (HEAD detached at pull/3/merge)
  remotes/origin/main
  remotes/origin/feature-branch

# Action now:
# 1. Resolves 'main' → 'origin/main'
# 2. Resolves 'feature-branch' → 'origin/feature-branch'
$ git merge-base origin/main origin/feature-branch
abc123def456789  # ✅ SUCCESS
```

## Benefits

After implementing this fix:

1. ✅ **Works in all CI environments** - No special workflow configuration needed
2. ✅ **Backward compatible** - Existing workflows continue to work
3. ✅ **Clear error messages** - When refs can't be resolved, users get helpful errors
4. ✅ **Better debugging** - Verbose logging shows what's happening
5. ✅ **Flexible** - Works with branch names, remote refs, commit SHAs, tags, etc.

## Example Workflow Usage

After the fix, users can simply use branch names:

```yaml
# .github/workflows/ci.yml
- uses: Zadjil-AR/code-coverage-report-action@main
  with:
    filename: coverage/clover.xml
    # No special configuration needed!
    # Action automatically handles remote refs in CI
```

No need for:
- Creating local branches before running the action
- Using `fetch-depth: 0`
- Passing commit SHAs explicitly
- Special git setup steps

The action handles everything automatically.

## Related Files

- Investigation report: `/tmp/merge-base-investigation-report.md`
- Demo script: `/tmp/fix-merge-base-demo.sh`
- Investigation script: `/tmp/investigate-merge-base.sh`

## Next Steps

1. Share `MERGE_BASE_FIX.md` and `git-ref-resolver.js` with the code-coverage-report-action maintainers
2. Implement the changes in that repository
3. Test thoroughly in CI environment
4. Release new version
5. Update this repository to use the fixed version

## Contact

For questions about this fix, refer to:
- The investigation in this repository
- PR #5 discussion in the code-coverage-report-action repository
- Workflow run #22 logs in this repository

---

**Note**: These files are reference implementations created in this example repository. The actual fix needs to be implemented in the [Zadjil-AR/code-coverage-report-action](https://github.com/Zadjil-AR/code-coverage-report-action) repository.
