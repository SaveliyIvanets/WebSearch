import { describe, it, expect, vi } from "vitest";
import { Logger, LogEntry } from "../../../src/logger/Logger.js";

describe("Logger", () => {
  it("should delegate log entries to custom transport with metadata", () => {
    const transport = vi.fn();
    const logger = new Logger({
      level: "debug",
      prefix: "TestPrefix",
      transport,
    });

    logger.info("Test message", { key: "value" });

    expect(transport).toHaveBeenCalledOnce();
    const entry: LogEntry = transport.mock.calls[0][0];

    expect(entry.level).toBe("info");
    expect(entry.prefix).toBe("TestPrefix");
    expect(entry.message).toBe("Test message");
    expect(entry.meta).toEqual({ key: "value" });
  });

  it("should respect log level thresholds", () => {
    const transport = vi.fn();
    const logger = new Logger({ level: "warn", transport });

    logger.debug("Debug msg");
    logger.info("Info msg");
    logger.warn("Warn msg");
    logger.error("Error msg");

    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("should silence all logs when level is silent", () => {
    const transport = vi.fn();
    const logger = new Logger({ level: "silent", transport });

    logger.error("Fatal error");
    expect(transport).not.toHaveBeenCalled();
  });
});
