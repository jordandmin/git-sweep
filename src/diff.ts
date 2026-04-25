import { execSync } from "child_process";

export interface BranchDiff {
  branch: string;
  aheadCount: number;
  behindCount: number;
  lastCommitHash: string;
  lastCommitMessage: string;
  lastCommitDate: string;
}

export function getBranchDiff(repoPath: string, branch: string, base: string = "main"): BranchDiff {
  const run = (cmd: string) =>
    execSync(cmd, { cwd: repoPath, encoding: "utf8" }).trim();

  const aheadBehind = run(
    `git rev-list --left-right --count ${base}...${branch}`
  );
  const [behind, ahead] = aheadBehind.split("\t").map(Number);

  const lastCommitHash = run(`git log -1 --format=%H ${branch}`);
  const lastCommitMessage = run(`git log -1 --format=%s ${branch}`);
  const lastCommitDate = run(`git log -1 --format=%ci ${branch}`);

  return {
    branch,
    aheadCount: ahead,
    behindCount: behind,
    lastCommitHash,
    lastCommitMessage,
    lastCommitDate,
  };
}

export function getBranchDiffs(
  repoPath: string,
  branches: string[],
  base: string = "main"
): BranchDiff[] {
  return branches.map((branch) => {
    try {
      return getBranchDiff(repoPath, branch, base);
    } catch {
      return {
        branch,
        aheadCount: 0,
        behindCount: 0,
        lastCommitHash: "",
        lastCommitMessage: "",
        lastCommitDate: "",
      };
    }
  });
}

export function formatDiff(diff: BranchDiff): string {
  const parts = [
    `branch: ${diff.branch}`,
    `ahead: ${diff.aheadCount}`,
    `behind: ${diff.behindCount}`,
    `last commit: ${diff.lastCommitHash.slice(0, 7)} — ${diff.lastCommitMessage}`,
    `date: ${diff.lastCommitDate}`,
  ];
  return parts.join("  |  ");
}
