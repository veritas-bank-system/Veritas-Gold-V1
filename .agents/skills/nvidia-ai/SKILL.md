---
name: nvidia-ai
description: >-
  NVIDIA Nemotron AI Router & Command Suite: Dynamically routes prompts and engineering tasks
  exclusively to NVIDIA Nemotron models (Ultra 550B, Super 120B, Lightning 30B, Nano Omni reasoning,
  Embeddings, Reranking) via OpenRouter and NVIDIA NIM, enforcing strict model boundaries and
  mandatory telemetry status headers.
---

# ⚡ NVIDIA Nemotron AI Router & Command Protocol (`/nvidia-ai`)

The `/nvidia-ai` command and workflow protocol guarantees that all AI generation, architecture, coding, reasoning, embeddings, and reranking tasks in the Veritas workspace are routed exclusively to the NVIDIA Nemotron ecosystem.

---

## 🚫 Banned Engines & Strict Isolation Policy

- **STRICTLY PROHIBITED**: All non-NVIDIA models (OpenAI/GPT, Anthropic/Claude, Google/Gemini, Mistral, Meta/Llama without NVIDIA fine-tuning/serving).
- **MANDATORY**: All inference and reasoning calls must be directed to NVIDIA models through the `ai-gateway` MCP server (`query_openrouter`, `query_nvidia_nim`, `generate_nemotron_embedding`, `rerank_nemotron`).

---

## 🎯 Dynamic Workload Routing Table

When `/nvidia-ai <prompt>` is invoked, analyze the prompt characteristics and route to the optimal model:

| Workload Category | Model Identifier | Primary Capabilities | Context Window |
| :--- | :--- | :--- | :--- |
| **1. Complex Architecture, Deep Planning & System Refactoring** | `nvidia/nemotron-3-ultra-550b-a55b:free` | 550B MoE, multi-module architecture, protocol invariants, deep reasoning | 1M tokens |
| **2. Core Software Engineering, Logic & Code Generation** | `nvidia/nemotron-3-super-120b-a12b:free` | 120B MoE, Rust canister logic, domain modeling, algorithmic precision | 1M tokens |
| **3. High-Speed Iterations, Scripts & Boilerplate** | `nvidia/nemotron-3.5-lightning:free` | 30B MoE, rapid execution, shell scripts, schema definitions, fast unit tests | Fast / Standard |
| **4. Multimodal, Visual UI & Rapid Extended Reasoning** | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 30B-A3B MoE, visual layout analysis, UI component inspection, step-by-step logic | 256K tokens |
| **5. Embeddings, Semantic Search & Vector Retrieval** | `nvidia/nemotron-3-embed-1b:free`<br>`nvidia/llama-nemotron-embed-vl-1b-v2:free` | Text embeddings (1024d) & multimodal visual embeddings | High-throughput vectorization |
| **6. Multimodal Reranking & UI Verification** | `nvidia/llama-nemotron-rerank-vl-1b-v2:free` | Cross-encoder precision ranking of candidate documents & visual elements | Cross-encoder scoring |

---

## 🛰️ Mandatory Telemetry Status Header Standard

Every response, artifact, or generation generated via `/nvidia-ai` MUST display the standardized telemetry status header:

```
⚡ NVIDIA Engine Active: <Model Name> | Provider: <NVIDIA Integrate API / OpenRouter AI Gateway> | Request: #<Turn> | Tokens: ~<Prompt+Completion> tokens
```

### Turn Tracking Rules:
1. `<Model Name>`: The active NVIDIA model (e.g. `nvidia/nemotron-3-super-120b-a12b:free`).
2. `<Provider>`: `OpenRouter AI Gateway` or `NVIDIA Integrate API / OpenRouter AI Gateway`.
3. `<Turn>`: Monotonically incrementing request turn index (e.g. `#1`, `#2`).
4. `<Prompt+Completion>`: Token count returned by API `usage.total_tokens` or estimated heuristic `(len(prompt)+len(completion)) // 4`.

---

## 💻 Invocation & MCP Tool Execution

### 1. General Prompt / Slash Command:
```
/nvidia-ai "Design a secure ICP ledger reconciliation worker in Rust"
```
*Action*: Classify as Workload Category 1 or 2 -> Execute `query_openrouter` or `query_nvidia_nim` with model `nvidia/nemotron-3-super-120b-a12b:free`.

### 2. Direct MCP Tool Call Example:
```json
{
  "name": "query_openrouter",
  "arguments": {
    "model": "nvidia/nemotron-3-super-120b-a12b:free",
    "prompt": "Implement domain value object for GoldTokenMinorUnits in Rust with zero-panic constructor.",
    "temperature": 0.1
  }
}
```

### 3. Rapid Iteration / Script Generation:
```json
{
  "name": "query_openrouter",
  "arguments": {
    "model": "nvidia/nemotron-3.5-lightning:free",
    "prompt": "Write a bash script to check dfx canister status and local replica health.",
    "temperature": 0.2
  }
}
```
