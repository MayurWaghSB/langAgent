/**
 * Custom Error Classes
 * Provides structured, typed errors for graceful failure handling across the system.
 */

/** Base error for all Dev-Agent errors. */
export class DevAgentError extends Error {
  /**
   * @param {string} message
   * @param {string} code - Machine-readable error code
   * @param {object} [context] - Additional context for debugging
   */
  constructor(message, code, context = {}) {
    super(message);
    this.name = "DevAgentError";
    this.code = code;
    this.context = context;
  }
}

/** Thrown when LLM provider fails or is misconfigured. */
export class LLMError extends DevAgentError {
  constructor(message, context = {}) {
    super(message, "LLM_ERROR", context);
    this.name = "LLMError";
  }
}

/** Thrown when a tool fails during execution. */
export class ToolError extends DevAgentError {
  constructor(toolName, message, context = {}) {
    super(`Tool "${toolName}" failed: ${message}`, "TOOL_ERROR", { toolName, ...context });
    this.name = "ToolError";
  }
}

/** Thrown when configuration is invalid or missing. */
export class ConfigError extends DevAgentError {
  constructor(message, context = {}) {
    super(message, "CONFIG_ERROR", context);
    this.name = "ConfigError";
  }
}

/** Thrown when a file operation fails. */
export class FileError extends DevAgentError {
  constructor(message, filePath, context = {}) {
    super(message, "FILE_ERROR", { filePath, ...context });
    this.name = "FileError";
  }
}

/**
 * Format any error into a user-friendly message.
 * @param {Error} error
 * @returns {string}
 */
export function formatError(error) {
  if (error instanceof DevAgentError) {
    return `[${error.code}] ${error.message}`;
  }
  if (error.message?.includes("API key")) {
    return `[AUTH_ERROR] Missing or invalid API key. Check your .env file.`;
  }
  if (error.message?.includes("ENOENT")) {
    return `[FILE_NOT_FOUND] ${error.message}`;
  }
  if (error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch failed")) {
    return `[NETWORK_ERROR] Could not connect to the service. Check your internet connection.`;
  }
  return `[UNEXPECTED_ERROR] ${error.message}`;
}
