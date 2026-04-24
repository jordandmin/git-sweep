import { loadConfig } from './config';
import { writeLog } from './logger';
import * as fs from 'fs';
import * as path from 'path';

export interface ScheduleEntry {
  repoPath: string;
  intervalDays: number;
  lastRun: string | null;
  nextRun: string;
}

export function computeNextRun(lastRun: Date | null, intervalDays: number): Date {
  const base = lastRun ?? new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + intervalDays);
  return next;
}

export function isDue(entry: ScheduleEntry): boolean {
  const now = new Date();
  const nextRun = new Date(entry.nextRun);
  return now >= nextRun;
}

export function loadSchedule(schedulePath: string): ScheduleEntry[] {
  if (!fs.existsSync(schedulePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(schedulePath, 'utf-8');
    return JSON.parse(raw) as ScheduleEntry[];
  } catch (err) {
    writeLog('warn', `Failed to parse schedule file: ${err}`);
    return [];
  }
}

export function saveSchedule(schedulePath: string, entries: ScheduleEntry[]): void {
  fs.mkdirSync(path.dirname(schedulePath), { recursive: true });
  fs.writeFileSync(schedulePath, JSON.stringify(entries, null, 2), 'utf-8');
}

export function upsertScheduleEntry(
  entries: ScheduleEntry[],
  repoPath: string,
  intervalDays: number,
  lastRun: Date | null = null
): ScheduleEntry[] {
  const next = computeNextRun(lastRun, intervalDays);
  const entry: ScheduleEntry = {
    repoPath,
    intervalDays,
    lastRun: lastRun ? lastRun.toISOString() : null,
    nextRun: next.toISOString(),
  };
  const idx = entries.findIndex((e) => e.repoPath === repoPath);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  return entries;
}

export function getDueRepos(schedulePath: string): string[] {
  const entries = loadSchedule(schedulePath);
  return entries.filter(isDue).map((e) => e.repoPath);
}
