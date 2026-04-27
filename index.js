/**
 * Dev-Agent — Programmatic Entry Point
 * Use this to import and use the agent in other Node.js projects,
 * or as the foundation for a future API layer.
 *
 * For CLI usage, run: node cli/index.js
 */

export { initAgent, invokeAgent, createThread } from "./agent/index.js";
export { loadConfig, getConfigValue, getAvailableProfiles } from "./config/index.js";
export { loadBuiltinTools, getAllTools, registerTool } from "./tools/registry.js";
export { createLLM, quickInvoke } from "./services/llm.js";
