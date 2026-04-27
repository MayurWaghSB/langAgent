/**
 * Chat Command
 * Handles: dev-agent chat
 * Starts an interactive REPL session with persistent conversation memory.
 */

import readline from "node:readline/promises";
import chalk from "chalk";
import { initAgent, invokeAgent, createThread } from "../../agent/index.js";
import { printResponse, printInfo } from "../../utils/format.js";
import { formatError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

/**
 * Execute the interactive chat command.
 * @param {object} options - CLI options
 */
export async function chatCommand(options = {}) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Initialize agent once (no spinner — it conflicts with readline)
  console.log(chalk.cyan("  ⏳ Initializing agent..."));
  try {
    await initAgent({ profile: options.profile, enableMemory: true });
    console.log(chalk.green("  ✔ Agent ready.\n"));
  } catch (error) {
    console.error(chalk.red(`  ✖ Failed to initialize: ${formatError(error)}`));
    rl.close();
    process.exit(1);
  }

  // Create a persistent thread for this session
  let threadId = createThread();
  printInfo("Session", threadId.slice(0, 8));
  printInfo("Profile", options.profile || "default");
  console.log(chalk.gray('  Commands: /clear (new session), /tools (list tools), /help'));
  console.log(chalk.gray('  Type "exit" to quit.\n'));

  // Chat loop
  while (true) {
    let userInput;
    try {
      userInput = await rl.question(chalk.green("You → "));
    } catch {
      // Handle Ctrl+C or closed input
      break;
    }

    const trimmed = userInput.trim();
    if (!trimmed) continue;

    // Meta commands
    if (trimmed === "exit" || trimmed === "quit" || trimmed === "/exit") {
      console.log(chalk.gray("\n  Goodbye! 👋\n"));
      break;
    }

    if (trimmed === "/clear") {
      threadId = createThread();
      console.log(chalk.gray(`  Session cleared. New session: ${threadId.slice(0, 8)}\n`));
      continue;
    }

    if (trimmed === "/tools") {
      const { getToolNames } = await import("../../tools/registry.js");
      console.log(chalk.cyan("\n  Available tools:"));
      getToolNames().forEach((name) => console.log(chalk.gray(`    • ${name}`)));
      console.log();
      continue;
    }

    if (trimmed === "/help") {
      console.log(chalk.cyan("\n  Chat Commands:"));
      console.log(chalk.gray("    /clear   — Start a new conversation"));
      console.log(chalk.gray("    /tools   — List available tools"));
      console.log(chalk.gray("    /help    — Show this help"));
      console.log(chalk.gray('    exit     — Leave the chat\n'));
      continue;
    }

    // Send to agent (use simple text indicator instead of ora spinner)
    console.log(chalk.gray("  ⏳ Thinking..."));
    try {
      const { content } = await invokeAgent(trimmed, {
        taskType: "chat",
        threadId,
      });
      console.log(chalk.cyan("\nAgent →"));
      printResponse(content);
    } catch (error) {
      console.error(chalk.red(`  ✖ ${formatError(error)}\n`));
    }
  }

  rl.close();
  logger.info("Chat session ended.");
}
