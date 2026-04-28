/**
 * Configuration and LLM factory for the senior engineer agent.
 *
 * Supports multiple LLM providers via the LLM_PROVIDER env var:
 * - "groq"   — Free Groq API (default)
 * - "openai" — OpenAI API
 */

import "dotenv/config";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// ── Provider defaults ────────────────────────────────────────

interface ProviderConfig {
  model: string;
  apiKeyEnv: string;
}

const PROVIDER_DEFAULTS: Record<string, ProviderConfig> = {
  groq: {
    model: "llama-3.3-70b-versatile",
    apiKeyEnv: "GROQ_API_KEY",
  },
  openai: {
    model: "gpt-4o",
    apiKeyEnv: "OPENAI_API_KEY",
  },
};

const DEFAULT_PROVIDER = "groq";
const DEFAULT_TEMPERATURE = 0.2;

// ── Factory ──────────────────────────────────────────────────

export interface LLMOptions {
  model?: string;
  temperature?: number;
  provider?: string;
}

export async function getLLM(options: LLMOptions = {}): Promise<BaseChatModel> {
  const provider = (
    options.provider ?? process.env.LLM_PROVIDER ?? DEFAULT_PROVIDER
  ).toLowerCase();

  const defaults = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.groq;
  const model = options.model ?? process.env.LLM_MODEL ?? defaults.model;
  const temperature =
    options.temperature ??
    parseFloat(process.env.LLM_TEMPERATURE ?? String(DEFAULT_TEMPERATURE));

  if (provider === "groq") {
    const { ChatGroq } = await import("@langchain/groq");
    return new ChatGroq({
      model,
      temperature,
      apiKey: process.env[defaults.apiKeyEnv],
    });
  }

  // Default: OpenAI
  const { ChatOpenAI } = await import("@langchain/openai");
  return new ChatOpenAI({
    model,
    temperature,
  });
}
