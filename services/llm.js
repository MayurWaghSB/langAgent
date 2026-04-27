/**
 * LLM Service Layer
 * Provides an abstracted interface over multiple LLM providers.
 * Currently supports Groq (default). Designed for easy extension to OpenAI, Ollama, Claude.
 */

import { ChatGroq } from "@langchain/groq";
import { loadConfig } from "../config/index.js";
import { LLMError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

/** @type {Map<string, object>} Cache of initialized LLM instances keyed by provider+model */
const llmCache = new Map();

/**
 * Factory: create an LLM provider instance based on config.
 * @param {object} [overrides] - Override config values
 * @param {string} [overrides.provider]
 * @param {string} [overrides.model]
 * @param {number} [overrides.temperature]
 * @returns {import("@langchain/core/language_models/chat_models").BaseChatModel}
 */
export function createLLM(overrides = {}) {
  const config = loadConfig();
  const provider = overrides.provider || config.llm.provider;
  const model = overrides.model || config.llm.model;
  const temperature = overrides.temperature ?? config.llm.temperature;

  const cacheKey = `${provider}:${model}:${temperature}`;
  if (llmCache.has(cacheKey)) {
    return llmCache.get(cacheKey);
  }

  logger.debug(`Initializing LLM: provider=${provider}, model=${model}`);

  let llm;

  switch (provider) {
    case "groq":
      if (!process.env.GROQ_API_KEY) {
        throw new LLMError("GROQ_API_KEY is not set in environment variables.");
      }
      llm = new ChatGroq({
        model,
        apiKey: process.env.GROQ_API_KEY,
        temperature,
        maxTokens: config.llm.maxTokens,
      });
      break;

    // ----- Extension points for additional providers -----
    // case "openai":
    //   llm = new ChatOpenAI({ model, apiKey: process.env.OPENAI_API_KEY, temperature });
    //   break;
    // case "ollama":
    //   llm = new ChatOllama({ model, baseUrl: process.env.OLLAMA_URL || "http://localhost:11434" });
    //   break;
    // case "claude":
    //   llm = new ChatAnthropic({ model, apiKey: process.env.ANTHROPIC_API_KEY, temperature });
    //   break;

    default:
      throw new LLMError(`Unsupported LLM provider: "${provider}". Supported: groq`);
  }

  llmCache.set(cacheKey, llm);
  return llm;
}

/**
 * Create an LLM instance with tools bound.
 * @param {Array} tools - LangChain-compatible tool instances
 * @param {object} [overrides] - LLM config overrides
 * @returns {import("@langchain/core/language_models/chat_models").BaseChatModel}
 */
export function createLLMWithTools(tools, overrides = {}) {
  const llm = createLLM(overrides);
  if (tools && tools.length > 0) {
    return llm.bindTools(tools);
  }
  return llm;
}

/**
 * Simple one-shot invoke (no agent loop, no tools).
 * Useful for quick completions outside the agent workflow.
 * @param {string} prompt - The user prompt
 * @param {string} [systemPrompt] - Optional system prompt
 * @returns {Promise<string>} The LLM response content
 */
export async function quickInvoke(prompt, systemPrompt) {
  const llm = createLLM();
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  try {
    const response = await llm.invoke(messages);
    return response.content;
  } catch (error) {
    throw new LLMError(`LLM invocation failed: ${error.message}`, { originalError: error.message });
  }
}
