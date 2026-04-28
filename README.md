# Senior Engineer Agent

A LangChain/LangGraph agent that codes like a senior software engineer. It follows a structured workflow — analyze, plan, code, test, review, refactor — to produce production-quality code for any programming language.

Built with **Node.js** and **TypeScript**.

## Architecture

The agent uses a [LangGraph](https://github.com/langchain-ai/langgraph) state graph with six nodes:

```
analyze_task ──► plan_approach ──► generate_code ──► generate_tests
                                                          │
                                                          ▼
                                                    review_code
                                                     │       │
                                          (approved) │       │ (needs_refactor)
                                                     ▼       ▼
                                                    END   refactor_code ──► generate_tests
                                                             │                    ...
                                                             ▼ (max iterations)
                                                            END
```

| Node | Purpose |
|------|---------|
| `analyzeTask` | Extracts language, complexity, requirements, and constraints from the task |
| `planApproach` | Creates an architecture plan, implementation steps, and selects design patterns |
| `generateCode` | Writes production-quality code following the plan |
| `generateTests` | Generates comprehensive tests for the code |
| `reviewCode` | Reviews code for bugs, security, performance, and style issues |
| `refactorCode` | Addresses review issues and loops back for re-testing |

The review node uses a conditional edge: if the verdict is `needs_refactor` and the iteration budget hasn't been exhausted, the graph loops back through refactoring. Otherwise it terminates.

## Setup

### Prerequisites

- Node.js 18+
- A Groq API key (free) **or** an OpenAI API key

### Installation

```bash
# Clone the repo
git clone <repo-url> && cd senior-engineer-agent

# Install dependencies
npm install

# Configure your API key
cp .env.example .env
# Edit .env — set GROQ_API_KEY (free at https://console.groq.com/keys)
# Or switch to OpenAI by setting LLM_PROVIDER=openai and OPENAI_API_KEY
```

## Usage

### CLI

```bash
# Pass the task as an argument
npx tsx src/cli.ts "Write a Python class that implements an LRU cache with O(1) get and put"

# With options
npx tsx src/cli.ts --max-iterations 5 "Build a REST API rate limiter in Go"

# After building
npm run build
node dist/cli.js "Implement a binary search tree in TypeScript"
```

### Node.js API

```typescript
import { run } from "senior-engineer-agent";

const result = await run(
  "Write a thread-safe singleton pattern in Java",
  { maxIterations: 3 },
);

console.log(result.code);
console.log(result.tests);
console.log(result.reviewVerdict); // "approved" or "needs_refactor"
```

### Kiro Custom Agent

This project includes a Kiro custom agent definition at `.kiro/agents/senior-engineer.md`. Once the workspace is open in Kiro, the agent is automatically available. You can invoke it from the Kiro chat by asking it to handle a coding task — it will run the LangGraph workflow and present the results.

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `LLM_PROVIDER` | `groq` | LLM provider: `groq` (free) or `openai` |
| `GROQ_API_KEY` | — | Groq API key (free at https://console.groq.com/keys) |
| `OPENAI_API_KEY` | — | OpenAI API key (only if using `openai` provider) |
| `LLM_MODEL` | provider default | Model name override |
| `LLM_TEMPERATURE` | `0.2` | Sampling temperature |

### Available Groq Models (free)

| Model | Context | Best for |
|-------|---------|----------|
| `llama-3.3-70b-versatile` (default) | 128k | Complex coding tasks |
| `llama-3.1-8b-instant` | 128k | Fast, simple tasks |
| `gemma2-9b-it` | 8k | Balanced performance |
| `mixtral-8x7b-32768` | 32k | Good reasoning |

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Type checking
npm run typecheck
```

## Project Structure

```
├── .kiro/agents/
│   └── senior-engineer.md      # Kiro custom agent definition
├── src/
│   ├── cli.ts                  # CLI entry point
│   ├── config.ts               # LLM configuration (Groq / OpenAI)
│   ├── graph.ts                # LangGraph workflow definition
│   ├── index.ts                # Public API exports
│   ├── nodes.ts                # Graph node implementations
│   ├── prompts.ts              # System and node-level prompts
│   ├── runner.ts               # High-level runner
│   └── state.ts                # State type definitions
├── tests/
│   ├── graph.test.ts           # Graph structure tests
│   ├── nodes.test.ts           # Node unit tests (mocked LLM)
│   └── state.test.ts           # State type tests
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## License

MIT
