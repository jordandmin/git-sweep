import { describe, it, expect } from "vitest";
import {
  matchesPattern,
  branchAgeDays,
  filterBranches,
  BranchInfo,
} from "./filter";

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

describe("matchesPattern", () => {
  it("matches exact branch names", () => {
    expect(matchesPattern("main", ["main"])).toBe(true);
    expect(matchesPattern("develop", ["main"])).toBe(false);
  });

  it("matches wildcard patterns", () => {
    expect(matchesPattern("release/1.0", ["release/*"])).toBe(true);
    expect(matchesPattern("feature/foo", ["release/*"])).toBe(false);
  });

  it("returns false for empty patterns array", () => {
    expect(matchesPattern("main", [])).toBe(false);
  });
});

describe("branchAgeDays", () => {
  it("returns 0 for today", () => {
    expect(branchAgeDays(new Date())).toBe(0);
  });

  it("returns correct number of days", () => {
    expect(branchAgeDays(daysAgo(10))).toBe(10);
  });

  it("accepts a custom reference date", () => {
    const ref = new Date("2024-01-10");
    const commit = new Date("2024-01-05");
    expect(branchAgeDays(commit, ref)).toBe(5);
  });
});

describe("filterBranches", () => {
  const base: BranchInfo[] = [
    { name: "feature/old", lastCommitDate: daysAgo(30), authorEmail: "a@x.com", isMerged: true },
    { name: "feature/new", lastCommitDate: daysAgo(2), authorEmail: "a@x.com", isMerged: true },
    { name: "main", lastCommitDate: daysAgo(30), authorEmail: "a@x.com", isMerged: true },
    { name: "feature/unmerged", lastCommitDate: daysAgo(30), authorEmail: "a@x.com", isMerged: false },
  ];

  it("excludes unmerged branches", () => {
    const result = filterBranches(base);
    expect(result.find((b) => b.name === "feature/unmerged")).toBeUndefined();
  });

  it("excludes protected branches", () => {
    const result = filterBranches(base);
    expect(result.find((b) => b.name === "main")).toBeUndefined();
  });

  it("respects minAgeDays", () => {
    const result = filterBranches(base, { minAgeDays: 7 });
    expect(result.find((b) => b.name === "feature/new")).toBeUndefined();
    expect(result.find((b) => b.name === "feature/old")).toBeDefined();
  });

  it("excludes branches owned by current user when excludeOwn is true", () => {
    const result = filterBranches(base, { excludeOwn: true, currentUserEmail: "a@x.com" });
    expect(result).toHaveLength(0);
  });

  it("returns all eligible branches with default options", () => {
    const result = filterBranches(base);
    expect(result.map((b) => b.name)).toEqual(["feature/old", "feature/new"]);
  });
});
