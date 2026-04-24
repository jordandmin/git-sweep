import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildReport, formatReport, saveReport, SweepResult } from './reporter';

const mockResults: SweepResult[] = [
  {
    repo: 'my-app',
    deletedBranches: ['feature/old', 'fix/typo'],
    prunedRemotes: ['origin'],
    errors: [],
    dryRun: false,
  },
  {
    repo: 'lib-core',
    deletedBranches: [],
    prunedRemotes: [],
    errors: ['permission denied'],
    dryRun: false,
  },
];

describe('buildReport', () => {
  it('aggregates totals correctly', () => {
    const report = buildReport(mockResults);
    expect(report.totalRepos).toBe(2);
    expect(report.totalDeletedBranches).toBe(2);
    expect(report.totalPrunedRemotes).toBe(1);
    expect(report.results).toHaveLength(2);
  });

  it('sets a valid ISO timestamp', () => {
    const report = buildReport(mockResults);
    expect(() => new Date(report.timestamp)).not.toThrow();
    expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
  });
});

describe('formatReport', () => {
  it('produces text output containing repo names', () => {
    const report = buildReport(mockResults);
    const text = formatReport(report, 'text');
    expect(text).toContain('my-app');
    expect(text).toContain('lib-core');
    expect(text).toContain('feature/old');
    expect(text).toContain('permission denied');
  });

  it('produces valid JSON output', () => {
    const report = buildReport(mockResults);
    const json = formatReport(report, 'json');
    const parsed = JSON.parse(json);
    expect(parsed.totalRepos).toBe(2);
  });

  it('shows dry-run label when applicable', () => {
    const dryResults: SweepResult[] = [{ ...mockResults[0], dryRun: true }];
    const report = buildReport(dryResults);
    const text = formatReport(report, 'text');
    expect(text).toContain('dry-run');
  });

  it('shows nothing-to-clean message when all arrays empty', () => {
    const emptyResult: SweepResult[] = [
      { repo: 'clean-repo', deletedBranches: [], prunedRemotes: [], errors: [], dryRun: false },
    ];
    const report = buildReport(emptyResult);
    const text = formatReport(report, 'text');
    expect(text).toContain('Nothing to clean up');
  });
});

describe('saveReport', () => {
  it('writes report file to disk', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-sweep-'));
    const outPath = path.join(tmpDir, 'reports', 'sweep.txt');
    const report = buildReport(mockResults);
    saveReport(report, outPath, 'text');
    expect(fs.existsSync(outPath)).toBe(true);
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('my-app');
    fs.rmSync(tmpDir, { recursive: true });
  });
});
