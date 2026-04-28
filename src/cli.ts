#!/usr/bin/env node

/**
 * Command-line interface for the senior engineer agent.
 */

import { run } from "./runner.js";

// ── Argument parsing ─────────────────────────────────────────

function printUsage(): void {
  console.log(`
Usage: senior-engineer [options] "<task>"

Options:
  --max-iterations <n>   Maximum refactor iterations (default: 3)
  --verbose, -v          Enable verbose logging
  --help, -h             Show this help message

Examples:
  senior-engineer "Write a Python LRU cache with O(1) get and put"
  senior-engineer --max-iterations 5 "Build a REST API rate limiter in Go"
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  let maxIterations = 3;
  let task = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--max-iterations" && i + 1 < args.length) {
      maxIterations = parseInt(args[++i], 10);
      if (isNaN(maxIterations) || maxIterations < 1) {
        console.error("Error: --max-iterations must be a positive integer.");
        process.exit(1);
      }
    } else if (arg === "--verbose" || arg === "-v") {
      // Verbose mode — LangChain respects LANGCHAIN_VERBOSE
      process.env.LANGCHAIN_VERBOSE = "true";
    } else if (!arg.startsWith("-")) {
      task = arg;
    }
  }

  if (!task) {
    console.error("Error: Task description is required.");
    printUsage();
    process.exit(1);
  }

  try {
    const result = await run(task, { maxIterations });

    const sep = "=".repeat(72);
    console.log(`\n${sep}`);
    console.log(`Language       : ${result.language}`);
    console.log(`Review verdict : ${result.reviewVerdict}`);
    console.log(`Iterations     : ${result.iterations}`);
    console.log(`Issues left    : ${result.issuesRemaining}`);
    console.log(sep);

    console.log("\n--- Architecture Plan ---");
    console.log(result.architecturePlan);

    console.log("\n--- Generated Code ---");
    console.log(result.code);

    console.log("\n--- Generated Tests ---");
    console.log(result.tests);
  } catch (error) {
    console.error("Agent failed:", error);
    process.exit(1);
  }
}

main();
