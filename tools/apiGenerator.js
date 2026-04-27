/**
 * API Generator Tool
 * Generates boilerplate API code based on a description and framework.
 * Provides structured prompts for the LLM to generate high-quality API code.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Build a detailed prompt for API generation.
 * @param {string} framework
 * @param {string} description
 * @param {string} style
 * @returns {string}
 */
function buildApiPrompt(framework, description, style) {
  const frameworkGuides = {
    express: {
      name: "Express.js",
      structure: "router-based with middleware",
      example: "const router = express.Router();",
    },
    fastify: {
      name: "Fastify",
      structure: "plugin-based with schema validation",
      example: "fastify.register(async function(fastify) { ... });",
    },
    koa: {
      name: "Koa",
      structure: "middleware-based with ctx",
      example: "router.get('/', async (ctx) => { ... });",
    },
    hono: {
      name: "Hono",
      structure: "lightweight with Web Standard APIs",
      example: "app.get('/', (c) => c.json({ ... }));",
    },
  };

  const fw = frameworkGuides[framework] || frameworkGuides.express;

  return [
    `Generate a production-ready ${fw.name} API for: "${description}"`,
    "",
    `Framework: ${fw.name} (${fw.structure})`,
    `Code style: ${style}`,
    "",
    "Requirements:",
    "- Include proper error handling with try/catch",
    "- Add input validation",
    "- Use async/await",
    "- Include JSDoc comments",
    "- Follow RESTful conventions",
    "- Include appropriate HTTP status codes",
    "- Add basic security headers where relevant",
    "",
    "Generate the following:",
    "1. Route handler(s) with full CRUD operations where applicable",
    "2. Input validation middleware or schema",
    "3. Error handling middleware",
    "4. Brief usage instructions as comments",
  ].join("\n");
}

const apiGeneratorTool = tool(
  async ({ framework, description, style }) => {
    const prompt = buildApiPrompt(framework, description, style);

    return [
      `API Generation Request`,
      "═".repeat(50),
      `Framework: ${framework}`,
      `Description: ${description}`,
      `Style: ${style}`,
      "",
      "─".repeat(50),
      "Generation Prompt (for LLM):",
      "",
      prompt,
    ].join("\n");
  },
  {
    name: "api_generator",
    description:
      "Generate boilerplate API code for a given framework and description. Use when the user asks to generate an API, endpoint, or server code.",
    schema: z.object({
      framework: z
        .enum(["express", "fastify", "koa", "hono"])
        .default("express")
        .describe("The API framework to generate code for"),
      description: z.string().describe("Description of the API to generate (e.g., 'user authentication with JWT')"),
      style: z
        .enum(["modular", "minimal", "full"])
        .default("modular")
        .describe("Code style: 'modular' (separated concerns), 'minimal' (single file), 'full' (complete project)"),
    }),
  }
);

export default apiGeneratorTool;
