import { confirmBranchDeletion } from "./prompt";

describe("confirmBranchDeletion", () => {
  it("returns all branches immediately when dryRun is true", async () => {
    const branches = ["feature/old", "fix/stale"];
    const result = await confirmBranchDeletion(branches, true);
    expect(result).toEqual(branches);
  });

  it("returns empty array when branches list is empty", async () => {
    const result = await confirmBranchDeletion([], false);
    expect(result).toEqual([]);
  });

  it("returns empty array when dryRun is true and branches is empty", async () => {
    const result = await confirmBranchDeletion([], true);
    expect(result).toEqual([]);
  });
});

describe("confirm (via confirmBranchDeletion dryRun shortcut)", () => {
  it("does not prompt when dryRun is true", async () => {
    const promptSpy = jest.fn();
    // Ensure readline is never called in dryRun mode
    jest.mock("readline", () => ({
      createInterface: promptSpy,
    }));

    const result = await confirmBranchDeletion(["branch-a"], true);
    expect(result).toEqual(["branch-a"]);
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it("returns full branch list in dryRun regardless of count", async () => {
    const many = Array.from({ length: 10 }, (_, i) => `branch-${i}`);
    const result = await confirmBranchDeletion(many, true);
    expect(result).toHaveLength(10);
    expect(result).toEqual(many);
  });
});
