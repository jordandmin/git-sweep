import {
  computeNextRun,
  isDue,
  upsertScheduleEntry,
  loadSchedule,
  saveSchedule,
  ScheduleEntry,
} from './scheduler';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('computeNextRun', () => {
  it('adds intervalDays to lastRun when provided', () => {
    const last = new Date('2024-01-01T00:00:00Z');
    const next = computeNextRun(last, 7);
    expect(next.toISOString()).toBe('2024-01-08T00:00:00.000Z');
  });

  it('uses current date when lastRun is null', () => {
    const before = new Date();
    const next = computeNextRun(null, 3);
    const after = new Date();
    expect(next.getTime()).toBeGreaterThanOrEqual(before.getTime() + 3 * 86400000 - 1000);
    expect(next.getTime()).toBeLessThanOrEqual(after.getTime() + 3 * 86400000 + 1000);
  });
});

describe('isDue', () => {
  it('returns true when nextRun is in the past', () => {
    const entry: ScheduleEntry = {
      repoPath: '/repo',
      intervalDays: 7,
      lastRun: null,
      nextRun: new Date(Date.now() - 1000).toISOString(),
    };
    expect(isDue(entry)).toBe(true);
  });

  it('returns false when nextRun is in the future', () => {
    const entry: ScheduleEntry = {
      repoPath: '/repo',
      intervalDays: 7,
      lastRun: null,
      nextRun: new Date(Date.now() + 86400000).toISOString(),
    };
    expect(isDue(entry)).toBe(false);
  });
});

describe('upsertScheduleEntry', () => {
  it('adds a new entry when repo not present', () => {
    const result = upsertScheduleEntry([], '/repo/a', 5);
    expect(result).toHaveLength(1);
    expect(result[0].repoPath).toBe('/repo/a');
  });

  it('updates existing entry for same repoPath', () => {
    const initial = upsertScheduleEntry([], '/repo/a', 5);
    const updated = upsertScheduleEntry(initial, '/repo/a', 10);
    expect(updated).toHaveLength(1);
    expect(updated[0].intervalDays).toBe(10);
  });
});

describe('loadSchedule / saveSchedule', () => {
  let tmpDir: string;
  let schedulePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-sweep-'));
    schedulePath = path.join(tmpDir, 'schedule.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when file does not exist', () => {
    expect(loadSchedule(schedulePath)).toEqual([]);
  });

  it('persists and reloads entries correctly', () => {
    const entries = upsertScheduleEntry([], '/repo/x', 14);
    saveSchedule(schedulePath, entries);
    const loaded = loadSchedule(schedulePath);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].repoPath).toBe('/repo/x');
    expect(loaded[0].intervalDays).toBe(14);
  });
});
