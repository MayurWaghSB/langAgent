/**
 * High-level runner that executes the senior engineer graph end-to-end.
 */

import { buildGraph } from "./graph.js";
import { ReviewVerdict } from "./state.js";

// ── Result type ──────────────────────────────────────────────

export interface RunResult {
  code: string;
  tests: string;
  language: string;
  reviewVerdict: string;
  iterations: number;
  architecturePlan: string;
  requirements: string[];
  issuesRemaining: number;
}

// ── Runner ───────────────────────────────────────────────────

export async function run(
  task: string,
  options: { maxIterations?: number } = {},
): Promise<RunResult> {
  const maxIterations = options.maxIterations ?? 3;
  const graph = buildGraph();

  console.log(
    `Starting senior engineer agent for task: ${task.slice(0, 120)}`,
  );

  const finalState = await graph.invoke({
    taskDescription: task,
    maxIterations,
  });

  const verdict =
    (finalState.reviewVerdict as string) ?? ReviewVerdict.APPROVED;

  return {
    code: (finalState.generatedCode as string) ?? "",
    tests: (finalState.testCode as string) ?? "",
    language: (finalState.programmingLanguage as string) ?? "",
    reviewVerdict: verdict,
    iterations: (finalState.iteration as number) ?? 0,
    architecturePlan: (finalState.architecturePlan as string) ?? "",
    requirements: (finalState.requirements as string[]) ?? [],
    issuesRemaining: ((finalState.reviewIssues as unknown[]) ?? []).length,
  };
}
