/**
 * Code Analyzer Tool
 * Analyzes source code files and extracts structural information:
 * functions, classes, imports, exports, and complexity indicators.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readFileSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";

/**
 * Extract structural elements from JavaScript/TypeScript source code.
 * @param {string} content - File content
 * @returns {object} Extracted structure
 */
function analyzeJSStructure(content) {
  const lines = content.split("\n");
  const structure = {
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    variables: [],
    lineCount: lines.length,
    commentLines: 0,
    blankLines: 0,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (!line) {
      structure.blankLines++;
      continue;
    }
    if (line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) {
      structure.commentLines++;
    }

    // Imports
    if (line.startsWith("import ")) {
      structure.imports.push({ line: lineNum, statement: line.slice(0, 100) });
    }

    // Exports
    if (line.startsWith("export ")) {
      structure.exports.push({ line: lineNum, statement: line.slice(0, 100) });
    }

    // Functions (named, arrow, async)
    const funcMatch = line.match(
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/
    );
    if (funcMatch) {
      structure.functions.push({ name: funcMatch[1] || funcMatch[2], line: lineNum });
    }

    // Classes
    const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      structure.classes.push({ name: classMatch[1], line: lineNum });
    }

    // Top-level const/let/var (not inside functions — rough heuristic)
    const varMatch = line.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/);
    if (varMatch && !funcMatch) {
      structure.variables.push({ name: varMatch[1], line: lineNum });
    }
  }

  return structure;
}

/**
 * Format the analysis result into a readable string.
 * @param {object} structure
 * @param {string} filePath
 * @returns {string}
 */
function formatAnalysis(structure, filePath) {
  const parts = [`Code Analysis: ${filePath}`, "═".repeat(50)];

  parts.push(`\n📊 Statistics:`);
  parts.push(`   Total lines:   ${structure.lineCount}`);
  parts.push(`   Code lines:    ${structure.lineCount - structure.blankLines - structure.commentLines}`);
  parts.push(`   Comment lines: ${structure.commentLines}`);
  parts.push(`   Blank lines:   ${structure.blankLines}`);

  if (structure.imports.length > 0) {
    parts.push(`\n📦 Imports (${structure.imports.length}):`);
    structure.imports.forEach((imp) => parts.push(`   L${imp.line}: ${imp.statement}`));
  }

  if (structure.functions.length > 0) {
    parts.push(`\n⚡ Functions (${structure.functions.length}):`);
    structure.functions.forEach((fn) => parts.push(`   L${fn.line}: ${fn.name}()`));
  }

  if (structure.classes.length > 0) {
    parts.push(`\n🏗️  Classes (${structure.classes.length}):`);
    structure.classes.forEach((cls) => parts.push(`   L${cls.line}: ${cls.name}`));
  }

  if (structure.exports.length > 0) {
    parts.push(`\n📤 Exports (${structure.exports.length}):`);
    structure.exports.forEach((exp) => parts.push(`   L${exp.line}: ${exp.statement}`));
  }

  return parts.join("\n");
}

const codeAnalyzerTool = tool(
  async ({ filePath, analysisType }) => {
    const absPath = resolve(process.cwd(), filePath);

    try {
      statSync(absPath);
    } catch {
      return `Error: File not found at "${filePath}".`;
    }

    const ext = extname(absPath).toLowerCase();
    const content = readFileSync(absPath, "utf-8");

    if (analysisType === "structure") {
      if ([".js", ".ts", ".mjs", ".cjs", ".jsx", ".tsx"].includes(ext)) {
        const structure = analyzeJSStructure(content);
        return formatAnalysis(structure, filePath);
      }
      return `Structural analysis is currently optimized for JavaScript/TypeScript files. File type: ${ext}\n\nFile content (${content.split("\n").length} lines):\n${content}`;
    }

    // Default: return content with metadata for LLM analysis
    const lines = content.split("\n");
    return `File: ${filePath} (${ext}, ${lines.length} lines)\n${"─".repeat(50)}\n${content}`;
  },
  {
    name: "code_analyzer",
    description:
      "Analyze a source code file's structure, extracting functions, classes, imports, exports, and statistics. Use this when the user asks to explain or analyze code.",
    schema: z.object({
      filePath: z.string().describe("Path to the source code file to analyze"),
      analysisType: z
        .enum(["structure", "full"])
        .default("structure")
        .describe("Type of analysis: 'structure' for structural breakdown, 'full' for complete content with metadata"),
    }),
  }
);

export default codeAnalyzerTool;
