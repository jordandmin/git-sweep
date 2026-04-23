import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface GitSweepConfig {
  repositories: string[];
  staleDaysThreshold: number;
  protectedBranches: string[];
  dryRun: boolean;
  verbose: boolean;
}

const DEFAULT_CONFIG: GitSweepConfig = {
  repositories: [],
  staleDaysThreshold: 30,
  protectedBranches: ['main', 'master', 'develop', 'production'],
  dryRun: false,
  verbose: false,
};

const CONFIG_FILE_NAME = '.git-sweep.json';

export function getConfigFilePath(): string {
  return path.join(os.homedir(), CONFIG_FILE_NAME);
}

export function loadConfig(configPath?: string): GitSweepConfig {
  const filePath = configPath ?? getConfigFilePath();

  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<GitSweepConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    throw new Error(`Failed to parse config file at ${filePath}: ${(err as Error).message}`);
  }
}

export function saveConfig(config: GitSweepConfig, configPath?: string): void {
  const filePath = configPath ?? getConfigFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    throw new Error(`Failed to write config file at ${filePath}: ${(err as Error).message}`);
  }
}

export function validateConfig(config: GitSweepConfig): string[] {
  const errors: string[] = [];

  if (!Array.isArray(config.repositories)) {
    errors.push('repositories must be an array of paths');
  } else {
    config.repositories.forEach((repo, idx) => {
      if (typeof repo !== 'string' || repo.trim() === '') {
        errors.push(`repositories[${idx}] must be a non-empty string`);
      }
    });
  }

  if (typeof config.staleDaysThreshold !== 'number' || config.staleDaysThreshold < 1) {
    errors.push('staleDaysThreshold must be a positive number');
  }

  if (!Array.isArray(config.protectedBranches)) {
    errors.push('protectedBranches must be an array of branch names');
  }

  return errors;
}
