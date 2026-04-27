/**
 * Agent Graph Builder
 * Constructs the LangGraph workflow that orchestrates the agent's reasoning loop:
 *
 *   User Input → Planner → Executor → [Tool Runner → Executor]* → Response
 *
 * The graph supports multi-step reasoning with configurable iteration limits.
 */

import { StateGraph } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { initializeNodes, plannerNode, executorNode, toolRunnerNode } from "./nodes.js";
import { loadConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";

/**
 * Routing function: decides whether to continue to tools or end.
 * @param {object} state - Current agent state
 * @returns {string} Next node name or "__end__"
 */
function shouldContinue(state) {
  const messages = state.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const config = loadConfig();
  const maxIterations = config.agent.maxIterations || 10;

  // Safety: stop if too many tool calls
  if (state.toolCallCount >= maxIterations) {
    logger.warn(`Reached max tool iterations (${maxIterations}). Stopping.`);
    return "__end__";
  }

  // If the LLM wants to call tools, route to tool runner
  if (lastMessage?.tool_calls?.length > 0) {
    return "tools";
  }

  // Otherwise, we're done
  return "__end__";
}

/**
 * Build and compile the agent graph.
 * @param {Array} tools - LangChain tool instances to bind
 * @param {object} [options]
 * @param {boolean} [options.enableMemory=true] - Whether to enable conversation memory
 * @returns {{ app: CompiledGraph, checkpointer: MemorySaver|undefined }}
 */
export function buildAgentGraph(tools, options = {}) {
  const { enableMemory = true } = options;

  // Initialize the node functions with tools
  initializeNodes(tools);

  logger.debug("Building agent graph...");

  const graph = new StateGraph(AgentState)
    // Node definitions
    .addNode("planner", plannerNode)
    .addNode("executor", executorNode)
    .addNode("tools", toolRunnerNode)

    // Edge definitions: the workflow
    .addEdge("__start__", "planner")       // Start → Planner
    .addEdge("planner", "executor")         // Planner → Executor
    .addConditionalEdges("executor", shouldContinue, {
      tools: "tools",                       // Executor → Tools (if tool calls)
      __end__: "__end__",                   // Executor → End (if final response)
    })
    .addEdge("tools", "executor");          // Tools → Executor (loop back)

  // Compile with optional memory
  const checkpointer = enableMemory ? new MemorySaver() : undefined;
  const app = graph.compile({ checkpointer });

  logger.debug("Agent graph compiled successfully.");

  return { app, checkpointer };
}
