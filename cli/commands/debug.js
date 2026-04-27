/**
 * Debug Command
 * Handles: dev-agent debug error.log
 * Reads an error/log file and asks the agent to diagnose the issues.
 */

import ora from "ora";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { initAgent, invokeAgent } from "../../agent/index.js";
import { printResponse } from "../../utils/format.js";
import { formatError, FileError } from "../../utils/errors.js";
import chalk from "chalk";

/**
 * Execute the debug command.
 * @param {string} filePath - Path to the error/log file
 * @param {object} options - CLI options
 */
export async function debugCommand(filePath, options = {}) {
  const spinner = ora({ text: "Reading log file...", color: "cyan" }).start();

  try {
    const absPath = resolve(process.cwd(), filePath);

    try {
      statSync(absPath);
    } catch {
      throw new FileError(`File not found: "${filePath}"`, filePath);
    }

    const content = readFileSync(absPath, "utf-8");

    // Truncate very large log files to the last portion
    const maxChars = 8000;
    const truncated =
      content.length > maxChars
        ? `... (truncated, showing last ${maxChars} characters)\n` + content.slice(-maxChars)
        : content;

    spinner.text = "Initializing agent...";
    await initAgent({ profile: options.profile });

    spinner.text = "Diagnosing errors...";

    const prompt = [
      `Please analyze the following error log and help me debug the issue.`,
      `File: ${filePath}`,
      "",
      "```",
      truncated,
      "```",
      "",
      "Please provide:",
      "1. Root cause analysis — what went wrong",
      "2. Explanation of the error/stack trace",
      "3. Step-by-step fix or solution",
      "4. How to prevent this in the future",
    ].join("\n");

    const { content: response } = await invokeAgent(prompt, { taskType: "debug" });

    spinner.stop();
    printResponse(response);
  } catch (error) {
    spinner.fail("Failed to debug file.");
    console.error(chalk.red(`  ${formatError(error)}`));
    process.exit(1);
  }
}
