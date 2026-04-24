/**
 * filter.ts
 * Provides branch filtering logic based on age, name patterns, and protection rules.
 */

export interface FilterOptions {
  /** Minimum age in days before a branch is considered stale */
  minAgeDays?: number;
  /** Glob-style patterns for branches to always protect (e.g. ["main", "develop", "release/*"]) */
  protectedPatterns?: string[];
  /** If true, include branches whose last commit author matches the current user */
  excludeOwn?: boolean;
  /** Optional current git user email for excludeOwn check */
  currentUserEmail?: string;
}

export interface BranchInfo {
  name: string;
  lastCommitDate: Date;
  authorEmail: string;
  isMerged: boolean;
}

/**
 * Returns true if the branch name matches any of the provided glob-style patterns.
 * Supports '*' as a wildcard segment.
 */
export function matchesPattern(branchName: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`).test(branchName);
  });
}

/**
 * Calculates the age of a branch in days relative to now (or a provided reference date).
 */
export function branchAgeDays(lastCommitDate: Date, now: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((now.getTime() - lastCommitDate.getTime()) / msPerDay);
}

/**
 * Filters a list of branches down to those eligible for deletion.
 * A branch is eligible when:
 *   1. It is marked as merged.
 *   2. Its name does not match any protected pattern.
 *   3. Its age meets or exceeds minAgeDays (default: 0).
 *   4. If excludeOwn is true, it was not authored by the current user.
 */
export function filterBranches(
  branches: BranchInfo[],
  options: FilterOptions = {}
): BranchInfo[] {
  const {
    minAgeDays = 0,
    protectedPatterns = ["main", "master", "develop"],
    excludeOwn = false,
    currentUserEmail = "",
  } = options;

  return branches.filter((branch) => {
    if (!branch.isMerged) return false;
    if (matchesPattern(branch.name, protectedPatterns)) return false;
    if (branchAgeDays(branch.lastCommitDate) < minAgeDays) return false;
    if (excludeOwn && currentUserEmail && branch.authorEmail === currentUserEmail) return false;
    return true;
  });
}
