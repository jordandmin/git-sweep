import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface BranchSnapshot {
  repo: string;
  branch: string;
  lastCommitHash: string;
  lastCommitDate: string;
  capturedAt: string;
}

export interface SnapshotFile {
  version: number;
  snapshots: BranchSnapshot[];
}

const SNAPSHOT_VERSION = 1;

export function getSnapshotFilePath(repoPath: string): string {
  const repoKey = repoPath.replace(/[\/\\:]/g, '_');
  return path.join(os.homedir(), '.git-sweep', `snapshot_${repoKey}.json`);
}

export function loadSnapshot(repoPath: string): SnapshotFile {
  const filePath = getSnapshotFilePath(repoPath);
  if (!fs.existsSync(filePath)) {
    return { version: SNAPSHOT_VERSION, snapshots: [] };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as SnapshotFile;
  } catch {
    return { version: SNAPSHOT_VERSION, snapshots: [] };
  }
}

export function saveSnapshot(repoPath: string, data: SnapshotFile): void {
  const filePath = getSnapshotFilePath(repoPath);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function upsertSnapshot(
  repoPath: string,
  entry: Omit<BranchSnapshot, 'capturedAt'>
): void {
  const data = loadSnapshot(repoPath);
  const idx = data.snapshots.findIndex(
    (s) => s.repo === entry.repo && s.branch === entry.branch
  );
  const record: BranchSnapshot = { ...entry, capturedAt: new Date().toISOString() };
  if (idx >= 0) {
    data.snapshots[idx] = record;
  } else {
    data.snapshots.push(record);
  }
  saveSnapshot(repoPath, data);
}

export function removeSnapshot(repoPath: string, branch: string): void {
  const data = loadSnapshot(repoPath);
  data.snapshots = data.snapshots.filter(
    (s) => !(s.repo === repoPath && s.branch === branch)
  );
  saveSnapshot(repoPath, data);
}

export function getSnapshot(
  repoPath: string,
  branch: string
): BranchSnapshot | undefined {
  const data = loadSnapshot(repoPath);
  return data.snapshots.find((s) => s.repo === repoPath && s.branch === branch);
}
