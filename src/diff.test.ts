import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBranchDiff, getBranchDiffs, formatDiff, BranchDiff } from "./diff";
import { execSync } from "child_process";

vi.mock("child_process");

const mockExecSync = execSync as unknown as ReturnType<typeof vi.fn>;

const REPO = "/fake/repo";

function setupExecMocks(ahead: number, behind: number) {
  let call = 0;
  mockExecSync.mockImplementation(() => {
    call++;
    if (call === 1) return `${behind}\t${ahead}`;
    if (call === 2) return "abc1234567890";
    if (call === 3) return "fix: some bug";
    if (call === 4) return "2024-05-01 10:00:00 +0000";
    return "";
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getBranchDiff", () => {
  it("parses ahead/behind counts correctly", () => {
    setupExecMocks(3, 1);
    const result = getBranchDiff(REPO, "feature/foo", "main");
    expect(result.aheadCount).toBe(3);
    expect(result.behindCount).toBe(1);
    expect(result.branch).toBe("feature/foo");
  });

  it("captures last commit metadata", () => {
    setupExecMocks(0, 0);
    const result = getBranchDiff(REPO, "feature/bar", "main");
    expect(result.lastCommitHash).toBe("abc1234567890");
    expect(result.lastCommitMessage).toBe("fix: some bug");
    expect(result.lastCommitDate).toBe("2024-05-01 10:00:00 +0000");
  });
});

describe("getBranchDiffs", () => {
  it("returns empty diff on error", () => {
    mockExecSync.mockImplementation(() => { throw new Error("git error"); });
    const results = getBranchDiffs(REPO, ["broken-branch"], "main");
    expect(results).toHaveLength(1);
    expect(results[0].aheadCount).toBe(0);
    expect(results[0].lastCommitHash).toBe("");
  });

  it("processes multiple branches", () => {
    let call = 0;
    mockExecSync.mockImplementation(() => {
      call++;
      if (call % 4 === 1) return "0\t2";
      if (call % 4 === 2) return "deadbeef";
      if (call % 4 === 3) return "chore: cleanup";
      return "2024-01-01 00:00:00 +0000";
    });
    const results = getBranchDiffs(REPO, ["branch-a", "branch-b"], "main");
    expect(results).toHaveLength(2);
    expect(results[0].branch).toBe("branch-a");
    expect(results[1].branch).toBe("branch-b");
  });
});

describe("formatDiff", () => {
  it("formats a diff entry as a readable string", () => {
    const diff: BranchDiff = {
      branch: "feature/test",
      aheadCount: 2,
      behindCount: 5,
      lastCommitHash: "abcdef1234567",
      lastCommitMessage: "feat: add thing",
      lastCommitDate: "2024-06-01 12:00:00 +0000",
    };
    const output = formatDiff(diff);
    expect(output).toContain("feature/test");
    expect(output).toContain("ahead: 2");
    expect(output).toContain("behind: 5");
    expect(output).toContain("abcdef1");
    expect(output).toContain("feat: add thing");
  });
});
