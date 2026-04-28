# Senior Engineer Agent

A LangChain/LangGraph agent that codes like a senior software engineer. It follows a structured workflow — analyze, plan, code, test, review, refactor — to produce production-quality code for any programming language.

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
| `analyze_task` | Extracts language, complexity, requirements, and constraints from the task |
| `plan_approach` | Creates an architecture plan, implementation steps, and selects design patterns |
| `generate_code` | Writes production-quality code following the plan |
| `generate_tests` | Generates comprehensive tests for the code |
| `review_code` | Reviews code for bugs, security, performance, and style issues |
| `refactor_code` | Addresses review issues and loops back for re-testing |

The review node uses a conditional edge: if the verdict is `needs_refactor` and the iteration budget hasn't been exhausted, the graph loops back through refactoring. Otherwise it terminates.

## Setup

### Prerequisites

- Python 3.11+
- A Groq API key (free) **or** an OpenAI API key

### Installation

```bash
# Clone the repo and cd into it
git clone <repo-url> && cd senior-engineer-agent

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Install with dev dependencies
pip install -e ".[dev]"

# Configure your API key
cp .env.example .env
# Edit .env — set GROQ_API_KEY (free at https://console.groq.com/keys)
# Or switch to OpenAI by setting LLM_PROVIDER=openai and OPENAI_API_KEY
```

## Usage

### CLI

```bash
# Pass the task as an argument
senior-engineer "Write a Python class that implements an LRU cache with O(1) get and put"

# Or pipe from stdin
echo "Implement a binary search tree in TypeScript" | senior-engineer

# With options
senior-engineer --max-iterations 5 --verbose "Build a REST API rate limiter in Go"
```

### Python API

```python
from senior_engineer_agent.runner import run

result = run(
    "Write a thread-safe singleton pattern in Java",
    max_iterations=3,
)

print(result.code)
print(result.tests)
print(result.review_verdict)  # "approved" or "needs_refactor"
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
pytest

# With coverage
pytest --cov=senior_engineer_agent

# Run specific test file
pytest tests/test_nodes.py -v
```

## Project Structure

```
├── .kiro/agents/
│   └── senior-engineer.md      # Kiro custom agent definition
├── senior_engineer_agent/
│   ├── __init__.py
│   ├── cli.py                  # CLI entry point
│   ├── config.py               # LLM configuration
│   ├── graph.py                # LangGraph workflow definition
│   ├── nodes.py                # Graph node implementations
│   ├── prompts.py              # System and node-level prompts
│   ├── runner.py               # High-level runner
│   └── state.py                # Pydantic state models
├── tests/
│   ├── conftest.py             # Shared fixtures
│   ├── test_graph.py           # Graph structure tests
│   ├── test_nodes.py           # Node unit tests (mocked LLM)
│   └── test_state.py           # State model tests
├── .env.example
├── .gitignore
├── pyproject.toml
└── README.md
```

## License

MIT
