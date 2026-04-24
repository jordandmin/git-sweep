import { confirmBranchDeletion } from "./prompt";
import { deleteBranch } from "./git";
import { writeLog } from "./logger";

export interface InteractiveDeleteOptions {
  branches: string[];
  repoPath: string;
  dryRun: boolean;
  force: boolean;
}

export interface InteractiveDeleteResult {
  deleted: string[];
  skipped: string[];
  failed: { branch: string; error: string }[];
}

export async function interactiveDelete(
  options: InteractiveDeleteOptions
): Promise<InteractiveDeleteResult> {
  const { branches, repoPath, dryRun, force } = options;
  const result: InteractiveDeleteResult = { deleted: [], skipped: [], failed: [] };

  const confirmed = await confirmBranchDeletion(branches, dryRun);
  const skipped = branches.filter((b) => !confirmed.includes(b));
  result.skipped.push(...skipped);

  if (dryRun) {
    writeLog("info", `[dry-run] Would delete ${confirmed.length} branch(es) in ${repoPath}`);
    result.deleted.push(...confirmed);
    return result;
  }

  for (const branch of confirmed) {
    try {
      await deleteBranch(repoPath, branch, force);
      writeLog("info", `Deleted branch "${branch}" in ${repoPath}`);
      result.deleted.push(branch);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      writeLog("error", `Failed to delete "${branch}": ${message}`);
      result.failed.push({ branch, error: message });
    }
  }

  return result;
}
