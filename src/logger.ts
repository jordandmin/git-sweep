import * as fs from "fs";
import * as path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = "info";
let logFilePath: string | null = null;
const logHistory: LogEntry[] = [];

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function setLogFile(filePath: string): void {
  logFilePath = filePath;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getLogHistory(): LogEntry[] {
  return [...logHistory];
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

function writeLog(level: LogLevel, message: string): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  logHistory.push(entry);

  const formatted = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`;
  const output = level === "error" || level === "warn" ? process.stderr : process.stdout;
  output.write(formatted + "\n");

  if (logFilePath) {
    fs.appendFileSync(logFilePath, formatted + "\n", "utf-8");
  }
}

export const logger = {
  debug: (msg: string) => writeLog("debug", msg),
  info: (msg: string) => writeLog("info", msg),
  warn: (msg: string) => writeLog("warn", msg),
  error: (msg: string) => writeLog("error", msg),
};

export function resetLogger(): void {
  currentLevel = "info";
  logFilePath = null;
  logHistory.length = 0;
}
