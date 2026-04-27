/**
 * Explain Command
 * Handles: dev-agent explain ./file.js
 * Reads a file and asks the agent to explain its contents.
 */

import ora from "ora";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { initAgent, invokeAgent } from "../../agent/index.js";
import { printResponse } from "../../utils/format.js";
import { formatError, FileError } from "../../utils/errors.js";
import chalk from "chalk";

/**
 * Execute the explain command.
 * @param {string} filePath - Path to the file to explain
 * @param {object} options - CLI options
 */
export async function explainCommand(filePath, options = {}) {
  const spinner = ora({ text: "Reading file...", color: "cyan" }).start();

  try {
    const absPath = resolve(process.cwd(), filePath);

    // Validate file exists
    try {
      statSync(absPath);
    } catch {
      throw new FileError(`File not found: "${filePath}"`, filePath);
    }

    const content = readFileSync(absPath, "utf-8");
    const lines = content.split("\n");

    spinner.text = "Initializing agent...";
    await initAgent({ profile: options.profile });

    spinner.text = "Analyzing code...";

    const prompt = [
      `Please explain the following code file in detail.`,
      `File: ${filePath} (${lines.length} lines)`,
      "",
      "```",
      content,
      "```",
      "",
      "Explain:",
      "1. What this code does (high-level purpose)",
      "2. How it works (key logic and flow)",
      "3. Notable patterns, libraries, or techniques used",
      "4. Any potential issues or improvements",
    ].join("\n");

    const { content: response } = await invokeAgent(prompt, { taskType: "explain" });

    spinner.stop();
    printResponse(response);
  } catch (error) {
    spinner.fail("Failed to explain file.");
    console.error(chalk.red(`  ${formatError(error)}`));
    process.exit(1);
  }
}
