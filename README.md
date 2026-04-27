# Dev-Agent 🤖

A production-grade, AI-powered CLI tool for developers — built with **Node.js**, **LangChain**, and **LangGraph**.

Ask questions, explain code, debug errors, generate APIs, and chat interactively — all from your terminal.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                            │
│   commander-based commands: ask, explain, debug, generate,  │
│   chat (interactive REPL with persistent memory)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Agent Layer                            │
│   LangGraph workflow with multi-step reasoning:             │
│   Input → Planner → Executor → [Tool Runner ↔ Executor]*   │
│   State management, iteration limits, session memory        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Tool System                             │
│   Pluggable registry with built-in tools:                   │
│   file_reader · code_analyzer · error_debugger              │
│   api_generator · web_search (Tavily)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   LLM Service Layer                         │
│   Abstracted provider interface (Groq default)              │
│   Extensible to OpenAI, Ollama, Claude                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Config System                            │
│   JSON-based config with profiles (backend, frontend,       │
│   devops) and environment variable overrides                │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys:
#   GROQ_API_KEY=your_key
#   TAVILY_API_KEY=your_key

# 3. Run commands
node cli/index.js ask "What is closure in JavaScript?"
node cli/index.js explain ./utils/logger.js
node cli/index.js debug error.log
node cli/index.js generate api "user authentication with JWT"
node cli/index.js chat
```

### Global Install (optional)

```bash
npm link
# Now use from anywhere:
dev-agent ask "How do promises work?"
```

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `ask <question>` | Ask a technical question | `dev-agent ask "What is a closure?"` |
| `explain <file>` | Explain a source code file | `dev-agent explain ./src/app.js` |
| `debug <file>` | Debug an error log | `dev-agent debug error.log` |
| `generate <type> <desc>` | Generate code | `dev-agent generate api "user auth"` |
| `chat` | Interactive chat session | `dev-agent chat` |

### Options

All commands support:
- `-p, --profile <name>` — Config profile: `default`, `backend`, `frontend`, `devops`

Generate also supports:
- `-f, --framework <name>` — `express`, `fastify`, `koa`, `hono`
- `-s, --style <name>` — `modular`, `minimal`, `full`

### Chat Commands

Inside interactive chat mode:
- `/tools` — List available tools
- `/clear` — Start a new conversation
- `/help` — Show help
- `exit` — Leave the chat

## Project Structure

```
dev-agent/
├── cli/                    # CLI layer
│   ├── index.js            # Entry point & command definitions
│   └── commands/           # Individual command handlers
│       ├── ask.js
│       ├── explain.js
│       ├── debug.js
│       ├── generate.js
│       └── chat.js
├── agent/                  # Agent orchestration layer
│   ├── index.js            # High-level agent API
│   ├── graph.js            # LangGraph workflow builder
│   ├── nodes.js            # Graph nodes (planner, executor, tools)
│   └── state.js            # State schema definition
├── tools/                  # Pluggable tool system
│   ├── registry.js         # Tool registration & discovery
│   ├── fileReader.js       # Read local files
│   ├── codeAnalyzer.js     # Analyze code structure
│   ├── errorDebugger.js    # Parse error logs
│   ├── apiGenerator.js     # Generate API boilerplate
│   └── webSearch.js        # Web search via Tavily
├── services/               # Service abstractions
│   └── llm.js              # LLM provider factory
├── config/                 # Configuration
│   ├── index.js            # Config loader
│   └── default.json        # Default settings & profiles
├── utils/                  # Shared utilities
│   ├── logger.js           # Structured, color-coded logger
│   ├── errors.js           # Custom error classes
│   └── format.js           # Terminal output formatting
├── index.js                # Programmatic API entry point
├── .env.example            # Environment variable template
└── README.md
```

## Configuration

Edit `config/default.json` to customize:

- **LLM settings** — provider, model, temperature, max tokens
- **Agent behavior** — max iterations, system prompt, verbosity
- **Tool settings** — file size limits, search result count
- **Profiles** — switch between backend/frontend/devops personas
- **Logging** — log level, show/hide tool calls and thinking

Environment variables override config values:
```bash
LLM_PROVIDER=groq
LLM_MODEL=openai/gpt-oss-120b
LLM_TEMPERATURE=0
AGENT_MAX_ITERATIONS=10
LOG_LEVEL=info
```

## Adding New Tools

1. Create a file in `tools/` using the LangChain `tool()` helper:

```js
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const myTool = tool(
  async ({ input }) => {
    // Your tool logic here
    return "result";
  },
  {
    name: "my_tool",
    description: "What this tool does",
    schema: z.object({
      input: z.string().describe("Input description"),
    }),
  }
);

export default myTool;
```

2. Register it in `tools/registry.js` by adding the import to `loadBuiltinTools()`.

## Adding LLM Providers

The `services/llm.js` factory supports provider switching. To add a new provider:

1. Install the LangChain integration package (e.g., `@langchain/openai`)
2. Add a `case` in the `createLLM()` switch statement
3. Set the provider in config or via `LLM_PROVIDER` env var

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **CLI**: Commander.js
- **AI Framework**: LangChain + LangGraph
- **LLM**: Groq (default), extensible to OpenAI/Ollama/Claude
- **Search**: Tavily
- **Terminal UI**: Chalk, Ora

## License

ISC
# Portable-agent
