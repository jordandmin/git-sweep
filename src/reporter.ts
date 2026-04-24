import * as fs from 'fs';
import * as path from 'path';

export type ReportFormat = 'text' | 'json';

export interface SweepResult {
  repo: string;
  deletedBranches: string[];
  prunedRemotes: string[];
  errors: string[];
  dryRun: boolean;
}

export interface Report {
  timestamp: string;
  totalRepos: number;
  totalDeletedBranches: number;
  totalPrunedRemotes: number;
  results: SweepResult[];
}

export function buildReport(results: SweepResult[]): Report {
  return {
    timestamp: new Date().toISOString(),
    totalRepos: results.length,
    totalDeletedBranches: results.reduce((sum, r) => sum + r.deletedBranches.length, 0),
    totalPrunedRemotes: results.reduce((sum, r) => sum + r.prunedRemotes.length, 0),
    results,
  };
}

export function formatReport(report: Report, format: ReportFormat = 'text'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  const lines: string[] = [];
  lines.push(`git-sweep report — ${report.timestamp}`);
  lines.push(`Repos processed : ${report.totalRepos}`);
  lines.push(`Branches deleted: ${report.totalDeletedBranches}`);
  lines.push(`Remotes pruned  : ${report.totalPrunedRemotes}`);
  lines.push('');

  for (const result of report.results) {
    lines.push(`[${result.repo}]${result.dryRun ? ' (dry-run)' : ''}`);
    if (result.deletedBranches.length > 0) {
      lines.push(`  Deleted branches: ${result.deletedBranches.join(', ')}`);
    }
    if (result.prunedRemotes.length > 0) {
      lines.push(`  Pruned remotes  : ${result.prunedRemotes.join(', ')}`);
    }
    if (result.errors.length > 0) {
      lines.push(`  Errors          : ${result.errors.join('; ')}`);
    }
    if (
      result.deletedBranches.length === 0 &&
      result.prunedRemotes.length === 0 &&
      result.errors.length === 0
    ) {
      lines.push('  Nothing to clean up.');
    }
  }

  return lines.join('\n');
}

export function saveReport(report: Report, outputPath: string, format: ReportFormat = 'text'): void {
  const content = formatReport(report, format);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
}
