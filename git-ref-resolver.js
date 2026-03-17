/**
 * Git Reference Resolver Utility
 *
 * This module provides utilities to resolve git branch names to valid
 * git references, automatically handling CI environments where only
 * remote tracking branches exist.
 *
 * Usage in code-coverage-report-action:
 *   const { resolveGitRef, findMergeBase } = require('./git-ref-resolver');
 *   const mergeBase = await findMergeBase(baseRef, headRef);
 */

const { execSync } = require('child_process');

/**
 * Resolves a branch name to a valid git reference.
 *
 * Tries multiple strategies to find a valid ref:
 * 1. Check if it's already a valid ref (commit SHA, local branch, tag, etc.)
 * 2. Try as a local branch
 * 3. Try with origin/ prefix (remote tracking branch)
 * 4. Try with remotes/origin/ prefix (full remote path)
 *
 * @param {string} branchName - The branch name to resolve
 * @param {Object} options - Options for resolution
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {string} - A valid git reference
 * @throws {Error} - If no valid reference can be found
 */
function resolveGitRef(branchName, options = {}) {
  const verbose = options.verbose || process.env.RUNNER_DEBUG === '1';

  if (verbose) {
    console.log(`[git-ref-resolver] Resolving: ${branchName}`);
  }

  // List available branches for debugging
  if (verbose) {
    try {
      const branches = execSync('git branch -a', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      console.log(`[git-ref-resolver] Available branches:`);
      branches.split('\n').slice(0, 10).forEach(b => {
        console.log(`  ${b}`);
      });
      if (branches.split('\n').length > 10) {
        console.log(`  ... (${branches.split('\n').length - 10} more)`);
      }
    } catch (e) {
      console.warn('[git-ref-resolver] Could not list branches');
    }
  }

  // Define strategies to try in order
  const strategies = [
    { name: 'as-is', ref: branchName },
    { name: 'origin/ prefix', ref: `origin/${branchName}` },
    { name: 'remotes/origin/ prefix', ref: `remotes/origin/${branchName}` }
  ];

  // Try each strategy
  for (const strategy of strategies) {
    try {
      if (verbose) {
        console.log(`[git-ref-resolver] Trying: ${strategy.ref}`);
      }

      // Check if this ref exists and get its commit SHA
      const sha = execSync(`git rev-parse --verify ${strategy.ref}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      if (verbose) {
        console.log(`[git-ref-resolver] ✓ Resolved ${branchName} → ${strategy.ref} (${sha.substring(0, 7)})`);
      }

      return strategy.ref;
    } catch (e) {
      if (verbose) {
        console.log(`[git-ref-resolver] ✗ Failed: ${strategy.ref}`);
      }
      // Continue to next strategy
    }
  }

  // If we get here, no strategy worked
  const error = new Error(
    `Could not resolve git reference for '${branchName}'. ` +
    `Tried: ${strategies.map(s => s.ref).join(', ')}. ` +
    `Make sure the branch exists and has been fetched.`
  );
  console.error(`[git-ref-resolver] ${error.message}`);
  throw error;
}

/**
 * Finds the merge base between two git references.
 * Automatically resolves branch names to valid refs.
 *
 * @param {string} baseRef - The base reference (branch name, SHA, etc.)
 * @param {string} headRef - The head reference (branch name, SHA, etc.)
 * @param {Object} options - Options for merge base calculation
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {string} - The merge base commit SHA
 * @throws {Error} - If merge base cannot be found
 */
function findMergeBase(baseRef, headRef, options = {}) {
  const verbose = options.verbose || process.env.RUNNER_DEBUG === '1';

  if (verbose) {
    console.log(`[git-ref-resolver] Finding merge base between ${baseRef} and ${headRef}`);
  }

  // Resolve both refs to valid git references
  const resolvedBase = resolveGitRef(baseRef, options);
  const resolvedHead = resolveGitRef(headRef, options);

  try {
    const mergeBase = execSync(
      `git merge-base ${resolvedBase} ${resolvedHead}`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    ).trim();

    if (verbose) {
      console.log(`[git-ref-resolver] Merge base found: ${mergeBase}`);
    }

    return mergeBase;
  } catch (error) {
    const errorMsg =
      `Failed to find merge base between ${resolvedBase} and ${resolvedHead}. ` +
      `This usually means the branches have no common history. ` +
      `Error: ${error.message}`;
    console.error(`[git-ref-resolver] ${errorMsg}`);
    throw new Error(errorMsg);
  }
}

/**
 * Gets the list of files changed between two refs.
 * Automatically resolves branch names to valid refs.
 *
 * @param {string} baseRef - The base reference
 * @param {string} headRef - The head reference
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Enable verbose logging
 * @param {string} options.diffFilter - Git diff filter (e.g., 'AMRCD' for Added, Modified, Renamed, Copied, Deleted)
 * @returns {string[]} - Array of changed file paths
 * @throws {Error} - If diff operation fails
 */
function getChangedFiles(baseRef, headRef, options = {}) {
  const verbose = options.verbose || process.env.RUNNER_DEBUG === '1';
  const diffFilter = options.diffFilter || 'AMRCD';

  if (verbose) {
    console.log(`[git-ref-resolver] Getting changed files between ${baseRef} and ${headRef}`);
  }

  // Resolve both refs
  const resolvedBase = resolveGitRef(baseRef, { verbose });
  const resolvedHead = resolveGitRef(headRef, { verbose });

  try {
    const output = execSync(
      `git diff --name-only --diff-filter=${diffFilter} ${resolvedBase}...${resolvedHead}`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    ).trim();

    const files = output ? output.split('\n').filter(Boolean) : [];

    if (verbose) {
      console.log(`[git-ref-resolver] Found ${files.length} changed files`);
    }

    return files;
  } catch (error) {
    const errorMsg =
      `Failed to get changed files between ${resolvedBase} and ${resolvedHead}. ` +
      `Error: ${error.message}`;
    console.error(`[git-ref-resolver] ${errorMsg}`);
    throw new Error(errorMsg);
  }
}

/**
 * Gets git diff with context between two refs.
 * Automatically resolves branch names to valid refs.
 *
 * @param {string} baseRef - The base reference
 * @param {string} headRef - The head reference
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Enable verbose logging
 * @param {number} options.unified - Number of lines of context (default: 0)
 * @param {string} options.diffFilter - Git diff filter
 * @returns {string} - The git diff output
 * @throws {Error} - If diff operation fails
 */
function getDiff(baseRef, headRef, options = {}) {
  const verbose = options.verbose || process.env.RUNNER_DEBUG === '1';
  const unified = options.unified !== undefined ? options.unified : 0;
  const diffFilter = options.diffFilter || 'AMRCD';

  if (verbose) {
    console.log(`[git-ref-resolver] Getting diff between ${baseRef} and ${headRef}`);
  }

  // Resolve both refs
  const resolvedBase = resolveGitRef(baseRef, { verbose });
  const resolvedHead = resolveGitRef(headRef, { verbose });

  try {
    const output = execSync(
      `git diff --diff-filter=${diffFilter} -M -U${unified} ${resolvedBase}...${resolvedHead}`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large diffs
      }
    ).trim();

    if (verbose) {
      const lines = output.split('\n').length;
      console.log(`[git-ref-resolver] Diff generated (${lines} lines)`);
    }

    return output;
  } catch (error) {
    const errorMsg =
      `Failed to get diff between ${resolvedBase} and ${resolvedHead}. ` +
      `Error: ${error.message}`;
    console.error(`[git-ref-resolver] ${errorMsg}`);
    throw new Error(errorMsg);
  }
}

/**
 * Checks if a git reference exists.
 *
 * @param {string} ref - The reference to check
 * @returns {boolean} - True if the reference exists
 */
function refExists(ref) {
  try {
    execSync(`git rev-parse --verify ${ref}`, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Gets the commit SHA for a reference.
 *
 * @param {string} ref - The reference
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {string} - The commit SHA
 * @throws {Error} - If ref cannot be resolved
 */
function getCommitSha(ref, options = {}) {
  const resolvedRef = resolveGitRef(ref, options);

  try {
    return execSync(`git rev-parse ${resolvedRef}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    throw new Error(`Failed to get commit SHA for ${resolvedRef}: ${error.message}`);
  }
}

module.exports = {
  resolveGitRef,
  findMergeBase,
  getChangedFiles,
  getDiff,
  refExists,
  getCommitSha
};
