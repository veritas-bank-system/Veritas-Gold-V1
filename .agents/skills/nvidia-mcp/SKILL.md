---
name: nvidia-mcp
description: >-
  NVIDIA-Exclusive AI-Gateway MCP Server & Management Suite: Provides tool schemas, configuration,
  stdio JSON-RPC protocol, and runtime specifications for query_openrouter, query_nvidia_nim,
  generate_nemotron_embedding, and rerank_nemotron.
---

# 🛠️ NVIDIA AI-Gateway MCP Server Specification & Command (`/nvidia-mcp`)

The `ai-gateway` MCP server provides a standardized Model Context Protocol (MCP) interface running over stdio (JSON-RPC 2.0) that exposes tools exclusively connected to the NVIDIA Nemotron model family.

---

## 📦 MCP Server Overview

- **Server Name**: `ai-gateway`
- **Protocol**: Model Context Protocol (MCP) v2024-11-05 via stdio JSON-RPC 2.0
- **Implementation File**: `/home/seth/Programming/01-projects/Veritas/ai-gateway/server.py`
- **Configuration File**: `/home/seth/Programming/01-projects/Veritas/ai-gateway/mcp_config.json` (and `~/.gemini/config/mcp_config.json`)
- **Key Credential**: `OPENROUTER_API_KEY` stored in `.env` / `~/.gemini/config/.env`

---

## 🔧 Registered Tool Schemas

### 1. `query_openrouter`
Chat completion tool strictly restricted to NVIDIA models via OpenRouter AI Gateway.
- **Inputs**:
  - `model` *(string, optional, default: `nvidia/nemotron-3.5-lightning:free`)*: NVIDIA model ID.
  - `messages` *(array of objects, optional)*: List of `{"role": "user"|"assistant"|"system", "content": "..."}`.
  - `prompt` *(string, optional)*: Convenient single text string.
  - `temperature` *(number, optional, default: 0.2)*.
  - `max_tokens` *(integer, optional)*.
- **Enforcement**: Any model not prefixed with `nvidia/` or in the approved NVIDIA registry triggers an immediate policy violation error.

### 2. `query_nvidia_nim`
Direct NVIDIA Integrate API caller with seamless automatic fallback to OpenRouter AI Gateway.
- **Inputs**: Same as `query_openrouter`.
- **Behavior**: Direct NVIDIA NIM invocation via `https://integrate.api.nvidia.com/v1/chat/completions` if `NVIDIA_API_KEY` is present. Automatically falls back to OpenRouter AI Gateway if the key is missing or NIM is unreachable.

### 3. `generate_nemotron_embedding`
Vector embedding generator for semantic search, RAG, and document indexing.
- **Inputs**:
  - `model` *(string, default: `nvidia/nemotron-3-embed-1b:free`)*: Embedding model.
  - `input` *(string, optional)*: Single document/text.
  - `inputs` *(array of strings, optional)*: Batch documents/texts.
- **Outputs**: JSON containing embeddings, vector dimensions, token count, and telemetry header.

### 4. `rerank_nemotron`
Cross-encoder document and visual element reranker.
- **Inputs**:
  - `query` *(string, required)*: Reference query.
  - `documents` *(array of strings, required)*: Candidate document strings.
  - `model` *(string, default: `nvidia/llama-nemotron-rerank-vl-1b-v2:free`)*.
  - `top_n` *(integer, optional)*: Maximum ranked results to return.
- **Outputs**: Ranked list sorted by descending relevance score with indices.

---

## ⚙️ Configuration & Registration

### Standard `mcp_config.json`
```json
{
  "mcpServers": {
    "ai-gateway": {
      "command": "python3",
      "args": [
        "/home/seth/Programming/01-projects/Veritas/ai-gateway/server.py"
      ],
      "env": {
        "OPENROUTER_API_KEY": "<REDACTED-OPENROUTER-KEY>"
      }
    }
  }
}
```

---

## 🚀 Command Usage (`/nvidia-mcp`)

- `/nvidia-mcp list`: Displays all tools and JSON input schemas.
- `/nvidia-mcp test`: Runs the built-in diagnostic test suite (`test_ai_gateway.py`).
- `/nvidia-mcp call <tool> '<json-arguments>'`: Invokes an individual tool directly through the CLI harness.
