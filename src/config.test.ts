import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig, saveConfig, validateConfig, GitSweepConfig, getConfigFilePath } from './config';

const TMP_CONFIG = path.join(os.tmpdir(), '.git-sweep-test.json');

afterEach(() => {
  if (fs.existsSync(TMP_CONFIG)) {
    fs.unlinkSync(TMP_CONFIG);
  }
});

describe('loadConfig', () => {
  it('returns default config when file does not exist', () => {
    const config = loadConfig('/nonexistent/path/.git-sweep.json');
    expect(config.staleDaysThreshold).toBe(30);
    expect(config.protectedBranches).toContain('main');
    expect(config.dryRun).toBe(false);
    expect(config.repositories).toEqual([]);
  });

  it('merges file values over defaults', () => {
    fs.writeFileSync(TMP_CONFIG, JSON.stringify({ staleDaysThreshold: 60, dryRun: true }));
    const config = loadConfig(TMP_CONFIG);
    expect(config.staleDaysThreshold).toBe(60);
    expect(config.dryRun).toBe(true);
    expect(config.protectedBranches).toContain('master');
  });

  it('throws on malformed JSON', () => {
    fs.writeFileSync(TMP_CONFIG, '{ invalid json }');
    expect(() => loadConfig(TMP_CONFIG)).toThrow('Failed to parse config file');
  });
});

describe('saveConfig', () => {
  it('writes config as formatted JSON', () => {
    const config: GitSweepConfig = {
      repositories: ['/home/user/project'],
      staleDaysThreshold: 14,
      protectedBranches: ['main'],
      dryRun: false,
      verbose: true,
    };
    saveConfig(config, TMP_CONFIG);
    const raw = fs.readFileSync(TMP_CONFIG, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.staleDaysThreshold).toBe(14);
    expect(parsed.repositories).toEqual(['/home/user/project']);
  });
});

describe('validateConfig', () => {
  const baseConfig: GitSweepConfig = {
    repositories: ['/some/repo'],
    staleDaysThreshold: 30,
    protectedBranches: ['main'],
    dryRun: false,
    verbose: false,
  };

  it('returns no errors for valid config', () => {
    expect(validateConfig(baseConfig)).toHaveLength(0);
  });

  it('reports error for invalid staleDaysThreshold', () => {
    const errors = validateConfig({ ...baseConfig, staleDaysThreshold: 0 });
    expect(errors.some(e => e.includes('staleDaysThreshold'))).toBe(true);
  });

  it('reports error for empty repository string', () => {
    const errors = validateConfig({ ...baseConfig, repositories: [''] });
    expect(errors.some(e => e.includes('repositories[0]'))).toBe(true);
  });

  it('reports error when protectedBranches is not an array', () => {
    const errors = validateConfig({ ...baseConfig, protectedBranches: 'main' as any });
    expect(errors.some(e => e.includes('protectedBranches'))).toBe(true);
  });
});

describe('getConfigFilePath', () => {
  it('returns a path ending with .git-sweep.json in home dir', () => {
    const p = getConfigFilePath();
    expect(p).toContain(os.homedir());
    expect(p).toEndWith('.git-sweep.json');
  });
});
