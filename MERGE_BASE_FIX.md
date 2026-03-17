# Recommended Changes to code-coverage-report-action

## Problem Summary

The code-coverage-report-action fails to find the merge base in CI environments because it uses bare branch names (e.g., `main`, `feature-branch`) that don't exist as local branches. In GitHub Actions, the repository is checked out in a detached HEAD state with only remote tracking branches.

## Root Cause

When the action tries to run:
```javascript
git merge-base main feature-branch
```

Git fails with `fatal: bad revision 'main'` because:
1. The GitHub Actions checkout creates a detached HEAD state
2. No local branches are created - only remote refs like `remotes/origin/main`
3. The action uses bare branch names that Git cannot resolve

## Recommended Changes

### 1. **Add a Branch Reference Resolver Function**

Create a function that automatically detects and uses the correct git reference:

```javascript
/**
 * Resolves a branch name to a valid git reference.
 * Tries multiple strategies to find a valid ref:
 * 1. Check if it's already a valid ref (commit SHA, local branch, etc.)
 * 2. Try as a local branch
 * 3. Try with origin/ prefix (remote tracking branch)
 * 4. Try with remotes/origin/ prefix (full remote path)
 *
 * @param {string} branchName - The branch name to resolve
 * @returns {string} - A valid git reference
 * @throws {Error} - If no valid reference can be found
 */
function resolveGitRef(branchName) {
  const { execSync } = require('child_process');

  // Check if it's already a valid ref (SHA, tag, existing branch)
  try {
    execSync(`git rev-parse --verify ${branchName}`, { stdio: 'pipe' });
    return branchName;
  } catch (e) {
    // Not a valid ref, continue trying other options
  }

  // Try with origin/ prefix (most common in CI)
  try {
    execSync(`git rev-parse --verify origin/${branchName}`, { stdio: 'pipe' });
    return `origin/${branchName}`;
  } catch (e) {
    // Not found as origin/branch
  }

  // Try with remotes/origin/ prefix
  try {
    execSync(`git rev-parse --verify remotes/origin/${branchName}`, { stdio: 'pipe' });
    return `remotes/origin/${branchName}`;
  } catch (e) {
    // Not found as remotes/origin/branch
  }

  // If nothing works, throw an error
  throw new Error(
    `Could not resolve git reference for '${branchName}'. ` +
    `Tried: ${branchName}, origin/${branchName}, remotes/origin/${branchName}`
  );
}
```

### 2. **Update Merge Base Calculation**

Modify the code that computes the merge base to use the resolver:

```javascript
async function findMergeBase(baseRef, headRef) {
  const { execSync } = require('child_process');

  // Resolve both refs to valid git references
  const resolvedBase = resolveGitRef(baseRef);
  const resolvedHead = resolveGitRef(headRef);

  console.log(`Finding merge base between ${resolvedBase} and ${resolvedHead}...`);

  try {
    const mergeBase = execSync(
      `git merge-base ${resolvedBase} ${resolvedHead}`,
      { encoding: 'utf8' }
    ).trim();

    console.log(`Merge base found: ${mergeBase}`);
    return mergeBase;
  } catch (error) {
    throw new Error(
      `Failed to find merge base between ${resolvedBase} and ${resolvedHead}: ${error.message}`
    );
  }
}
```

### 3. **Update Git Diff Operations**

Similarly, update any git diff operations:

```javascript
async function getChangedFiles(baseRef, headRef) {
  const { execSync } = require('child_process');

  // Resolve both refs
  const resolvedBase = resolveGitRef(baseRef);
  const resolvedHead = resolveGitRef(headRef);

  try {
    const output = execSync(
      `git diff --name-only ${resolvedBase}...${resolvedHead}`,
      { encoding: 'utf8' }
    );

    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    throw new Error(
      `Failed to get changed files between ${resolvedBase} and ${resolvedHead}: ${error.message}`
    );
  }
}
```

### 4. **Fallback to GitHub Context (Alternative Approach)**

As an alternative or complement, use GitHub's context information when available:

```javascript
const core = require('@actions/core');
const github = require('@actions/github');

function getRefsFromContext() {
  const context = github.context;

  // For pull requests, use the base and head SHAs directly
  if (context.eventName === 'pull_request' && context.payload.pull_request) {
    return {
      baseRef: context.payload.pull_request.base.sha,
      headRef: context.payload.pull_request.head.sha,
      baseBranch: context.payload.pull_request.base.ref,
      headBranch: context.payload.pull_request.head.ref
    };
  }

  // For push events, use before and after SHAs
  if (context.eventName === 'push') {
    return {
      baseRef: context.payload.before,
      headRef: context.payload.after,
      baseBranch: context.ref.replace('refs/heads/', ''),
      headBranch: context.ref.replace('refs/heads/', '')
    };
  }

  return null;
}

// Use in the action:
function getBaseAndHeadRefs(userProvidedBase, userProvidedHead) {
  // Try to use GitHub context first (most reliable)
  const contextRefs = getRefsFromContext();

  if (contextRefs) {
    // Use SHAs from context if available
    const baseRef = userProvidedBase || contextRefs.baseRef;
    const headRef = userProvidedHead || contextRefs.headRef;

    return {
      baseRef: resolveGitRef(baseRef),
      headRef: resolveGitRef(headRef)
    };
  }

  // Fall back to user-provided refs with resolution
  return {
    baseRef: resolveGitRef(userProvidedBase),
    headRef: resolveGitRef(userProvidedHead)
  };
}
```

