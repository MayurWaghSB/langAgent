/**
 * Tests for individual graph nodes using a mocked LLM.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskComplexity, ReviewVerdict, type AgentState } from "../src/state.js";

// Mock the config module so nodes don't need a real API key.
vi.mock("../src/config.js", () => ({
  getLLM: vi.fn(),
}));

import { getLLM } from "../src/config.js";
import {
  analyzeTask,
  planApproach,
  generateCode,
  generateTests,
  reviewCode,
  refactorCode,
} from "../src/nodes.js";

// ── Helpers ──────────────────────────────────────────────────

function mockLLMResponse(content: string): void {
  const mockLLM = {
    invoke: vi.fn().mockResolvedValue({ content }),
  };
  vi.mocked(getLLM).mockResolvedValue(mockLLM as never);
}

function makeState(overrides: Partial<AgentState> = {}): AgentState {
  return {
    messages: [],
    taskDescription: "Build something",
    programmingLanguage: "python",
    taskComplexity: TaskComplexity.SIMPLE,
    requirements: [],
    constraints: [],
    architecturePlan: "",
    implementationSteps: [],
    designPatterns: [],
    generatedCode: "",
    testCode: "",
    reviewIssues: [],
    reviewVerdict: ReviewVerdict.APPROVED,
    iteration: 0,
    maxIterations: 3,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("analyzeTask", () => {
  it("parses valid JSON response", async () => {
    mockLLMResponse(
      JSON.stringify({
        programming_language: "rust",
        complexity: "complex",
        requirements: ["req1"],
        constraints: ["con1"],
      }),
    );

    const state = makeState({ taskDescription: "Build a web server in Rust" });
    const result = await analyzeTask(state);

    expect(result.programmingLanguage).toBe("rust");
    expect(result.taskComplexity).toBe(TaskComplexity.COMPLEX);
    expect(result.requirements).toEqual(["req1"]);
  });

  it("handles invalid JSON gracefully", async () => {
    mockLLMResponse("this is not json");

    const state = makeState({ taskDescription: "Do something" });
    const result = await analyzeTask(state);

    expect(result.programmingLanguage).toBe("python"); // default
  });
});

describe("planApproach", () => {
  it("parses plan JSON", async () => {
    mockLLMResponse(
      JSON.stringify({
        architecture_plan: "Modular design",
        implementation_steps: ["step1", "step2"],
        design_patterns: ["Factory"],
      }),
    );

    const state = makeState({
      taskComplexity: TaskComplexity.MODERATE,
    });
    const result = await planApproach(state);

    expect(result.architecturePlan).toBe("Modular design");
    expect(result.implementationSteps).toHaveLength(2);
  });
});

describe("generateCode", () => {
  it("extracts code block from response", async () => {
    mockLLMResponse("```python\nprint('hello')\n```");

    const state = makeState({
      taskDescription: "Print hello",
      architecturePlan: "Simple script",
    });
    const result = await generateCode(state);

    expect(result.generatedCode).toBe("print('hello')");
  });
});

describe("generateTests", () => {
  it("extracts test code block", async () => {
    mockLLMResponse("```python\ndef test_it():\n    assert True\n```");

    const state = makeState({ generatedCode: "x = 1" });
    const result = await generateTests(state);

    expect(result.testCode).toBe("def test_it():\n    assert True");
  });
});

describe("reviewCode", () => {
  it("parses approved review", async () => {
    mockLLMResponse(JSON.stringify({ verdict: "approved", issues: [] }));

    const state = makeState({
      generatedCode: "x = 1",
      testCode: "assert x == 1",
    });
    const result = await reviewCode(state);

    expect(result.reviewVerdict).toBe(ReviewVerdict.APPROVED);
    expect(result.reviewIssues).toEqual([]);
  });

  it("parses needs_refactor with issues", async () => {
    mockLLMResponse(
      JSON.stringify({
        verdict: "needs_refactor",
        issues: [
          {
            severity: "major",
            category: "bug",
            description: "Missing null check",
          },
        ],
      }),
    );

    const state = makeState({
      generatedCode: "x = 1",
      testCode: "assert x == 1",
    });
    const result = await reviewCode(state);

    expect(result.reviewVerdict).toBe(ReviewVerdict.NEEDS_REFACTOR);
    expect(result.reviewIssues).toHaveLength(1);
  });
});

describe("refactorCode", () => {
  it("increments iteration and returns refactored code", async () => {
    mockLLMResponse("```python\nprint('refactored')\n```");

    const state = makeState({
      generatedCode: "print('old')",
      iteration: 0,
    });
    const result = await refactorCode(state);

    expect(result.iteration).toBe(1);
    expect(result.generatedCode).toBe("print('refactored')");
  });
});
