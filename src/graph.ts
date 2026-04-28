/**
 * LangGraph workflow definition for the senior engineer agent.
 *
 * The graph implements the following flow:
 *
 *   analyze_task ──► plan_approach ──► generate_code ──► generate_tests
 *                                                             │
 *                                                             ▼
 *                                                       review_code
 *                                                        │       │
 *                                             (approved) │       │ (needs_refactor & iterations left)
 *                                                        ▼       ▼
 *                                                       END   refactor_code ──► generate_tests
 *                                                                │
 *                                                                │ (max iterations reached)
 *                                                                ▼
 *                                                               END
 */

import { END, START, StateGraph } from "@langchain/langgraph";
import {
  analyzeTask,
  generateCode,
  generateTests,
  planApproach,
  refactorCode,
  reviewCode,
} from "./nodes.js";
import { AgentStateAnnotation, type AgentState, ReviewVerdict } from "./state.js";

// ── Conditional edge ─────────────────────────────────────────

function shouldRefactor(state: AgentState): "refactor_code" | "__end__" {
  if (state.reviewVerdict === ReviewVerdict.APPROVED) {
    console.log("Review approved — finishing.");
    return END;
  }

  if (state.iteration >= state.maxIterations) {
    console.log(`Max iterations (${state.maxIterations}) reached — finishing.`);
    return END;
  }

  console.log(`Review requires refactoring (iteration ${state.iteration}).`);
  return "refactor_code";
}

// ── Graph builder ────────────────────────────────────────────

export function buildGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    // Nodes
    .addNode("analyze_task", analyzeTask)
    .addNode("plan_approach", planApproach)
    .addNode("generate_code", generateCode)
    .addNode("generate_tests", generateTests)
    .addNode("review_code", reviewCode)
    .addNode("refactor_code", refactorCode)

    // Linear edges
    .addEdge(START, "analyze_task")
    .addEdge("analyze_task", "plan_approach")
    .addEdge("plan_approach", "generate_code")
    .addEdge("generate_code", "generate_tests")
    .addEdge("generate_tests", "review_code")

    // Conditional edge: review → refactor or end
    .addConditionalEdges("review_code", shouldRefactor, {
      refactor_code: "refactor_code",
      [END]: END,
    })

    // After refactoring, re-generate tests and re-review
    .addEdge("refactor_code", "generate_tests");

  return workflow.compile();
}