### 5. **Add Logging for Debugging**

Add comprehensive logging to help debug issues:

```javascript
function resolveGitRef(branchName) {
  const { execSync } = require('child_process');

  console.log(`[DEBUG] Resolving git reference: ${branchName}`);

  // Show available branches for debugging
  try {
    const branches = execSync('git branch -a', { encoding: 'utf8' });
    console.log(`[DEBUG] Available branches:\n${branches}`);
  } catch (e) {
    console.warn('[DEBUG] Could not list branches');
  }

  // Try each strategy with logging
  const strategies = [
    { name: 'as-is', ref: branchName },
    { name: 'origin/', ref: `origin/${branchName}` },
    { name: 'remotes/origin/', ref: `remotes/origin/${branchName}` }
  ];

  for (const strategy of strategies) {
    try {
      console.log(`[DEBUG] Trying strategy '${strategy.name}': ${strategy.ref}`);
      execSync(`git rev-parse --verify ${strategy.ref}`, { stdio: 'pipe' });
      console.log(`[DEBUG] ✓ Success with strategy '${strategy.name}'`);
      return strategy.ref;
    } catch (e) {
      console.log(`[DEBUG] ✗ Strategy '${strategy.name}' failed`);
    }
  }

  throw new Error(
    `Could not resolve git reference for '${branchName}'. ` +
    `Check the debug logs above for details.`
  );
}
```

## Implementation Checklist

In the `code-coverage-report-action` repository:

- [ ] Add `resolveGitRef()` function to a new or existing utility module
- [ ] Update all calls to `git merge-base` to use resolved refs
- [ ] Update all calls to `git diff` to use resolved refs
- [ ] Add `getRefsFromContext()` to prefer GitHub context SHAs
- [ ] Add comprehensive debug logging
- [ ] Update action.yml to document that branch names are automatically resolved
- [ ] Add tests for the ref resolution logic
- [ ] Test in CI environment with pull requests
- [ ] Update documentation with examples

## Testing Strategy

### Unit Tests

```javascript
describe('resolveGitRef', () => {
  it('should return branch name if it exists locally', () => {
    // Mock git rev-parse to succeed
    // Assert returns original branch name
  });

  it('should return origin/branch if local branch does not exist', () => {
    // Mock git rev-parse to fail for local, succeed for origin/
    // Assert returns origin/branch
  });

  it('should throw error if no valid ref found', () => {
    // Mock all git rev-parse calls to fail
    // Assert throws descriptive error
  });

  it('should handle commit SHAs', () => {
    // Mock git rev-parse to succeed for SHA
    // Assert returns SHA unchanged
  });
});
```

### Integration Tests

Create a test workflow that:
1. Checks out code in detached HEAD state (default)
2. Runs the action with branch names
3. Verifies merge base is found correctly
4. Verifies diff works correctly

## Expected Behavior After Fix

After implementing these changes:

1. ✅ Action works in default GitHub Actions checkout (detached HEAD)
2. ✅ Action works with bare branch names like `main`, `feature-branch`
3. ✅ Action works with remote refs like `origin/main`
4. ✅ Action works with commit SHAs
5. ✅ Clear error messages when refs cannot be resolved
6. ✅ Debug logs show which resolution strategy succeeded

## Backward Compatibility

These changes are **backward compatible**:
- Existing workflows using commit SHAs continue to work
- Workflows that create local branches continue to work
- New functionality automatically handles remote refs
- No breaking changes to action inputs

## Example Usage

After the fix, all of these will work automatically:

```yaml
# Works with branch names (most common)
- uses: Zadjil-AR/code-coverage-report-action@main
  with:
    filename: coverage/clover.xml
    # baseRef: main (inferred from context)
    # headRef: feature-branch (inferred from context)

# Works with explicit branch names
- uses: Zadjil-AR/code-coverage-report-action@main
  with:
    filename: coverage/clover.xml
    base_ref: main
    head_ref: feature-branch

# Works with remote refs
- uses: Zadjil-AR/code-coverage-report-action@main
  with:
    filename: coverage/clover.xml
    base_ref: origin/main
    head_ref: origin/feature-branch

# Works with commit SHAs
- uses: Zadjil-AR/code-coverage-report-action@main
  with:
    filename: coverage/clover.xml
    base_ref: ${{ github.event.pull_request.base.sha }}
    head_ref: ${{ github.event.pull_request.head.sha }}
```

All scenarios above will work correctly without any special setup in the workflow.
