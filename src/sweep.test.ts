import { sweepRepository, sweepAll } from "./sweep";
import * as git from "./git";
import type { Config } from "./config";

jest.mock("./git");

const mockedGit = git as jest.Mocked<typeof git>;

const baseConfig: Config = {
  repositories: ["/repo/a"],
  baseBranch: "main",
  protectedBranches: [],
  pruneRemotes: true,
  remote: "origin",
};

beforeEach(() => {
  jest.resetAllMocks();
  mockedGit.isGitRepository.mockReturnValue(true);
  mockedGit.getCurrentBranch.mockReturnValue("main");
  mockedGit.getMergedBranches.mockReturnValue([]);
  mockedGit.pruneRemote.mockReturnValue([]);
});

describe("sweepRepository", () => {
  it("returns error if path is not a git repo", async () => {
    mockedGit.isGitRepository.mockReturnValue(false);
    const result = await sweepRepository("/not/a/repo", baseConfig);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch("not a git repository");
  });

  it("deletes merged branches that are not protected", async () => {
    mockedGit.getMergedBranches.mockReturnValue(["feature/old", "fix/bug"]);
    const result = await sweepRepository("/repo/a", baseConfig);
    expect(result.deletedBranches).toEqual(["feature/old", "fix/bug"]);
    expect(mockedGit.deleteBranch).toHaveBeenCalledTimes(2);
  });

  it("skips protected branches", async () => {
    mockedGit.getMergedBranches.mockReturnValue(["develop", "feature/old"]);
    const config = { ...baseConfig, protectedBranches: ["develop"] };
    const result = await sweepRepository("/repo/a", config);
    expect(result.skippedBranches).toContain("develop");
    expect(result.deletedBranches).toContain("feature/old");
  });

  it("does not delete branches in dry-run mode", async () => {
    mockedGit.getMergedBranches.mockReturnValue(["feature/old"]);
    const result = await sweepRepository("/repo/a", baseConfig, true);
    expect(result.deletedBranches).toContain("feature/old");
    expect(mockedGit.deleteBranch).not.toHaveBeenCalled();
  });

  it("prunes remotes when pruneRemotes is true", async () => {
    mockedGit.pruneRemote.mockReturnValue(["origin/stale"]);
    const result = await sweepRepository("/repo/a", baseConfig);
    expect(result.prunedRemotes).toContain("origin/stale");
  });

  it("skips pruning when pruneRemotes is false", async () => {
    const config = { ...baseConfig, pruneRemotes: false };
    await sweepRepository("/repo/a", config);
    expect(mockedGit.pruneRemote).not.toHaveBeenCalled();
  });
});

describe("sweepAll", () => {
  it("runs sweep for each repository in config", async () => {
    const config: Config = { ...baseConfig, repositories: ["/repo/a", "/repo/b"] };
    const results = await sweepAll(config);
    expect(results).toHaveLength(2);
  });

  it("returns empty array when no repositories configured", async () => {
    const config: Config = { ...baseConfig, repositories: [] };
    const results = await sweepAll(config);
    expect(results).toEqual([]);
  });
});
