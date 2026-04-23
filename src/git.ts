import { execSync } from "child_process";

export interface BranchInfo {
  name: string;
  isMerged: boolean;
  lastCommitDate: Date;
  isRemote: boolean;
}

export function getCurrentBranch(repoPath: string): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: repoPath,
    encoding: "utf-8",
  }).trim();
}

export function getMergedBranches(
  repoPath: string,
  baseBranch: string = "main"
): string[] {
  const output = execSync(`git branch --merged ${baseBranch}`, {
    cwd: repoPath,
    encoding: "utf-8",
  });
  return output
    .split("\n")
    .map((b) => b.trim().replace(/^\*\s*/, ""))
    .filter((b) => b && b !== baseBranch && b !== "main" && b !== "master");
}

export function getRemoteBranches(repoPath: string): string[] {
  const output = execSync("git branch -r", {
    cwd: repoPath,
    encoding: "utf-8",
  });
  return output
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b && !b.includes("HEAD"));
}

export function deleteBranch(
  repoPath: string,
  branch: string,
  force: boolean = false
): void {
  const flag = force ? "-D" : "-d";
  execSync(`git branch ${flag} ${branch}`, {
    cwd: repoPath,
    encoding: "utf-8",
  });
}

export function pruneRemote(
  repoPath: string,
  remote: string = "origin"
): string[] {
  const output = execSync(`git remote prune ${remote} --dry-run`, {
    cwd: repoPath,
    encoding: "utf-8",
  });
  const pruned = output
    .split("\n")
    .filter((line) => line.includes("[would prune]"))
    .map((line) => line.replace(/.*\[would prune\]\s*/, "").trim());
  if (pruned.length > 0) {
    execSync(`git remote prune ${remote}`, { cwd: repoPath });
  }
  return pruned;
}

export function isGitRepository(repoPath: string): boolean {
  try {
    execSync("git rev-parse --git-dir", {
      cwd: repoPath,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}
