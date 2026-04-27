/**
 * Structured Logger
 * Provides leveled, color-coded logging with support for agent step tracing.
 * Respects the configured log level from config.
 */

import chalk from "chalk";
import { getConfigValue } from "../config/index.js";

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

/**
 * Get the current numeric log level from config.
 * @returns {number}
 */
function getCurrentLevel() {
  const level = getConfigValue("logging.level", "info");
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
}

/**
 * Format a timestamp for log output.
 * @returns {string} HH:MM:SS formatted time
 */
function timestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export const logger = {
  debug(...args) {
    if (getCurrentLevel() <= LOG_LEVELS.debug) {
      console.log(chalk.gray(`[${timestamp()}] [DEBUG]`), ...args);
    }
  },

  info(...args) {
    if (getCurrentLevel() <= LOG_LEVELS.info) {
      console.log(chalk.blue(`[${timestamp()}] [INFO]`), ...args);
    }
  },

  warn(...args) {
    if (getCurrentLevel() <= LOG_LEVELS.warn) {
      console.log(chalk.yellow(`[${timestamp()}] [WARN]`), ...args);
    }
  },

  error(...args) {
    if (getCurrentLevel() <= LOG_LEVELS.error) {
      console.log(chalk.red(`[${timestamp()}] [ERROR]`), ...args);
    }
  },

  /** Log an agent workflow step with a distinctive prefix. */
  step(stepName, detail = "") {
    if (getCurrentLevel() <= LOG_LEVELS.info) {
      console.log(chalk.magenta(`  ⟶  ${stepName}`), detail ? chalk.gray(detail) : "");
    }
  },

  /** Log a tool invocation. */
  tool(toolName, input = "") {
    if (getConfigValue("logging.showToolCalls", true)) {
      console.log(chalk.cyan(`  🔧 Tool: ${toolName}`), input ? chalk.gray(`(${input})`) : "");
    }
  },

  /** Log agent thinking / reasoning. */
  thinking(thought) {
    if (getConfigValue("logging.showThinking", true)) {
      console.log(chalk.gray(`  💭 ${thought}`));
    }
  },

  /** Print a blank separator line. */
  separator() {
    console.log(chalk.gray("─".repeat(60)));
  },

  /** Print a success message. */
  success(msg) {
    console.log(chalk.green(`  ✔ ${msg}`));
  },
};
