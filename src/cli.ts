#!/usr/bin/env node
import * as path from 'path';
import { loadConfig } from './config';
import { runSweep } from './sweep';
import { buildReport, formatReport, saveReport, ReportFormat } from './reporter';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      args['dryRun'] = true;
    } else if (arg === '--format' && argv[i + 1]) {
      args['format'] = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      args['output'] = argv[++i];
    } else if (arg === '--config' && argv[i + 1]) {
      args['config'] = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      args['help'] = true;
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`
git-sweep — clean up merged branches and stale remotes

Usage:
  git-sweep [options]

Options:
  --dry-run          Preview changes without applying them
  --format <fmt>     Report format: text (default) or json
  --output <path>    Save report to file instead of stdout
  --config <path>    Path to config file (default: ~/.git-sweep.json)
  --help, -h         Show this help message
`.trim());
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args['help']) {
    printHelp();
    process.exit(0);
  }

  const configPath = typeof args['config'] === 'string' ? args['config'] : undefined;
  const config = loadConfig(configPath);
  const dryRun = args['dryRun'] === true;
  const format = (args['format'] as ReportFormat) ?? 'text';
  const outputPath = typeof args['output'] === 'string' ? args['output'] : undefined;

  const results = await runSweep(config, { dryRun });
  const report = buildReport(results);

  if (outputPath) {
    saveReport(report, path.resolve(outputPath), format);
    console.log(`Report saved to ${outputPath}`);
  } else {
    console.log(formatReport(report, format));
  }

  const hasErrors = results.some((r) => r.errors.length > 0);
  process.exit(hasErrors ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err instanceof Error ? err.message : err);
  process.exit(2);
});
