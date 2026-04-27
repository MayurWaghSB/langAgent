/**
 * Agent Graph Nodes
 * Defines the individual processing nodes used in the LangGraph workflow:
 * - Planner: Prepares the system prompt and context
 * - Executor: Invokes the LLM with tool bindings
 * - ToolRunner: Executes selected tools
 */

import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { createLLMWithTools } from "../services/llm.js";
import { loadConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";

/** @type {ReturnType<typeof createLLMWithTools>|null} */
let boundLLM = null;

/** @type {ToolNode|null} */
let toolNode = null;

/**
 * Initialize the nodes with the given tools.
 * Must be called before the graph is compiled.
 * @param {Array} tools - LangChain tool instances
 */
export function initializeNodes(tools) {
  boundLLM = createLLMWithTools(tools);
  toolNode = new ToolNode(tools);
}

/**
 * Planner Node
 * Injects the system prompt and task-specific context into the message history.
 * Runs once at the start of each invocation.
 */
export async function plannerNode(state) {
  logger.step("Planner", `Task: ${state.taskType}`);

  const config = loadConfig();
  const systemPrompt = config.agent.systemPrompt;

  // Build task-specific instructions
  const taskInstructions = {
    ask: "Answer the developer's question clearly and concisely. Provide code examples when helpful.",
    explain: "Explain the provided code thoroughly. Cover what it does, how it works, and any notable patterns or issues.",
    debug: "Analyze the error information carefully. Identify the root cause, explain why it happened, and provide a fix.",
    generate: "Generate production-quality code based on the request. Include error handling, validation, and comments.",
    chat: "Engage in a helpful technical conversation. Use tools when needed to provide accurate answers.",
  };

  const instruction = taskInstructions[state.taskType] || taskInstructions.chat;

  // Only inject system message if not already present
  const hasSystem = state.messages.some((m) => m._getType?.() === "system" || m.role === "system");

  if (!hasSystem) {
    const systemMsg = new SystemMessage(`${systemPrompt}\n\nTask instruction: ${instruction}`);
    return {
      messages: [systemMsg],
      currentStep: "planning",
    };
  }

  return { currentStep: "planning" };
}

/**
 * Executor Node
 * Invokes the LLM with the current message history and bound tools.
 * The LLM decides whether to call a tool or produce a final response.
 */
export async function executorNode(state) {
  logger.step("Executor", "Invoking LLM...");

  if (!boundLLM) {
    throw new Error("Nodes not initialized. Call initializeNodes() first.");
  }

  const response = await boundLLM.invoke(state.messages);

  // Log tool calls if any
  if (response.tool_calls?.length > 0) {
    response.tool_calls.forEach((tc) => {
      logger.tool(tc.name, JSON.stringify(tc.args).slice(0, 100));
    });
  }

  return {
    messages: [response],
    currentStep: "executing",
    toolCallCount: state.toolCallCount + (response.tool_calls?.length || 0),
  };
}

/**
 * Tool Runner Node
 * Executes the tools selected by the LLM and returns results.
 */
export async function toolRunnerNode(state) {
  logger.step("Tool Runner", "Executing tools...");

  if (!toolNode) {
    throw new Error("Nodes not initialized. Call initializeNodes() first.");
  }

  const result = await toolNode.invoke(state);
  return {
    messages: result.messages,
    currentStep: "tool_execution",
  };
}
