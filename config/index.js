/**
 * Configuration Manager
 * Loads and merges configuration from default.json and environment variables.
 * Supports profile-based overrides for different developer personas.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {object|null} Cached configuration singleton */
let cachedConfig = null;

/**
 * Load and return the merged configuration object.
 * Reads default.json, applies environment variable overrides, and caches the result.
 * @param {object} [options] - Optional overrides
 * @param {string} [options.profile] - Profile name to apply (e.g. "backend", "frontend")
 * @returns {object} The resolved configuration
 */
export function loadConfig(options = {}) {
  if (cachedConfig && !options.profile) return cachedConfig;

  const defaultPath = resolve(__dirname, "default.json");
  let config = {};

  if (existsSync(defaultPath)) {
    config = JSON.parse(readFileSync(defaultPath, "utf-8"));
  }

  // Environment variable overrides
  if (process.env.LLM_PROVIDER) config.llm.provider = process.env.LLM_PROVIDER;
  if (process.env.LLM_MODEL) config.llm.model = process.env.LLM_MODEL;
  if (process.env.LLM_TEMPERATURE) config.llm.temperature = parseFloat(process.env.LLM_TEMPERATURE);
  if (process.env.AGENT_MAX_ITERATIONS) config.agent.maxIterations = parseInt(process.env.AGENT_MAX_ITERATIONS);
  if (process.env.LOG_LEVEL) config.logging.level = process.env.LOG_LEVEL;

  // Apply profile if specified
  if (options.profile && config.profiles?.[options.profile]) {
    const profile = config.profiles[options.profile];
    config.agent.systemPrompt = profile.systemPrompt || config.agent.systemPrompt;
  }

  cachedConfig = config;
  return config;
}

/**
 * Get a nested config value by dot-notation path.
 * @param {string} path - Dot-separated key path (e.g. "llm.provider")
 * @param {*} [defaultValue] - Fallback if path is not found
 * @returns {*} The config value or defaultValue
 */
export function getConfigValue(path, defaultValue = undefined) {
  const config = loadConfig();
  return path.split(".").reduce((obj, key) => obj?.[key], config) ?? defaultValue;
}

/**
 * List all available profile names.
 * @returns {string[]} Array of profile names
 */
export function getAvailableProfiles() {
  const config = loadConfig();
  return Object.keys(config.profiles || {});
}
