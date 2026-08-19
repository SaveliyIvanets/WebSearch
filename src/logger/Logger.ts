export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface LogEntry {
  timestamp: string;
  level: Exclude<LogLevel, "silent">;
  prefix: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  transport?: (entry: LogEntry) => void;
}

const LEVEL_ORDER: Record<Exclude<LogLevel, "silent">, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_TRANSPORT = (entry: LogEntry): void => {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const prefixed = entry.prefix ? `${base} [${entry.prefix}]` : base;
  const serialized = entry.meta ? ` ${JSON.stringify(entry.meta)}` : "";
  const line = `${prefixed} ${entry.message}${serialized}`;

  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private transport: (entry: LogEntry) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.prefix = options.prefix ?? "";
    this.transport = options.transport ?? DEFAULT_TRANSPORT;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  isEnabled(level: Exclude<LogLevel, "silent">): boolean {
    if (this.level === "silent") return false;
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.level];
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log("error", message, meta);
  }

  private log(level: Exclude<LogLevel, "silent">, message: string, meta?: Record<string, unknown>): void {
    if (!this.isEnabled(level)) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      prefix: this.prefix,
      message,
      ...(meta !== undefined ? { meta } : {}),
    };
    this.transport(entry);
  }
}
