# AI Engine Rules

## Antigravity Assistant
- In Antigravity, use **GPT-6 Luna** as the assistant model when it is available. This is a workspace instruction; select the model in Antigravity's model picker if necessary.
- This preference applies only to Antigravity's built-in assistant. Do not claim that the assistant is running through the project's NVIDIA gateway.

## Application AI Integrations
- AI features implemented by this project must use the NVIDIA ecosystem through the `ai-gateway` MCP server. Do not add direct API calls to other providers.
- Use the configured gateway tools: `query_openrouter`, `query_nvidia_nim`, and `generate_nemotron_embedding`.
- Select NVIDIA Nemotron models according to the workload:
  - Architecture and deep planning: `nvidia/nemotron-3-ultra-550b-a55b:free`
  - Core software engineering: `nvidia/nemotron-3-super-120b-a12b:free`
  - Fast iterations and boilerplate: `nvidia/nemotron-3.5-lightning:free`
  - Multimodal reasoning: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
  - Embeddings: `nvidia/nemotron-3-embed-1b:free`
  - Reranking: `nvidia/llama-nemotron-rerank-vl-1b-v2:free`
- The NVIDIA-only restriction applies to this application's integrations and their gateway calls, not the Antigravity assistant's own model selection.
- When documenting output produced by an application AI feature, identify its actual configured model and provider. Never report Antigravity assistant output as NVIDIA-generated.
