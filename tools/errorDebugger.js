/**
 * Error Debugger Tool
 * Reads error/log files and extracts error patterns, stack traces,
 * and contextual information to help the LLM diagnose issues.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Extract error patterns from log content.
 * @param {string} content - Log file content
 * @returns {object} Extracted error information
 */
function extractErrors(content) {
  const lines = content.split("\n");
  const errors = [];
  const warnings = [];
  const stackTraces = [];

  let inStackTrace = false;
  let currentStack = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const lower = line.toLowerCase();

    // Detect stack trace blocks
    if (line.match(/^\s+at\s+/) || line.match(/^\s+\^/)) {
      inStackTrace = true;
      currentStack.push({ line: lineNum, content: line });
      continue;
    }

    if (inStackTrace) {
      stackTraces.push([...currentStack]);
      currentStack = [];
      inStackTrace = false;
    }

    // Error patterns
    if (lower.includes("error") || lower.includes("exception") || lower.includes("fatal") || lower.includes("failed")) {
      errors.push({ line: lineNum, content: line.trim().slice(0, 200) });
    }

    // Warning patterns
    if (lower.includes("warn") || lower.includes("deprecated")) {
      warnings.push({ line: lineNum, content: line.trim().slice(0, 200) });
    }
  }

  // Flush any remaining stack trace
  if (currentStack.length > 0) {
    stackTraces.push(currentStack);
  }

  return { errors, warnings, stackTraces, totalLines: lines.length };
}

/**
 * Format extracted errors into a readable report.
 * @param {object} extracted
 * @param {string} filePath
 * @returns {string}
 */
function formatErrorReport(extracted, filePath) {
  const parts = [`Error Analysis: ${filePath}`, "═".repeat(50)];

  parts.push(`\nTotal lines scanned: ${extracted.totalLines}`);
  parts.push(`Errors found: ${extracted.errors.length}`);
  parts.push(`Warnings found: ${extracted.warnings.length}`);
  parts.push(`Stack traces found: ${extracted.stackTraces.length}`);

  if (extracted.errors.length > 0) {
    parts.push(`\n🔴 Errors:`);
    extracted.errors.slice(0, 20).forEach((err) => {
      parts.push(`   L${err.line}: ${err.content}`);
    });
    if (extracted.errors.length > 20) {
      parts.push(`   ... and ${extracted.errors.length - 20} more errors`);
    }
  }

  if (extracted.stackTraces.length > 0) {
    parts.push(`\n📚 Stack Traces:`);
    extracted.stackTraces.slice(0, 5).forEach((stack, idx) => {
      parts.push(`   Stack #${idx + 1}:`);
      stack.forEach((frame) => parts.push(`     ${frame.content}`));
    });
  }

  if (extracted.warnings.length > 0) {
    parts.push(`\n🟡 Warnings:`);
    extracted.warnings.slice(0, 10).forEach((warn) => {
      parts.push(`   L${warn.line}: ${warn.content}`);
    });
  }

  return parts.join("\n");
}

const errorDebuggerTool = tool(
  async ({ filePath, errorText }) => {
    // If raw error text is provided directly, analyze it
    if (errorText) {
      const extracted = extractErrors(errorText);
      return formatErrorReport(extracted, "<inline error>");
    }

    // Otherwise read from file
    const absPath = resolve(process.cwd(), filePath || "");

    try {
      statSync(absPath);
    } catch {
      return `Error: File not found at "${filePath}". Provide a valid log file path or paste the error text directly.`;
    }

    const content = readFileSync(absPath, "utf-8");
    const extracted = extractErrors(content);
    const report = formatErrorReport(extracted, filePath);

    // Also include the raw content (truncated) for LLM context
    const truncated = content.length > 5000 ? content.slice(-5000) + "\n\n... (truncated, showing last 5000 chars)" : content;

    return `${report}\n\n${"─".repeat(50)}\nRaw Log (for context):\n${truncated}`;
  },
  {
    name: "error_debugger",
    description:
      "Analyze error logs and stack traces to help debug issues. Reads a log file or accepts raw error text, extracts errors, warnings, and stack traces.",
    schema: z.object({
      filePath: z.string().optional().describe("Path to the error/log file to analyze"),
      errorText: z.string().optional().describe("Raw error text to analyze (alternative to filePath)"),
    }),
  }
);

export default errorDebuggerTool;
