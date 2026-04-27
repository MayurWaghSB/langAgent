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
import dotenv from "dotenv";
import chalk from "chalk";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { askCommand } from "./commands/ask.js";
import { explainCommand } from "./commands/explain.js";
import { debugCommand } from "./commands/debug.js";
import { generateCommand } from "./commands/generate.js";
import { chatCommand } from "./commands/chat.js";
import { printHeader } from "../utils/format.js";

// Load environment variables from multiple locations (first found wins)
// 1. Current working directory .env (local project)
// 2. User home directory ~/.dev-agent/.env (global install)
const homeEnv = resolve(homedir(), ".dev-agent", ".env");
dotenv.config(); // try cwd first
if (!process.env.GROQ_API_KEY && existsSync(homeEnv)) {
  dotenv.config({ path: homeEnv });
}

const program = new Command();

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
    const question = questionParts.join(" ");
    await askCommand(question, options);
  });

// ── explain ──────────────────────────────────────
program
  .command("explain <file>")
  .description("Explain a source code file")
  .option("-p, --profile <profile>", "Config profile", "default")
  .action(async (file, options) => {
    await explainCommand(file, options);
  });

// ── debug ────────────────────────────────────────
program
  .command("debug <file>")
  .description("Debug an error log file")
  .option("-p, --profile <profile>", "Config profile", "default")
  .action(async (file, options) => {
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
    const description = descriptionParts.join(" ");
    await generateCommand(type, description, options);
  });

// ── chat ─────────────────────────────────────────
program
  .command("chat")
  .description("Start an interactive chat session")
  .option("-p, --profile <profile>", "Config profile", "default")
  .action(async (options) => {
    printHeader("Dev-Agent Interactive Chat");
    console.log(chalk.gray('  Type your message and press Enter. Type "exit" or "quit" to leave.\n'));
    await chatCommand(options);
  });

// ── setup ────────────────────────────────────────
program
  .command("setup")
  .description("Configure API keys (creates ~/.dev-agent/.env)")
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
