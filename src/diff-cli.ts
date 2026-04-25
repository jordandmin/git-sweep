import { getBranchDiffs, formatDiff } from "./diff";
import { getMergedBranches, getCurrentBranch } from "./git";
import { log } from "./logger";

export interface DiffCliOptions {
  repoPath: string;
  base?: string;
  onlyAhead?: boolean;
  onlyBehind?: boolean;
}

export async function runDiffReport(options: DiffCliOptions): Promise<void> {
  const { repoPath, base = "main", onlyAhead = false, onlyBehind = false } = options;

  let branches: string[];
  try {
    branches = getMergedBranches(repoPath);
    const current = getCurrentBranch(repoPath);
    branches = branches.filter((b) => b !== current && b !== base);
  } catch (err) {
    log("error", `Failed to list branches in ${repoPath}: ${err}`);
    return;
  }

  if (branches.length === 0) {
    log("info", "No branches to diff.");
    console.log("No branches to diff.");
    return;
  }

  const diffs = getBranchDiffs(repoPath, branches, base);

  const filtered = diffs.filter((d) => {
    if (onlyAhead && d.aheadCount === 0) return false;
    if (onlyBehind && d.behindCount === 0) return false;
    return true;
  });

  if (filtered.length === 0) {
    console.log("No branches match the filter criteria.");
    return;
  }

  console.log(`\nBranch diff report for: ${repoPath} (base: ${base})\n`);
  for (const diff of filtered) {
    console.log(" ", formatDiff(diff));
  }
  console.log();

  log("info", `Diff report generated for ${filtered.length} branch(es) in ${repoPath}`);
}
