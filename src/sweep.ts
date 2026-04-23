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
        deleteBranch(repoPath, branch);
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
