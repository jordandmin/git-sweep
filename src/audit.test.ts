import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  getAuditFilePath,
  loadAuditLog,
  saveAuditLog,
  appendAuditEntry,
  queryAuditLog,
  formatAuditEntry,
  AuditLog,
} from "./audit";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "audit-test-"));
const TEST_FILE = path.join(TMP, "audit.json");

afterEach(() => {
  if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
});

afterAll(() => {
  fs.rmdirSync(TMP, { recursive: true } as any);
});

describe("getAuditFilePath", () => {
  it("returns path under provided dir", () => {
    const fp = getAuditFilePath("/tmp/custom");
    expect(fp).toBe("/tmp/custom/audit.json");
  });

  it("defaults to ~/.git-sweep/audit.json", () => {
    const fp = getAuditFilePath();
    expect(fp).toContain("audit.json");
    expect(fp).toContain(".git-sweep");
  });
});

describe("loadAuditLog", () => {
  it("returns empty log when file does not exist", () => {
    const log = loadAuditLog("/nonexistent/path/audit.json");
    expect(log.entries).toEqual([]);
  });

  it("loads existing log from file", () => {
    const data: AuditLog = {
      entries: [{ timestamp: "2024-01-01T00:00:00.000Z", repo: "my-repo", action: "deleted", branch: "feature/x" }],
    };
    fs.writeFileSync(TEST_FILE, JSON.stringify(data), "utf-8");
    const log = loadAuditLog(TEST_FILE);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].repo).toBe("my-repo");
  });
});

describe("saveAuditLog", () => {
  it("writes log to disk", () => {
    const log: AuditLog = { entries: [] };
    saveAuditLog(log, TEST_FILE);
    expect(fs.existsSync(TEST_FILE)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(TEST_FILE, "utf-8"));
    expect(raw.entries).toEqual([]);
  });
});

describe("appendAuditEntry", () => {
  it("appends entry with timestamp", () => {
    const entry = appendAuditEntry({ repo: "repo-a", action: "pruned", remote: "origin" }, TEST_FILE);
    expect(entry.timestamp).toBeDefined();
    expect(entry.repo).toBe("repo-a");
    const log = loadAuditLog(TEST_FILE);
    expect(log.entries).toHaveLength(1);
  });
});

describe("queryAuditLog", () => {
  it("filters by repo and action", () => {
    const log: AuditLog = {
      entries: [
        { timestamp: "t1", repo: "a", action: "deleted", branch: "main" },
        { timestamp: "t2", repo: "b", action: "deleted", branch: "dev" },
        { timestamp: "t3", repo: "a", action: "skipped" },
      ],
    };
    expect(queryAuditLog(log, { repo: "a" })).toHaveLength(2);
    expect(queryAuditLog(log, { action: "deleted" })).toHaveLength(2);
    expect(queryAuditLog(log, { repo: "a", action: "deleted" })).toHaveLength(1);
  });
});

describe("formatAuditEntry", () => {
  it("formats entry as readable string", () => {
    const entry = { timestamp: "2024-06-01T10:00:00.000Z", repo: "my-repo", action: "deleted" as const, branch: "feature/y", reason: "merged" };
    const str = formatAuditEntry(entry);
    expect(str).toContain("repo=my-repo");
    expect(str).toContain("action=deleted");
    expect(str).toContain("branch=feature/y");
    expect(str).toContain("reason=merged");
  });
});
