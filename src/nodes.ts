/**
 * Graph node implementations for the senior engineer agent.
 *
 * Each exported function is a LangGraph node. It receives the current
 * AgentState, calls the LLM, and returns a partial state update.
 */

import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getLLM } from "./config.js";
import {
  SYSTEM_PROMPT,
  analyzePrompt,
  planPrompt,
  codeGenerationPrompt,
  testGenerationPrompt,
  reviewPrompt,
  refactorPrompt,
} from "./prompts.js";
import {
  type AgentState,
  type CodeIssue,
  TaskComplexity,
  ReviewVerdict,
} from "./state.js";

// ── Helpers ──────────────────────────────────────────────────

function parseJSON(text: string): Record<string, unknown> {
  // Strip markdown fences if the model wrapped the response.
  const cleaned = text
    .replace(/```(?:json)?\s*/g, "")
    .trim()
    .replace(/`+$/, "");
  return JSON.parse(cleaned);
}

function extractCodeBlock(text: string): string {
  const match = text.match(/```\w*\n([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

async function invokeLLM(system: string, user: string): Promise<string> {
  const llm = await getLLM();
  const response = await llm.invoke([
    new SystemMessage(system),
    new HumanMessage(user),
  ]);
  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}

function isValidComplexity(value: string): value is TaskComplexity {
  return Object.values(TaskComplexity).includes(value as TaskComplexity);
}

function formatList(items: string[], prefix = "- "): string {
  return items.length > 0
    ? items.map((item) => `${prefix}${item}`).join("\n")
    : `${prefix}(none specified)`;
}

// ── Nodes ────────────────────────────────────────────────────

export async function analyzeTask(
  state: AgentState,
): Promise<Partial<AgentState>> {
  console.log("Node: analyzeTask");

  const prompt = analyzePrompt(state.taskDescription);
  const raw = await invokeLLM(SYSTEM_PROMPT, prompt);

  let data: Record<string, unknown> = {};
  try {
    data = parseJSON(raw);
  } catch {
    console.warn("Failed to parse analysis JSON, using defaults.");
  }

  const complexityRaw = (data.complexity as string) ?? "simple";
  const complexity = isValidComplexity(complexityRaw)
    ? complexityRaw
    : TaskComplexity.SIMPLE;

  const language = (data.programming_language as string) ?? "python";

  return {
    programmingLanguage: language,
    taskComplexity: complexity,
    requirements: (data.requirements as string[]) ?? [],
    constraints: (data.constraints as string[]) ?? [],
    messages: [
      new AIMessage(
        `Analysis complete. Language: ${language}, Complexity: ${complexityRaw}`,
      ),
    ],
  };
}

export async function planApproach(
  state: AgentState,
): Promise<Partial<AgentState>> {
  console.log("Node: planApproach");

  const prompt = planPrompt({
    taskDescription: state.taskDescription,
    programmingLanguage: state.programmingLanguage,
    taskComplexity: state.taskComplexity,
    requirements: formatList(state.requirements),
    constraints: formatList(state.constraints),
  });
  const raw = await invokeLLM(SYSTEM_PROMPT, prompt);

  let data: Record<string, unknown> = {};
  try {
    data = parseJSON(raw);
  } catch {
    console.warn("Failed to parse plan JSON, using raw text.");
    data = {
      architecture_plan: raw,
      implementation_steps: [],
      design_patterns: [],
    };
  }

  return {
    architecturePlan: (data.architecture_plan as string) ?? "",
    implementationSteps: (data.implementation_steps as string[]) ?? [],
    designPatterns: (data.design_patterns as string[]) ?? [],
    messages: [new AIMessage("Planning complete.")],
  };
}

export async function generateCode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  console.log(`Node: generateCode (iteration ${state.iteration})`);

  const steps = state.implementationSteps
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");

  const prompt = codeGenerationPrompt({
    programmingLanguage: state.programmingLanguage,
    taskDescription: state.taskDescription,
    architecturePlan: state.architecturePlan,
    implementationSteps: steps,
    designPatterns: state.designPatterns.join(", ") || "none",
  });
  const raw = await invokeLLM(SYSTEM_PROMPT, prompt);
  const code = extractCodeBlock(raw);

  return {
    generatedCode: code,
    messages: [new AIMessage("Code generation complete.")],
  };
}

export async function generateTests(
  state: AgentState,
): Promise<Partial<AgentState>> {
  console.log("Node: generateTests");

  const prompt = testGenerationPrompt({
    programmingLanguage: state.programmingLanguage,
    generatedCode: state.generatedCode,
    requirements: formatList(state.requirements),
  });
  const raw = await invokeLLM(SYSTEM_PROMPT, prompt);
  const testCode = extractCodeBlock(raw);

  return {
    testCode,
    messages: [new AIMessage("Test generation complete.")],
  };
}

export async function reviewCode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  console.log(`Node: reviewCode (iteration ${state.iteration})`);

  const prompt = reviewPrompt({
    programmingLanguage: state.programmingLanguage,
    generatedCode: state.generatedCode,
    testCode: state.testCode,
    requirements: formatList(state.requirements),
  });
  const raw = await invokeLLM(SYSTEM_PROMPT, prompt);

  let data: Record<string, unknown> = {};
  try {
    data = parseJSON(raw);
  } catch {
    console.warn("Failed to parse review JSON, assuming approved.");
    data = { verdict: "approved", issues: [] };
  }

  const verdictRaw = (data.verdict as string) ?? "approved";
  const verdict = Object.values(ReviewVerdict).includes(
    verdictRaw as ReviewVerdict,
  )
    ? (verdictRaw as ReviewVerdict)
    : ReviewVerdict.APPROVED;

  const rawIssues = (data.issues as Record<string, unknown>[]) ?? [];
  const issues: CodeIssue[] = rawIssues
    .filter((issue) => typeof issue === "object" && issue !== null)
    .map((issue) => ({
      severity: issue.severity as CodeIssue["severity"],
      category: issue.category as CodeIssue["category"],
      description: issue.description as string,
      lineHint: (issue.line_hint as string) ?? null,
      suggestion: (issue.suggestion as string) ?? null,
    }));

  return {
    reviewIssues: issues,
    reviewVerdict: verdict,
    messages: [
      new AIMessage(
        `Review complete. Verdict: ${verdict}, Issues: ${issues.length}`,
      ),
    ],
  };
}

export async function refactorCode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  console.log(`Node: refactorCode (iteration ${state.iteration})`);

  const issuesText =
    state.reviewIssues
      .map(
        (issue) =>
          `- [${issue.severity}/${issue.category}] ${issue.description}` +
          (issue.suggestion ? ` (suggestion: ${issue.suggestion})` : ""),
      )
      .join("\n") || "(no issues listed)";

  const prompt = refactorPrompt({
    programmingLanguage: state.programmingLanguage,
    generatedCode: state.generatedCode,
    reviewIssues: issuesText,
  });
  const raw = await invokeLLM(SYSTEM_PROMPT, prompt);
  const code = extractCodeBlock(raw);

  return {
    generatedCode: code,
    iteration: state.iteration + 1,
    reviewIssues: [],
    messages: [
      new AIMessage(
        `Refactoring complete (iteration ${state.iteration + 1}).`,
      ),
    ],
  };
}
