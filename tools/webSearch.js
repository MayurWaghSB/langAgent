/**
 * Web Search Tool
 * Wraps Tavily search for web lookups.
 * Used when the agent needs current information from the internet.
 */

import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConfigValue } from "../config/index.js";

/**
 * Create the Tavily web search tool, or a fallback if the API key is missing.
 * @returns {import("@langchain/core/tools").StructuredTool}
 */
function createWebSearchTool() {
  if (!process.env.TAVILY_API_KEY) {
    return tool(
      async () => "Web search is not available. TAVILY_API_KEY is not configured in .env.",
      {
        name: "web_search",
        description: "Search the web for current information. Requires TAVILY_API_KEY to be set.",
        schema: z.object({ query: z.string().describe("The search query") }),
      }
    );
  }

  const config = getConfigValue("tools.tavily", {});

  return new TavilySearch({
    apiKey: process.env.TAVILY_API_KEY,
    maxResults: config.maxResults || 5,
    numRetries: 3,
    timeout: config.timeout || 10000,
  });
}

export default createWebSearchTool();
