import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getSnapshotFilePath,
  loadSnapshot,
  saveSnapshot,
  upsertSnapshot,
  removeSnapshot,
  getSnapshot,
  SnapshotFile,
} from './snapshot';

const TEST_REPO = '/tmp/test-repo';

function cleanupSnapshot() {
  const filePath = getSnapshotFilePath(TEST_REPO);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

beforeEach(() => cleanupSnapshot());
afterEach(() => cleanupSnapshot());

describe('getSnapshotFilePath', () => {
  it('returns a path inside ~/.git-sweep', () => {
    const p = getSnapshotFilePath(TEST_REPO);
    expect(p.startsWith(os.homedir())).toBe(true);
    expect(p).toContain('.git-sweep');
  });
});

describe('loadSnapshot', () => {
  it('returns empty snapshot when file does not exist', () => {
    const data = loadSnapshot(TEST_REPO);
    expect(data.snapshots).toHaveLength(0);
    expect(data.version).toBe(1);
  });

  it('returns parsed data when file exists', () => {
    const mock: SnapshotFile = {
      version: 1,
      snapshots: [{ repo: TEST_REPO, branch: 'main', lastCommitHash: 'abc', lastCommitDate: '2024-01-01', capturedAt: '2024-01-01T00:00:00.000Z' }],
    };
    saveSnapshot(TEST_REPO, mock);
    const data = loadSnapshot(TEST_REPO);
    expect(data.snapshots).toHaveLength(1);
    expect(data.snapshots[0].branch).toBe('main');
  });
});

describe('upsertSnapshot', () => {
  it('inserts a new snapshot entry', () => {
    upsertSnapshot(TEST_REPO, { repo: TEST_REPO, branch: 'feature/x', lastCommitHash: 'def', lastCommitDate: '2024-02-01' });
    const data = loadSnapshot(TEST_REPO);
    expect(data.snapshots).toHaveLength(1);
    expect(data.snapshots[0].branch).toBe('feature/x');
  });

  it('updates an existing snapshot entry', () => {
    upsertSnapshot(TEST_REPO, { repo: TEST_REPO, branch: 'feature/x', lastCommitHash: 'aaa', lastCommitDate: '2024-02-01' });
    upsertSnapshot(TEST_REPO, { repo: TEST_REPO, branch: 'feature/x', lastCommitHash: 'bbb', lastCommitDate: '2024-03-01' });
    const data = loadSnapshot(TEST_REPO);
    expect(data.snapshots).toHaveLength(1);
    expect(data.snapshots[0].lastCommitHash).toBe('bbb');
  });
});

describe('removeSnapshot', () => {
  it('removes an existing snapshot entry', () => {
    upsertSnapshot(TEST_REPO, { repo: TEST_REPO, branch: 'old-branch', lastCommitHash: 'xyz', lastCommitDate: '2024-01-01' });
    removeSnapshot(TEST_REPO, 'old-branch');
    const data = loadSnapshot(TEST_REPO);
    expect(data.snapshots).toHaveLength(0);
  });
});

describe('getSnapshot', () => {
  it('returns undefined for unknown branch', () => {
    expect(getSnapshot(TEST_REPO, 'nonexistent')).toBeUndefined();
  });

  it('returns the correct snapshot', () => {
    upsertSnapshot(TEST_REPO, { repo: TEST_REPO, branch: 'dev', lastCommitHash: '111', lastCommitDate: '2024-04-01' });
    const snap = getSnapshot(TEST_REPO, 'dev');
    expect(snap).toBeDefined();
    expect(snap!.lastCommitHash).toBe('111');
  });
});
