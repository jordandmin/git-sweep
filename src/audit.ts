import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface AuditEntry {
  timestamp: string;
  repo: string;
  action: "deleted" | "pruned" | "skipped" | "dry-run";
  branch?: string;
  remote?: string;
  reason?: string;
}

export interface AuditLog {
  entries: AuditEntry[];
}

export function getAuditFilePath(dir?: string): string {
  const base = dir ?? path.join(os.homedir(), ".git-sweep");
  return path.join(base, "audit.json");
}

export function loadAuditLog(filePath?: string): AuditLog {
  const fp = filePath ?? getAuditFilePath();
  if (!fs.existsSync(fp)) {
    return { entries: [] };
  }
  try {
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw) as AuditLog;
  } catch {
    return { entries: [] };
  }
}

export function saveAuditLog(log: AuditLog, filePath?: string): void {
  const fp = filePath ?? getAuditFilePath();
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fp, JSON.stringify(log, null, 2), "utf-8");
}

export function appendAuditEntry(
  entry: Omit<AuditEntry, "timestamp">,
  filePath?: string
): AuditEntry {
  const log = loadAuditLog(filePath);
  const full: AuditEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  log.entries.push(full);
  saveAuditLog(log, filePath);
  return full;
}

export function queryAuditLog(
  log: AuditLog,
  filters: Partial<Pick<AuditEntry, "repo" | "action">>
): AuditEntry[] {
  return log.entries.filter((e) => {
    if (filters.repo && e.repo !== filters.repo) return false;
    if (filters.action && e.action !== filters.action) return false;
    return true;
  });
}

export function formatAuditEntry(entry: AuditEntry): string {
  const parts = [`[${entry.timestamp}]`, `repo=${entry.repo}`, `action=${entry.action}`];
  if (entry.branch) parts.push(`branch=${entry.branch}`);
  if (entry.remote) parts.push(`remote=${entry.remote}`);
  if (entry.reason) parts.push(`reason=${entry.reason}`);
  return parts.join(" ");
}
