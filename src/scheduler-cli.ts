import * as path from 'path';
import * as os from 'os';
import {
  loadSchedule,
  saveSchedule,
  upsertScheduleEntry,
  getDueRepos,
  ScheduleEntry,
} from './scheduler';
import { writeLog } from './logger';

const DEFAULT_SCHEDULE_PATH = path.join(os.homedir(), '.git-sweep', 'schedule.json');

export function scheduleRepo(
  repoPath: string,
  intervalDays: number,
  schedulePath: string = DEFAULT_SCHEDULE_PATH
): void {
  const entries = loadSchedule(schedulePath);
  const updated = upsertScheduleEntry(entries, path.resolve(repoPath), intervalDays);
  saveSchedule(schedulePath, updated);
  writeLog('info', `Scheduled ${repoPath} every ${intervalDays} day(s).`);
  console.log(`Scheduled: ${repoPath} — every ${intervalDays} day(s)`);
}

export function listSchedule(schedulePath: string = DEFAULT_SCHEDULE_PATH): void {
  const entries = loadSchedule(schedulePath);
  if (entries.length === 0) {
    console.log('No scheduled repositories.');
    return;
  }
  const now = new Date();
  console.log('Scheduled repositories:\n');
  for (const entry of entries) {
    const nextRun = new Date(entry.nextRun);
    const overdue = nextRun < now;
    const status = overdue ? '(DUE)' : `(next: ${nextRun.toLocaleDateString()})`;
    console.log(`  ${entry.repoPath}  every ${entry.intervalDays}d  ${status}`);
  }
}

export function removeSchedule(
  repoPath: string,
  schedulePath: string = DEFAULT_SCHEDULE_PATH
): void {
  const entries = loadSchedule(schedulePath);
  const resolved = path.resolve(repoPath);
  const filtered = entries.filter((e: ScheduleEntry) => e.repoPath !== resolved);
  if (filtered.length === entries.length) {
    console.log(`No schedule found for: ${repoPath}`);
    return;
  }
  saveSchedule(schedulePath, filtered);
  writeLog('info', `Removed schedule for ${repoPath}.`);
  console.log(`Removed schedule for: ${repoPath}`);
}

export function printDueRepos(schedulePath: string = DEFAULT_SCHEDULE_PATH): string[] {
  const due = getDueRepos(schedulePath);
  if (due.length === 0) {
    console.log('No repositories are due for sweep.');
  } else {
    console.log('Due for sweep:');
    due.forEach((r) => console.log(`  ${r}`));
  }
  return due;
}
