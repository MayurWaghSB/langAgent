/**
 * Tests for the graph structure (not full execution — that requires an LLM).
 */

import { describe, it, expect } from "vitest";
import { buildGraph } from "../src/graph.js";

describe("buildGraph", () => {
  it("compiles without errors", () => {
    const graph = buildGraph();
    expect(graph).toBeDefined();
  });

  it("has expected nodes in the graph", () => {
    const graph = buildGraph();
    const graphDef = graph.getGraph();
    // LangGraph JS returns nodes as a Record<string, Node>.
    const nodeIds = Object.keys(graphDef.nodes);

    const expected = [
      "analyze_task",
      "plan_approach",
      "generate_code",
      "generate_tests",
      "review_code",
      "refactor_code",
    ];

    for (const name of expected) {
      expect(nodeIds).toContain(name);
    }
  });
});
