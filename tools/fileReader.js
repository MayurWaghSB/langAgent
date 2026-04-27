/**
 * File Reader Tool
 * Reads and returns the contents of local files.
 * Supports line numbers, size limits, and extension filtering.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readFileSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import { getConfigValue } from "../config/index.js";

const fileReaderTool = tool(
  async ({ filePath, includeLineNumbers }) => {
    const absPath = resolve(process.cwd(), filePath);

    // Validate file exists and check size
    let stats;
    try {
      stats = statSync(absPath);
    } catch {
      return `Error: File not found at "${filePath}". Please check the path and try again.`;
    }

    const maxSizeKB = getConfigValue("tools.fileReader.maxFileSizeKB", 500);
    if (stats.size > maxSizeKB * 1024) {
      return `Error: File "${filePath}" is too large (${(stats.size / 1024).toFixed(1)}KB). Maximum allowed: ${maxSizeKB}KB.`;
    }

    // Validate extension
    const ext = extname(absPath).toLowerCase();
    const supported = getConfigValue("tools.fileReader.supportedExtensions", []);
    if (supported.length > 0 && !supported.includes(ext)) {
      return `Error: Unsupported file type "${ext}". Supported: ${supported.join(", ")}`;
    }

    try {
      const content = readFileSync(absPath, "utf-8");
      if (includeLineNumbers) {
        const lines = content.split("\n");
        const numbered = lines.map((line, i) => `${String(i + 1).padStart(4)} │ ${line}`).join("\n");
        return `File: ${filePath}\nLines: ${lines.length}\n${"─".repeat(50)}\n${numbered}`;
      }
      return `File: ${filePath}\n${"─".repeat(50)}\n${content}`;
    } catch (error) {
      return `Error reading file "${filePath}": ${error.message}`;
    }
  },
  {
    name: "file_reader",
    description:
      "Read the contents of a local file. Use this when the user wants to view, explain, or analyze a file. Provide the relative or absolute file path.",
    schema: z.object({
      filePath: z.string().describe("Path to the file to read (relative to current working directory or absolute)"),
      includeLineNumbers: z.boolean().default(true).describe("Whether to include line numbers in the output"),
    }),
  }
);

export default fileReaderTool;
