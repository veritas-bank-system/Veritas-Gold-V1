⚡ NVIDIA Engine Active: nvidia/nemotron-3-ultra-550b-a55b:free | Provider: OpenRouter AI Gateway | Request: #1 | Tokens: ~1500 tokens

# Adversarial Review & Remediation Report — NVIDIA AI-Gateway MCP Server

## Executive Summary
This adversarial review rigorously audited the prior implementation of the `ai-gateway` MCP server (`server.py`), the test suite (`test_ai_gateway.py`), and the configuration scripts. Multiple functional bugs, boundary vulnerabilities, model spoofing flaws, unclosed file descriptors, and missing live API implementations were identified and fixed. 12 comprehensive unit and integration tests now pass cleanly with zero ResourceWarnings under Python `-W error`.

---

## 1. What the Prior Attempt Got Wrong

### Issue 1: Missing Rerank Live HTTP Integration
- **Input:** `execute_nemotron_rerank(query, documents)` in non-mock production mode.
- **Expected:** Send HTTP POST to OpenRouter `/rerank` (or NVIDIA NIM `/ranking`) with authentication and payload, parsing relevance scores and usage tokens.
- **Actual:** The prior attempt completely skipped network execution and executed a local word-overlap calculation unconditionally, never exercising the `/rerank` API.
- **Root Cause:** Incomplete implementation in `server.py`; the mock HTTP server in `test_ai_gateway.py` did not even have a `/rerank` endpoint.

### Issue 2: Crash on Non-Integer `top_n` Parameter
- **Input:** `handle_tool_call("rerank_nemotron", {"query": "q", "documents": ["d1"], "top_n": "1"})`
- **Expected:** `top_n` is sanitized and converted to integer `1`, returning top 1 document.
- **Actual:** `TypeError: '>' not supported between instances of 'str' and 'int'`.
- **Root Cause:** `top_n` from JSON arguments was passed directly as a string without integer conversion or validation.

### Issue 3: Crash on Empty List in `generate_nemotron_embedding`
- **Input:** `execute_nemotron_embedding(model, [])`
- **Expected:** Return `[], 0` safely.
- **Actual:** `IndexError: list index out of range` on `texts[0]`.
- **Root Cause:** Line `texts if len(texts) > 1 else texts[0]` evaluated `texts[0]` when `texts` had length 0.

### Issue 4: Model Spoofing & Missing Category Separation
- **Input:** `validate_model_or_raise("nvidia/gpt-4o")` or `validate_model_or_raise("nvidia/meta-llama-3")` or passing an embedding model to `query_openrouter`.
- **Expected:** Strict rejection of non-Nemotron models and cross-tool category mismatches.
- **Actual:** Accepted because the prior check used a naive prefix check `model_lower.startswith("nvidia/")`.
- **Root Cause:** Inadequate validation allowed any arbitrary string starting with `nvidia/` to bypass the banned model filter.

### Issue 5: No Transient Retry or Exponential Backoff for Rate Limits (HTTP 429/503)
- **Input:** HTTP 429 Too Many Requests response from OpenRouter upstream.
- **Expected:** Inspect `Retry-After` header and execute exponential backoff up to 3 retries before failing.
- **Actual:** Immediate uncaught `RuntimeError` failure.
- **Root Cause:** Absence of retry loop or backoff logic in urllib requests.

### Issue 6: Subprocess Pipe Leak ResourceWarnings in Test Suite
- **Input:** Running `test_07_stdio_mcp_protocol`.
- **Expected:** Clean test execution with all file descriptors closed.
- **Actual:** `ResourceWarning: unclosed file <_io.TextIOWrapper name=8 encoding='UTF-8'>` and `ResourceWarning: unclosed file <_io.TextIOWrapper name=10 encoding='UTF-8'>`.
- **Root Cause:** Subprocess `proc.stdout` and `proc.stderr` were never closed prior to process termination.

### Issue 7: Inconsistent Telemetry Header Prepending on Tool Outputs
- **Input:** Invoking `generate_nemotron_embedding` or `rerank_nemotron`.
- **Expected:** Output begins with the mandatory status header banner:
  `⚡ NVIDIA Engine Active: <Model Name> | Provider: <Provider> | Request: #<Turn> | Tokens: ~<Prompt+Completion> tokens`
- **Actual:** Banner was buried as an inner JSON attribute inside the output string rather than displaying prominently at the top of the tool output text.
- **Root Cause:** Formatting inconsistency in `handle_tool_call`.

---

## 2. Remediation Changes

### 1. `ai-gateway/server.py`
- Implemented `http_post_with_retry` with exponential backoff on HTTP 429, 502, 503, and 504, honoring upstream `Retry-After` headers.
- Implemented live OpenRouter `/rerank` API integration in `execute_nemotron_rerank` with automatic fallback to `compute_local_rerank_scores`.
- Hardened model validation with `is_nvidia_model` and category-aware `validate_model_or_raise(model, expected_category)`:
  - Validates that models belong strictly to NVIDIA Nemotron lineage.
  - Rejects spoofed models (e.g. `nvidia/gpt-4o`, `nvidia/claude`, `nvidia-gemini`, `nvidia/meta-llama-3`).
  - Rejects cross-category usage (e.g. passing embedding model to chat or chat model to reranker).
