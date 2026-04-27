/**
 * Agent Orchestrator
 * High-level interface for invoking the Dev-Agent.
 * Manages graph lifecycle, session threads, and provides a clean API
 * for the CLI layer to interact with.
 */

import { v4 as uuidv4 } from "uuid";
import { buildAgentGraph } from "./graph.js";
import { loadBuiltinTools, getAllTools } from "../tools/registry.js";
import { loadConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { LLMError, formatError } from "../utils/errors.js";

/** @type {{ app: any, checkpointer: any }|null} */
let agentInstance = null;

/**
 * Initialize the agent: load tools, build graph.
 * Idempotent — safe to call multiple times.
 * @param {object} [options]
 * @param {string} [options.profile] - Config profile to use
 * @param {boolean} [options.enableMemory] - Enable conversation memory
 */
export async function initAgent(options = {}) {
  if (agentInstance) return agentInstance;

  // Load config with optional profile
  loadConfig({ profile: options.profile });

  // Load all built-in tools
  await loadBuiltinTools();
  const tools = getAllTools();

  logger.info(`Agent initialized with ${tools.length} tools.`);

  // Build the LangGraph workflow
  agentInstance = buildAgentGraph(tools, {
    enableMemory: options.enableMemory !== false,
  });

  return agentInstance;
}

/**
 * Invoke the agent with a user message.
 * @param {string} userMessage - The user's input
 * @param {object} [options]
 * @param {string} [options.taskType] - Task type: ask, explain, debug, generate, chat
 * @param {string} [options.threadId] - Session thread ID for memory continuity
 * @param {object} [options.metadata] - Additional metadata
 * @returns {Promise<{ content: string, threadId: string }>}
 */
export async function invokeAgent(userMessage, options = {}) {
  const { taskType = "chat", threadId = uuidv4(), metadata = {} } = options;

  if (!agentInstance) {
    await initAgent();
  }

  const { app } = agentInstance;

  logger.separator();
  logger.step("Input", `[${taskType}] ${userMessage.slice(0, 80)}${userMessage.length > 80 ? "..." : ""}`);

  try {
    const result = await app.invoke(
      {
        messages: [{ role: "user", content: userMessage }],
        taskType,
        metadata,
      },
      {
        configurable: { thread_id: threadId },
      }
    );

    const lastMessage = result.messages[result.messages.length - 1];
    const content = lastMessage?.content || "No response generated.";

    logger.step("Complete", `Tool calls: ${result.toolCallCount || 0}`);

    return { content, threadId };
  } catch (error) {
    if (error instanceof LLMError) throw error;
    logger.error(formatError(error));
    throw new LLMError(`Agent invocation failed: ${error.message}`, { originalError: error.message });
  }
}

/**
 * Create a new session thread ID.
 * @returns {string}
 */
export function createThread() {
  return uuidv4();
}
