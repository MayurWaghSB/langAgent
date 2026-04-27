/**
 * Ask Command
 * Handles: dev-agent ask "What is closure in JavaScript?"
 * Routes a technical question to the agent for a direct answer.
 */

import ora from "ora";
import { initAgent, invokeAgent } from "../../agent/index.js";
import { printResponse } from "../../utils/format.js";
import { formatError } from "../../utils/errors.js";
import chalk from "chalk";

/**
 * Execute the ask command.
 * @param {string} question - The user's question
 * @param {object} options - CLI options
 */
export async function askCommand(question, options = {}) {
  const spinner = ora({ text: "Thinking...", color: "cyan" }).start();

  try {
    await initAgent({ profile: options.profile });
    spinner.text = "Generating answer...";

    const { content } = await invokeAgent(question, { taskType: "ask" });

    spinner.stop();
    printResponse(content);
  } catch (error) {
    spinner.fail("Failed to get answer.");
    console.error(chalk.red(`  ${formatError(error)}`));
    process.exit(1);
  }
}
