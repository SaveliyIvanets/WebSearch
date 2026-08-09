import { test } from "node:test";
import assert from "node:assert/strict";
import { Logger } from "./Logger.js";

function captureLogger(
  options: { level?: string; prefix?: string } = {}
): { logger: Logger; entries: Array<Record<string, unknown>> } {
  const entries: Array<Record<string, unknown>> = [];
  const logger = new Logger({
    level: (options.level ?? "info") as "info",
    prefix: options.prefix,
    transport: (entry) => entries.push(entry as unknown as Record<string, unknown>),
  });
  return { logger, entries };
}

test("default level is info", () => {
  const logger = new Logger();
  assert.equal(logger.getLevel(), "info");
});

test("setLevel updates the level", () => {
  const logger = new Logger({ level: "info" });
  logger.setLevel("error");
  assert.equal(logger.getLevel(), "error");
});

test("isEnabled respects the configured level", () => {
  const logger = new Logger({ level: "info" });
  assert.equal(logger.isEnabled("info"), true);
  assert.equal(logger.isEnabled("warn"), true);
  assert.equal(logger.isEnabled("error"), true);
  assert.equal(logger.isEnabled("debug"), false);
});

test("silent level disables all logging", () => {
  const logger = new Logger({ level: "silent" });
  assert.equal(logger.isEnabled("error"), false);
});

test("logs below the set level are suppressed", () => {
  const { logger, entries } = captureLogger({ level: "info" });
  logger.debug("debug message");
  logger.info("info message");
  logger.warn("warn message");
  logger.error("error message");
  assert.deepEqual(
    entries.map((e) => e.level),
    ["info", "warn", "error"]
  );
});

test("each entry includes a timestamp", () => {
  const { logger, entries } = captureLogger();
  logger.info("hello");
  assert.equal(entries.length, 1);
  const entry = entries[0] as { timestamp: string };
  assert.ok(!Number.isNaN(Date.parse(entry.timestamp)));
});

test("each entry includes the message and level", () => {
  const { logger, entries } = captureLogger();
  logger.warn("slow response");
  const entry = entries[0] as { message: string; level: string };
  assert.equal(entry.message, "slow response");
  assert.equal(entry.level, "warn");
});

test("meta is attached to the entry when provided", () => {
  const { logger, entries } = captureLogger();
  logger.error("request failed", { url: "https://example.com", code: 500 });
  const entry = entries[0] as { meta: Record<string, unknown> };
  assert.deepEqual(entry.meta, { url: "https://example.com", code: 500 });
});

test("prefix is included in the entry", () => {
  const { logger, entries } = captureLogger({ prefix: "[Crawler]" });
  logger.info("starting");
  const entry = entries[0] as { prefix: string };
  assert.equal(entry.prefix, "[Crawler]");
});

test("meta is omitted from entry when not provided", () => {
  const { logger, entries } = captureLogger();
  logger.info("no meta");
  const entry = entries[0] as { meta?: unknown };
  assert.equal(entry.meta, undefined);
});
