/**
 * Agent State Definitions
 * Defines the state schema used by the LangGraph agent workflow.
 * Extends MessagesAnnotation with additional metadata for multi-step reasoning.
 */

import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

/**
 * Extended agent state that tracks workflow metadata alongside messages.
 * - messages: The conversation message history (from MessagesAnnotation)
 * - toolCallCount: Number of tool calls made in this invocation
 * - currentStep: Human-readable label for the current workflow step
 * - taskType: The type of task being performed (ask, explain, debug, generate, chat)
 * - metadata: Arbitrary metadata passed from the CLI layer
 */
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,

  toolCallCount: Annotation({
    reducer: (current, update) => (update !== undefined ? update : current),
    default: () => 0,
  }),

  currentStep: Annotation({
    reducer: (_current, update) => update,
    default: () => "init",
  }),

  taskType: Annotation({
    reducer: (_current, update) => update,
    default: () => "chat",
  }),

  metadata: Annotation({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
});
