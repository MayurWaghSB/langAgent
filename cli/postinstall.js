/**
 * Postinstall Script
 * Runs after `npm install -g dev-agent`.
 * Shows a welcome message with setup instructions.
 */

import chalk from "chalk";

console.log("");
console.log(chalk.cyan("  ╔══════════════════════════════════════╗"));
console.log(chalk.cyan("  ║") + chalk.white("   🤖 Dev-Agent installed!             ") + chalk.cyan("║"));
console.log(chalk.cyan("  ╚══════════════════════════════════════╝"));
console.log("");
console.log(chalk.white("  Quick start:"));
console.log(chalk.gray("    1. Run setup to configure API keys:"));
console.log(chalk.green("       dev-agent setup"));
console.log("");
console.log(chalk.gray("    2. Start using it:"));
console.log(chalk.green('       dev-agent ask "What is a closure?"'));
console.log(chalk.green("       dev-agent chat"));
console.log("");
