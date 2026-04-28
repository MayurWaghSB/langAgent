/**
 * Tests for the AgentState and related types.
 */

import { describe, it, expect } from "vitest";
import {
  TaskComplexity,
  ReviewVerdict,
  type CodeIssue,
} from "../src/state.js";

describe("TaskComplexity", () => {
  it("has the expected values", () => {
    expect(TaskComplexity.TRIVIAL).toBe("trivial");
    expect(TaskComplexity.SIMPLE).toBe("simple");
    expect(TaskComplexity.MODERATE).toBe("moderate");
    expect(TaskComplexity.COMPLEX).toBe("complex");
  });
});

describe("ReviewVerdict", () => {
  it("has the expected values", () => {
    expect(ReviewVerdict.APPROVED).toBe("approved");
    expect(ReviewVerdict.NEEDS_REFACTOR).toBe("needs_refactor");
    expect(ReviewVerdict.REJECTED).toBe("rejected");
  });
});

describe("CodeIssue", () => {
  it("can be created with all fields", () => {
    const issue: CodeIssue = {
      severity: "major",
      category: "bug",
      description: "Off-by-one error in loop",
      lineHint: "line 42",
      suggestion: "Use i + 1 instead of i",
    };
    expect(issue.severity).toBe("major");
    expect(issue.category).toBe("bug");
    expect(issue.description).toBe("Off-by-one error in loop");
  });

  it("can be created with optional fields as null", () => {
    const issue: CodeIssue = {
      severity: "minor",
      category: "style",
      description: "Inconsistent naming",
      lineHint: null,
      suggestion: null,
    };
    expect(issue.lineHint).toBeNull();
    expect(issue.suggestion).toBeNull();
  });
});
