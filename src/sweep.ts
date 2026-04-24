import path from "path";
import {
  getMergedBranches,
  getRemoteBranches,
  deleteBranch,
  pruneRemote,
  isGitRepository,
  getCurrentBranch,
} from "./git";
import type { Config } from "./config";

export interface SweepResult {
  repoPath: string;
  deletedBranches: string[];
  prunedRemotes: string[];
  skippedBranches: string[];
  errors: string[];
}

/**
 * Sweeps a single git repository by deleting merged branches and optionally
 * pruning stale remote-tracking references.
 *
 * @param repoPath - Absolute or relative path to the git repository.
 * @param config   - Configuration options controlling which branches to protect,
 *                   which remote to prune, and other behaviour.
 * @param dryRun   - When true, no destructive operations are performed; the
 *                   result still reports what *would* have been changed.
 * @returns A {@link SweepResult} describing every action taken (or skipped).
 */
export async function sweepRepository(
  repoPath: string,
  config: Config,
  dryRun: boolean = false
): Promise<SweepResult> {
  const result: SweepResult = {
    repoPath,
    deletedBranches: [],
    prunedRemotes: [],
    skippedBranches: [],
    errors: [],
  };

  if (!isGitRepository(repoPath)) {
    result.errors.push(`${repoPath} is not a git repository`);
    return result;
  }

  const protectedBranches = new Set([
    "main",
    "master",
    "develop",
    ...(config.protectedBranches ?? []),
  ]);

  try {
    const currentBranch = getCurrentBranch(repoPath);
    const baseBranch = config.baseBranch ?? "main";
    const merged = getMergedBranches(repoPath, baseBranch);

    for (const branch of merged) {
      if (protectedBranches.has(branch) || branch === currentBranch) {
        result.skippedBranches.push(branch);
        continue;
      }
      if (!dryRun) {
        try {
          deleteBranch(repoPath, branch);
        } catch (err) {
          result.errors.push(
            `Failed to delete branch "${branch}": ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          continue;
        }
      }
      result.deletedBranches.push(branch);
    }

    if (config.pruneRemotes !== false) {
      const pruned = dryRun ? [] : pruneRemote(repoPath, config.remote ?? "origin");
      result.prunedRemotes.push(...pruned);
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

  return result;
}

/**
 * Sweeps all repositories listed in the provided configuration.
 *
 * @param config  - Configuration containing the list of repository paths and
 *                  shared sweep options.
 * @param dryRun  - When true, no destructive operations are performed.
 * @returns An array of {@link SweepResult}, one entry per repository.
 */
export async function sweepAll(
  config: Config,
  dryRun: boolean = false
): Promise<SweepResult[]> {
  const repos = config.repositories ?? [];
  return Promise.all(
    repos.map((repoPath) =>
      sweepRepository(path.resolve(repoPath), config, dryRun)
    )
  );
}