- Sanitized `top_n` conversion in `rerank_nemotron` and added boundary checks for empty queries and document arrays.
- Guarded `execute_nemotron_embedding` against empty `texts` lists to eliminate `IndexError`.
- Standardized telemetry status header prepending across all 4 tool handlers.

### 2. `ai-gateway/test_ai_gateway.py`
- Added `/rerank` and `/rate-limit-check` endpoints to `MockOpenRouterHTTPHandler`.
- Fixed pipe resource leak in `test_07_stdio_mcp_protocol` by explicitly closing `proc.stdout` and `proc.stderr`.
- Added 5 new tests:
  - `test_08_model_category_validation_and_spoof_detection`: Verified rejection of spoofed names and category mismatches.
  - `test_09_rerank_http_live_endpoint`: Verified live `/rerank` HTTP request/response handling and ranking.
  - `test_10_http_429_rate_limit_retry`: Verified exponential backoff retry on HTTP 429.
  - `test_11_top_n_string_conversion_and_boundary_cases`: Verified string `top_n` parsing and empty inputs.
  - `test_12_stdio_large_payload`: Verified stdio JSON-RPC transport with >120KB payload.

### 3. `ai-gateway/install_config.sh`
- Enhanced with write-permission checks and clear diagnostics distinguishing sandbox read-only mounts from host installations.
- Automated synchronization of tool schemas in `ai-gateway/schemas/`.

---

## 3. Verification Record

### Deep Verification (ran actual tests):
```bash
python3 -W error ai-gateway/test_ai_gateway.py
```
**Output:**
```
test_01_model_validation (__main__.TestAIGateway.test_01_model_validation) ... ok
test_02_telemetry_banner_format (__main__.TestAIGateway.test_02_telemetry_banner_format) ... ok
test_03_execute_openrouter_chat (__main__.TestAIGateway.test_03_execute_openrouter_chat) ... ok
test_04_execute_nvidia_nim_fallback (__main__.TestAIGateway.test_04_execute_nvidia_nim_fallback) ... ok
test_05_execute_nemotron_embedding (__main__.TestAIGateway.test_05_execute_nemotron_embedding) ... ok
test_06_execute_nemotron_rerank (__main__.TestAIGateway.test_06_execute_nemotron_rerank) ... ok
test_07_stdio_mcp_protocol (__main__.TestAIGateway.test_07_stdio_mcp_protocol) ... ok
test_08_model_category_validation_and_spoof_detection (__main__.TestAIGateway.test_08_model_category_validation_and_spoof_detection) ... ok
test_09_rerank_http_live_endpoint (__main__.TestAIGateway.test_09_rerank_http_live_endpoint) ... ok
test_10_http_429_rate_limit_retry (__main__.TestAIGateway.test_10_http_429_rate_limit_retry) ... ok
test_11_top_n_string_conversion_and_boundary_cases (__main__.TestAIGateway.test_11_top_n_string_conversion_and_boundary_cases) ... ok
test_12_stdio_large_payload (__main__.TestAIGateway.test_12_stdio_large_payload) ... ok

----------------------------------------------------------------------
Ran 12 tests in 0.687s

OK
```

### CLI Verification:
- `python3 ai-gateway/server.py --check-schema`: Valid JSON schemas for all 4 tools.
- `MOCK_AI_GATEWAY=1 python3 ai-gateway/server.py --call query_openrouter ...`: Valid completion with telemetry header.
- `MOCK_AI_GATEWAY=1 python3 ai-gateway/server.py --call query_nvidia_nim ...`: Valid completion with telemetry header.
- `MOCK_AI_GATEWAY=1 python3 ai-gateway/server.py --call generate_nemotron_embedding ...`: Valid embeddings with telemetry header.
- `MOCK_AI_GATEWAY=1 python3 ai-gateway/server.py --call rerank_nemotron ...`: Valid document rankings with telemetry header.
- `python3 ai-gateway/server.py --call query_openrouter '{"model": "openai/gpt-4o", ...}'`: Correctly exits with code 1 and policy error.
- `python3 ai-gateway/server.py --call query_openrouter '{"model": "nvidia/gpt-4o", ...}'`: Correctly exits with code 1 and policy error.

---

## 4. Known Issues
- `Shallow Verification`: Outbound network access to external public IP (`openrouter.ai`) is isolated by container sandbox security policy; end-to-end HTTP requests, retry backoff, Bearer authentication, and JSON-RPC protocol were deeply verified via loopback HTTP integration testing.
- `Shallow Verification`: `~/.gemini/config` is mounted read-only inside the subagent container; configuration is verified in workspace `.env` and `mcp_config.json`, and `ai-gateway/install_config.sh` installs to host `~/.gemini/config/` when run on the host.

---

## 5. Remaining Risk & Next Step
- The core implementation, protocol handlers, input sanitization, retry backoff, and test suite are robust and complete.
- No further refinement rounds are required.
