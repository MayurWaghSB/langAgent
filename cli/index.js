#!/usr/bin/env node

/**
 * Dev-Agent CLI Entry Point
 * Parses commands and routes to the appropriate handler.
 *
 * Usage:
 *   dev-agent ask "What is closure in JavaScript?"
 *   dev-agent explain ./file.js
 *   dev-agent debug error.log
 *   dev-agent generate api "user authentication in express"
 *   dev-agent chat
 */

import { Command } from "commander";
import chalk from "chalk";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { askCommand } from "./commands/ask.js";
import { explainCommand } from "./commands/explain.js";
import { debugCommand } from "./commands/debug.js";
import { generateCommand } from "./commands/generate.js";
import { chatCommand } from "./commands/chat.js";
import { printHeader } from "../utils/format.js";

// Load API keys from ~/.dev-agent/.env (created by `dev-agent setup`)
const envPath = resolve(homedir(), ".dev-agent", ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const program = new Command();

// Check if API keys are configured before running commands
function checkKeys() {
  if (!process.env.GROQ_API_KEY) {
    console.log(chalk.yellow("\n  ⚠ API keys not configured. Run setup first:\n"));
    console.log(chalk.green("    dev-agent setup\n"));
    process.exit(1);
  }
}

program
  .name("dev-agent")
  .description("AI-powered CLI tool for developers — ask, explain, debug, generate, and chat")
  .version("1.0.0");

// ── ask ──────────────────────────────────────────
program
  .command("ask <question...>")
  .description("Ask a technical question")
  .option("-p, --profile <profile>", "Config profile (default, backend, frontend, devops)", "default")
  .action(async (questionParts, options) => {
    checkKeys();
    const question = questionParts.join(" ");
    await askCommand(question, options);
  });

// ── explain ──────────────────────────────────────
program
  .command("explain <file>")
  .description("Explain a source code file")
  .option("-p, --profile <profile>", "Config profile", "default")
  .action(async (file, options) => {
    checkKeys();
    await explainCommand(file, options);
  });

// ── debug ────────────────────────────────────────
program
  .command("debug <file>")
  .description("Debug an error log file")
  .option("-p, --profile <profile>", "Config profile", "default")
  .action(async (file, options) => {
    checkKeys();
    await debugCommand(file, options);
  });

// ── generate ─────────────────────────────────────
program
  .command("generate <type> <description...>")
  .description("Generate code (e.g., generate api \"user auth in express\")")
  .option("-f, --framework <framework>", "Framework: express, fastify, koa, hono", "express")
  .option("-s, --style <style>", "Style: modular, minimal, full", "modular")
  .option("-p, --profile <profile>", "Config profile", "default")
  .action(async (type, descriptionParts, options) => {
    checkKeys();
    const description = descriptionParts.join(" ");
    await generateCommand(type, description, options);
  });

// ── chat ─────────────────────────────────────────
program
  .command("chat")
  .description("Start an interactive chat session")
  .option("-p, --profile <profile>", "Config profile", "default")
  .action(async (options) => {
    checkKeys();
    printHeader("Dev-Agent Interactive Chat");
    console.log(chalk.gray('  Type your message and press Enter. Type "exit" or "quit" to leave.\n'));
    await chatCommand(options);
  });

// ── setup ────────────────────────────────────────
program
  .command("setup")
  .description("Configure API keys (one-time setup)")
  .action(async () => {
    const { setupCommand } = await import("./commands/setup.js");
    await setupCommand();
  });

// ── Default: show help ───────────────────────────
program.action(() => {
  program.help();
});

// ── Error handling ───────────────────────────────
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error.code === "commander.helpDisplayed" || error.code === "commander.version") {
    process.exit(0);
  }
  if (error.code === "commander.missingArgument" || error.code === "commander.unknownCommand") {
    // Commander already printed the error
    process.exit(1);
  }
  console.error(chalk.red(`\n  Error: ${error.message}\n`));
  process.exit(1);
}
