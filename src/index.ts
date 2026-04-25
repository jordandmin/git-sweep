#!/usr/bin/env node
/**
 * git-sweep entry point
 *
 * Wires together CLI argument parsing, config loading, scheduling,
 * interactive prompts, and the core sweep logic.
 */

import { parseArgs, printHelp } from "./cli";
import { loadConfig, validateConfig } from "./config";
import { setLogLevel, setLogFile, log } from "./logger";
import { runSweep } from "./sweep";
import { buildReport, formatReport, saveReport } from "./reporter";
import { scheduleRepo, listSchedule, removeSchedule, printDueRepos } from "./scheduler-cli";
import { loadSchedule } from "./scheduler";
import { runInteractive } from "./interactive";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Apply log level / log file overrides from CLI flags early so that all
  // subsequent code benefits from the configured verbosity.
  if (args.logLevel) {
    setLogLevel(args.logLevel as any);
  }
  if (args.logFile) {
    setLogFile(args.logFile);
  }

  // ── Scheduler sub-commands ──────────────────────────────────────────────
  if (args.subcommand === "schedule") {
    const [action, ...rest] = args.subcommandArgs ?? [];
    switch (action) {
      case "add":
        await scheduleRepo(rest[0], rest[1]);
        break;
      case "list":
        await listSchedule();
        break;
      case "remove":
        await removeSchedule(rest[0]);
        break;
      case "due":
        await printDueRepos();
        break;
      default:
        console.error(`Unknown schedule action: ${action}`);
        printHelp();
        process.exit(1);
    }
    return;
  }

  // ── Load & validate config ───────────────────────────────────────────────
  const configPath = args.config;
  let config;
  try {
    config = await loadConfig(configPath);
    validateConfig(config);
  } catch (err: any) {
    log("error", `Failed to load config: ${err.message}`);
    process.exit(1);
  }

  // ── Interactive mode ─────────────────────────────────────────────────────
  if (args.interactive) {
    await runInteractive(config);
    return;
  }

  // ── Automatic sweep (possibly dry-run) ──────────────────────────────────
  const repos: string[] = args.repos?.length ? args.repos : config.repos ?? [];

  if (repos.length === 0) {
    log("warn", "No repositories specified. Use --repos or add them to the config file.");
    process.exit(0);
  }

  // If --due flag is set, filter repos to only those due according to schedule.
  let targetRepos = repos;
  if (args.due) {
    const schedule = await loadSchedule();
    const now = new Date();
    targetRepos = repos.filter((r) => {
      const entry = schedule.find((e) => e.repo === r);
      return entry ? new Date(entry.nextRun) <= now : true;
    });
    log("info", `Due repos: ${targetRepos.join(", ") || "none"}`);
    if (targetRepos.length === 0) {
      process.exit(0);
    }
  }

  const results = await runSweep(targetRepos, config, { dryRun: !!args.dryRun });

  const report = buildReport(results);
  const formatted = formatReport(report, args.format as any);
  console.log(formatted);

  if (args.reportFile) {
    await saveReport(report, args.reportFile);
    log("info", `Report saved to ${args.reportFile}`);
  }

  const anyErrors = results.some((r) => r.error);
  process.exit(anyErrors ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
