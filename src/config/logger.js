import env from "./env.js";

/**
 * Minimal dependency-free logger with levels and timestamps.
 * Swap for pino/winston in production if structured logging is required.
 */
const COLORS = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
  reset: "\x1b[0m",
};

const format = (level, message) => {
  const ts = new Date().toISOString();
  if (env.isProd) return `${ts} [${level.toUpperCase()}] ${message}`;
  return `${COLORS[level] || ""}${ts} [${level.toUpperCase()}]${COLORS.reset} ${message}`;
};

const logger = {
  info: (msg) => console.log(format("info", msg)),
  warn: (msg) => console.warn(format("warn", msg)),
  error: (msg) => console.error(format("error", msg)),
  debug: (msg) => {
    if (!env.isProd) console.log(format("debug", msg));
  },
  stream: {
    // For morgan HTTP logging
    write: (message) => console.log(format("info", message.trim())),
  },
};

export default logger;
