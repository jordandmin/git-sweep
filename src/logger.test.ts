import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  logger,
  setLogLevel,
  setLogFile,
  getLogHistory,
  resetLogger,
} from "./logger";

beforeEach(() => {
  resetLogger();
});

describe("logger", () => {
  it("logs info messages by default", () => {
    const spy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    logger.info("hello world");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[INFO] hello world\n"));
    spy.mockRestore();
  });

  it("suppresses debug messages at default level", () => {
    const spy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    logger.debug("debug msg");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("logs debug when level is set to debug", () => {
    setLogLevel("debug");
    const spy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    logger.debug("debug msg");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[DEBUG] debug msg\n"));
    spy.mockRestore();
  });

  it("writes error messages to stderr", () => {
    const spy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    logger.error("something failed");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[ERROR] something failed\n"));
    spy.mockRestore();
  });

  it("records log history", () => {
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    logger.info("first");
    logger.warn("second");
    const history = getLogHistory();
    expect(history).toHaveLength(2);
    expect(history[0].level).toBe("info");
    expect(history[1].level).toBe("warn");
  });

  it("writes logs to a file when setLogFile is called", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-sweep-"));
    const logFile = path.join(tmpDir, "sweep.log");
    setLogFile(logFile);
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    logger.info("file log test");
    const contents = fs.readFileSync(logFile, "utf-8");
    expect(contents).toContain("[INFO] file log test");
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("resetLogger clears history and level", () => {
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    setLogLevel("debug");
    logger.debug("before reset");
    resetLogger();
    expect(getLogHistory()).toHaveLength(0);
    logger.debug("after reset");
    expect(getLogHistory()).toHaveLength(0);
  });
});
