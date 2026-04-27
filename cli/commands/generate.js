/**
 * Generate Command
 * Handles: dev-agent generate api "user authentication in express"
 * Asks the agent to generate code based on a type and description.
 */

import ora from "ora";
import { initAgent, invokeAgent } from "../../agent/index.js";
import { printResponse } from "../../utils/format.js";
import { formatError } from "../../utils/errors.js";
import chalk from "chalk";

/** Map of generation types to prompt templates */
const GENERATION_TYPES = {
  api: (desc, opts) =>
    `Generate a production-ready ${opts.framework || "express"} API for: "${desc}". ` +
    `Style: ${opts.style || "modular"}. Include routes, validation, error handling, and comments.`,

  component: (desc) =>
    `Generate a React component for: "${desc}". Include props interface, proper state management, and accessibility attributes.`,

  model: (desc) =>
    `Generate a database model/schema for: "${desc}". Include field types, validation, indexes, and relationships.`,

  middleware: (desc, opts) =>
    `Generate ${opts.framework || "express"} middleware for: "${desc}". Include error handling and proper next() calls.`,

  test: (desc) =>
    `Generate comprehensive test cases for: "${desc}". Include unit tests, edge cases, and mock setup.`,
};

/**
 * Execute the generate command.
 * @param {string} type - Generation type (api, component, model, middleware, test)
 * @param {string} description - What to generate
 * @param {object} options - CLI options
 */
export async function generateCommand(type, description, options = {}) {
  const spinner = ora({ text: "Preparing generation...", color: "cyan" }).start();

  try {
    const typeLower = type.toLowerCase();
    const promptBuilder = GENERATION_TYPES[typeLower];

    if (!promptBuilder) {
      spinner.fail(`Unknown generation type: "${type}"`);
      console.log(chalk.gray(`  Available types: ${Object.keys(GENERATION_TYPES).join(", ")}`));
      process.exit(1);
    }

    spinner.text = "Initializing agent...";
    await initAgent({ profile: options.profile });

    spinner.text = `Generating ${type}...`;

    const prompt = promptBuilder(description, options);
    const { content } = await invokeAgent(prompt, {
      taskType: "generate",
      metadata: { generationType: typeLower, framework: options.framework },
    });

    spinner.stop();
    printResponse(content);
  } catch (error) {
    spinner.fail("Failed to generate code.");
    console.error(chalk.red(`  ${formatError(error)}`));
    process.exit(1);
  }
}
