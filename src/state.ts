/**
 * Graph state definitions for the senior engineer agent.
 *
 * The state flows through the graph and accumulates context at each node
 * so that downstream nodes can make informed decisions.
 */

import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// ── Enums ────────────────────────────────────────────────────

export const TaskComplexity = {
  TRIVIAL: "trivial",
  SIMPLE: "simple",
  MODERATE: "moderate",
  COMPLEX: "complex",
} as const;

export type TaskComplexity =
  (typeof TaskComplexity)[keyof typeof TaskComplexity];

export const ReviewVerdict = {
  APPROVED: "approved",
  NEEDS_REFACTOR: "needs_refactor",
  REJECTED: "rejected",
} as const;

export type ReviewVerdict = (typeof ReviewVerdict)[keyof typeof ReviewVerdict];

// ── Code Issue ───────────────────────────────────────────────

export interface CodeIssue {
  severity: "critical" | "major" | "minor" | "suggestion";
  category: "bug" | "security" | "performance" | "style" | "maintainability";
  description: string;
  lineHint?: string | null;
  suggestion?: string | null;
}

// ── Agent State (LangGraph Annotation) ───────────────────────

export const AgentStateAnnotation = Annotation.Root({
  // Conversation / LLM messages
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Task understanding
  taskDescription: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  programmingLanguage: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  taskComplexity: Annotation<TaskComplexity>({
    reducer: (_, b) => b,
    default: () => TaskComplexity.SIMPLE,
  }),
  requirements: Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),
  constraints: Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),

  // Planning
  architecturePlan: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  implementationSteps: Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),
  designPatterns: Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),

  // Code generation
  generatedCode: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  testCode: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),

  // Review
  reviewIssues: Annotation<CodeIssue[]>({ reducer: (_, b) => b, default: () => [] }),
  reviewVerdict: Annotation<ReviewVerdict>({
    reducer: (_, b) => b,
    default: () => ReviewVerdict.APPROVED,
  }),

  // Iteration control
  iteration: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  maxIterations: Annotation<number>({ reducer: (_, b) => b, default: () => 3 }),
});

export type AgentState = typeof AgentStateAnnotation.State;
