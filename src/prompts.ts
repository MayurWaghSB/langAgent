/**
 * System and node-level prompts for the senior engineer agent.
 *
 * Each prompt is a template string. Nodes inject state variables via
 * tagged template helpers before passing them to the LLM.
 */

export const SYSTEM_PROMPT = `\
You are a senior software engineer with 15+ years of experience across multiple \
languages and domains. You write clean, maintainable, production-ready code. \
You think carefully before writing, plan your approach, and always consider \
edge cases, error handling, security, and performance.

Core principles you follow:
- SOLID principles and clean architecture
- Defensive programming with proper error handling
- Meaningful naming and self-documenting code
- Comprehensive testing (unit, integration, e2e where appropriate)
- Security by default (input validation, parameterized queries, least privilege)
- Performance-aware design without premature optimization
- Clear documentation and code comments where intent is non-obvious`;

export function analyzePrompt(taskDescription: string): string {
  return `\
Analyze the following coding task and extract structured information.

Task:
${taskDescription}

Provide your analysis as a JSON object with these fields:
- "programming_language": the primary language to use (infer from context if not stated)
- "complexity": one of "trivial", "simple", "moderate", "complex"
- "requirements": list of functional requirements extracted from the task
- "constraints": list of constraints or non-functional requirements

Return ONLY the JSON object, no markdown fences.`;
}

export function planPrompt(params: {
  taskDescription: string;
  programmingLanguage: string;
  taskComplexity: string;
  requirements: string;
  constraints: string;
}): string {
  return `\
You are planning the implementation for the following task.

Task: ${params.taskDescription}
Language: ${params.programmingLanguage}
Complexity: ${params.taskComplexity}
Requirements:
${params.requirements}
Constraints:
${params.constraints}

Create a detailed implementation plan as a JSON object with:
- "architecture_plan": a concise description of the overall architecture / approach
- "implementation_steps": ordered list of concrete implementation steps
- "design_patterns": list of design patterns that apply (e.g. "Strategy", "Factory", "Observer")

Return ONLY the JSON object, no markdown fences.`;
}

export function codeGenerationPrompt(params: {
  programmingLanguage: string;
  taskDescription: string;
  architecturePlan: string;
  implementationSteps: string;
  designPatterns: string;
}): string {
  return `\
Implement the code based on the plan below. Write production-quality ${params.programmingLanguage} code.

Task: ${params.taskDescription}
Architecture: ${params.architecturePlan}

Implementation steps:
${params.implementationSteps}

Design patterns to apply: ${params.designPatterns}

Rules:
1. Include proper error handling and input validation.
2. Use type hints / type annotations where the language supports them.
3. Add docstrings / comments for public interfaces.
4. Follow idiomatic conventions for ${params.programmingLanguage}.
5. Keep functions/methods focused (single responsibility).

Return the complete implementation code. Use markdown code fences with the language tag.`;
}

export function testGenerationPrompt(params: {
  programmingLanguage: string;
  generatedCode: string;
  requirements: string;
}): string {
  return `\
Write comprehensive tests for the following ${params.programmingLanguage} code.

Code under test:
\`\`\`${params.programmingLanguage}
${params.generatedCode}
\`\`\`

Requirements that must be covered:
${params.requirements}

Rules:
1. Cover happy paths, edge cases, and error conditions.
2. Use the standard testing framework for ${params.programmingLanguage}.
3. Each test should be independent and clearly named.
4. Include setup/teardown where appropriate.
5. Aim for high coverage of the public API.

Return the complete test code. Use markdown code fences with the language tag.`;
}

export function reviewPrompt(params: {
  programmingLanguage: string;
  generatedCode: string;
  testCode: string;
  requirements: string;
}): string {
  return `\
You are performing a thorough code review as a senior engineer. Review the \
following ${params.programmingLanguage} code for quality, correctness, security, and \
maintainability.

Code:
\`\`\`${params.programmingLanguage}
${params.generatedCode}
\`\`\`

Tests:
\`\`\`${params.programmingLanguage}
${params.testCode}
\`\`\`

Requirements:
${params.requirements}

For each issue found, provide a JSON object with:
- "severity": "critical" | "major" | "minor" | "suggestion"
- "category": "bug" | "security" | "performance" | "style" | "maintainability"
- "description": what the issue is
- "line_hint": approximate location (or null)
- "suggestion": how to fix it (or null)

Return a JSON object with:
- "verdict": "approved" | "needs_refactor" | "rejected"
- "issues": list of issue objects (can be empty)

Return ONLY the JSON object, no markdown fences.`;
}

export function refactorPrompt(params: {
  programmingLanguage: string;
  generatedCode: string;
  reviewIssues: string;
}): string {
  return `\
Refactor the following ${params.programmingLanguage} code to address the review issues listed below.

Original code:
\`\`\`${params.programmingLanguage}
${params.generatedCode}
\`\`\`

Issues to address:
${params.reviewIssues}

Rules:
1. Fix all critical and major issues.
2. Address minor issues and suggestions where practical.
3. Do not break existing functionality.
4. Maintain or improve test coverage.

Return the refactored code. Use markdown code fences with the language tag.`;
}
