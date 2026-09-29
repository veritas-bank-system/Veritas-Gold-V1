# Original User Request

## 2026-09-11T03:35:28Z

This is a single self-contained fix; keep it small and focused. Build and configure an NVIDIA-exclusive `ai-gateway` MCP server and slash commands (`/nvidia-ai` and `/nvidia-mcp`) so that all AI queries, embeddings, and reranking are routed solely through NVIDIA Nemotron models using the provided OpenRouter API key: <REDACTED-OPENROUTER-KEY>

Working directory: /home/seth/Programming/01-projects/Veritas
Integrity mode: development

## Requirements

### R1. NVIDIA-Exclusive AI-Gateway MCP Server
- Implement an MCP server named `ai-gateway` (e.g. in Python or Node.js with standard stdio protocol) supporting:
  - `query_openrouter`: Executes chat completions restricted strictly to NVIDIA Nemotron models:
    - `nvidia/nemotron-3-ultra-550b-a55b:free`
    - `nvidia/nemotron-3-super-120b-a12b:free`
    - `nvidia/nemotron-3.5-lightning:free`
    - `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
  - `query_nvidia_nim`: Executes direct NVIDIA Integrate API calls with fallback/routing to OpenRouter with the active key.
  - `generate_nemotron_embedding`: Generates text and multimodal embeddings using `nvidia/nemotron-3-embed-1b:free` or `nvidia/llama-nemotron-embed-vl-1b-v2:free`.
  - `rerank_nemotron`: Cross-encoder document and visual reranking using `nvidia/llama-nemotron-rerank-vl-1b-v2:free`.
- Strictly reject any request to non-NVIDIA models.

### R2. Secure API Key Storage & Configuration
- Store the OpenRouter API key safely in `~/.gemini/config/.env` or `.env` / environment variable `OPENROUTER_API_KEY`.
- Register the `ai-gateway` server in `~/.gemini/config/mcp_config.json` with stdio transport so Antigravity automatically registers the tools.

### R3. Commands and Workload Router (`/nvidia-ai` and `/nvidia-mcp`)
- Create workspace skills and command definitions for `/nvidia-ai` and `/nvidia-mcp` under `.agents/skills/`:
  - Dynamically routes prompts to the optimal NVIDIA model according to workload:
    - Architecture / Deep Planning / System Refactor: `nvidia/nemotron-3-ultra-550b-a55b:free`
    - Core Software Engineering / Logic / Coding: `nvidia/nemotron-3-super-120b-a12b:free`
    - Rapid Scripts / Iterations / Boilerplate: `nvidia/nemotron-3.5-lightning:free`
    - Multimodal / Vision / UI Reasoning: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
    - Embeddings & Retrieval: `nvidia/nemotron-3-embed-1b:free` & `nvidia/llama-nemotron-embed-vl-1b-v2:free`
    - Reranking: `nvidia/llama-nemotron-rerank-vl-1b-v2:free`
  - Injects the required telemetry status header and turn tracking:
    `⚡ NVIDIA Engine Active: <Model Name> | Provider: OpenRouter AI Gateway | Request: #<Turn> | Tokens: ~<Prompt+Completion> tokens`

## Acceptance Criteria

### Verification & Functionality
- [ ] Stdio MCP server binary/script runs and validates schema without syntax or initialization errors.
- [ ] Direct test call to `query_openrouter` with model `nvidia/nemotron-3.5-lightning:free` returns a valid completion using the configured key.
- [ ] `~/.gemini/config/mcp_config.json` contains the configured `ai-gateway` entry.
- [ ] Slash command skills `.agents/skills/nvidia-ai/SKILL.md` and `.agents/skills/nvidia-mcp/SKILL.md` exist and provide actionable routing instructions and schemas.
