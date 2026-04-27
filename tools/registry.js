/**
 * Tool Registry
 * Central registry for all agent tools. Supports dynamic registration
 * and provides a plugin-like architecture for adding new tools.
 */

import { logger } from "../utils/logger.js";

/** @type {Map<string, import("@langchain/core/tools").StructuredTool>} */
const toolRegistry = new Map();

/**
 * Register a tool in the global registry.
 * @param {import("@langchain/core/tools").StructuredTool} tool
 */
export function registerTool(tool) {
  if (toolRegistry.has(tool.name)) {
    logger.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
  }
  toolRegistry.set(tool.name, tool);
  logger.debug(`Registered tool: ${tool.name}`);
}

/**
 * Get a tool by name.
 * @param {string} name
 * @returns {import("@langchain/core/tools").StructuredTool|undefined}
 */
export function getTool(name) {
  return toolRegistry.get(name);
}

/**
 * Get all registered tools as an array.
 * @returns {import("@langchain/core/tools").StructuredTool[]}
 */
export function getAllTools() {
  return Array.from(toolRegistry.values());
}

/**
 * Get tool names.
 * @returns {string[]}
 */
export function getToolNames() {
  return Array.from(toolRegistry.keys());
}

/**
 * Load and register all built-in tools.
 * This is the main entry point called during agent initialization.
 */
export async function loadBuiltinTools() {
  const modules = await Promise.all([
    import("./fileReader.js"),
    import("./codeAnalyzer.js"),
    import("./errorDebugger.js"),
    import("./apiGenerator.js"),
    import("./webSearch.js"),
  ]);

  for (const mod of modules) {
    if (mod.default) {
      registerTool(mod.default);
    } else if (mod.tool) {
      registerTool(mod.tool);
    }
  }

  logger.debug(`Loaded ${toolRegistry.size} tools: ${getToolNames().join(", ")}`);
}
