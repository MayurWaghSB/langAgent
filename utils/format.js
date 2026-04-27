/**
 * Output Formatting Utilities
 * Handles terminal output formatting, markdown rendering, and response display.
 */

import chalk from "chalk";

/**
 * Render a basic markdown-like string for terminal display.
 * Handles code blocks, inline code, bold, and headers.
 * @param {string} text - Markdown text
 * @returns {string} Formatted terminal string
 */
export function renderMarkdown(text) {
  if (!text) return "";

  let result = text;

  // Code blocks: ```lang\n...\n```
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const header = lang ? chalk.gray(`  ── ${lang} ──`) + "\n" : "";
    const formatted = code
      .split("\n")
      .map((line) => chalk.green(`  ${line}`))
      .join("\n");
    return `\n${header}${formatted}\n`;
  });

  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, (_match, code) => chalk.yellow(code));

  // Bold: **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, (_match, text) => chalk.bold(text));

  // Headers: ### Header
  result = result.replace(/^(#{1,3})\s+(.+)$/gm, (_match, hashes, text) => {
    if (hashes.length === 1) return chalk.bold.underline(text);
    if (hashes.length === 2) return chalk.bold(text);
    return chalk.italic(text);
  });

  return result;
}

/**
 * Print the agent's response with formatting.
 * @param {string} content - The response content
 */
export function printResponse(content) {
  console.log();
  console.log(renderMarkdown(content));
  console.log();
}

/**
 * Print a boxed header for section titles.
 * @param {string} title
 */
export function printHeader(title) {
  const line = "═".repeat(title.length + 4);
  console.log(chalk.cyan(`╔${line}╗`));
  console.log(chalk.cyan(`║  ${title}  ║`));
  console.log(chalk.cyan(`╚${line}╝`));
}

/**
 * Print a key-value info line.
 * @param {string} label
 * @param {string} value
 */
export function printInfo(label, value) {
  console.log(chalk.gray(`  ${label}: `) + chalk.white(value));
}
