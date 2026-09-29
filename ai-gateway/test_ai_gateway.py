#!/usr/bin/env python3
"""
Comprehensive Verification Test Suite for NVIDIA AI-Gateway MCP Server
"""

import os
import sys
import json
import time
import socket
import unittest
import threading
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

# Add current directory to path to import server module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import server

class MockOpenRouterHTTPHandler(BaseHTTPRequestHandler):
    """Local HTTP handler simulating OpenRouter API."""
    rate_limit_attempts = 0
    
    def log_message(self, format, *args):
        # Silence HTTP logs in test output
        pass

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length).decode("utf-8")
        req_json = json.loads(post_body)
        
        # Verify Authorization header
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer sk-or-v1-"):
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'{"error": "Unauthorized"}')
            return

        # Rate-limiting simulation endpoint
        if self.path == "/rate-limit-check":
            MockOpenRouterHTTPHandler.rate_limit_attempts += 1
            if MockOpenRouterHTTPHandler.rate_limit_attempts <= 1:
                self.send_response(429)
                self.send_header("Retry-After", "0")
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"error": {"message": "Rate limit reached, please back off"}}')
                return
            else:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status": "recovered_after_retry"}')
                return

        if self.path == "/chat/completions":
            model = req_json.get("model")
            messages = req_json.get("messages", [])
            last_msg = messages[-1].get("content", "") if messages else ""

            response_data = {
                "id": "gen-mock-12345",
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": f"Verified response from Nemotron engine for: {last_msg}"
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": 12,
                    "completion_tokens": 15,
                    "total_tokens": 27
                }
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode("utf-8"))

        elif self.path == "/embeddings":
            inp = req_json.get("input")
            count = len(inp) if isinstance(inp, list) else 1
            response_data = {
                "object": "list",
                "data": [
                    {
                        "object": "embedding",
                        "index": i,
                        "embedding": [0.05 * i] * 512
                    } for i in range(count)
                ],
                "model": req_json.get("model"),
                "usage": {
                    "prompt_tokens": 8,
                    "total_tokens": 8
                }
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode("utf-8"))

        elif self.path == "/rerank":
            query = req_json.get("query", "")
            documents = req_json.get("documents", [])
            top_n = req_json.get("top_n")
            model = req_json.get("model")

            results = []
            q_words = set(query.lower().split())
            for i, doc in enumerate(documents):
                d_words = set(doc.lower().split())
                score = 0.4 + 0.6 * (len(q_words & d_words) / max(1, len(q_words)))
                results.append({
                    "index": i,
                    "document": doc,
                    "relevance_score": round(score, 4)
                })
            results.sort(key=lambda x: x["relevance_score"], reverse=True)
            if top_n is not None and int(top_n) > 0:
                results = results[:int(top_n)]

            response_data = {
                "model": model,
                "results": results,
                "usage": {
                    "total_tokens": 18
                }
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

class TestAIGateway(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Start a background HTTP server on a free port
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind(('127.0.0.1', 0))
        cls.port = s.getsockname()[1]
        s.close()

        cls.httpd = HTTPServer(('127.0.0.1', cls.port), MockOpenRouterHTTPHandler)
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.server_thread.start()
        os.environ["OPENROUTER_BASE_URL"] = f"http://127.0.0.1:{cls.port}"
        os.environ["OPENROUTER_API_KEY"] = "sk-or-v1-0000000000000000000000000000000000000000000000000000"

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def test_01_model_validation(self):
        """Test strict validation of NVIDIA models and rejection of non-NVIDIA models."""
        valid_models = [
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "nvidia/nemotron-3-super-120b-a12b:free",
            "nvidia/nemotron-3.5-lightning:free",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "nvidia/nemotron-3-embed-1b:free",
            "nvidia/llama-nemotron-embed-vl-1b-v2:free",
            "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
        ]
        for m in valid_models:
            self.assertTrue(server.is_nvidia_model(m), f"Model should be valid: {m}")
            self.assertEqual(server.validate_model_or_raise(m), m)

        banned_models = [
            "openai/gpt-4o",
            "gpt-4-turbo",
            "claude-3-5-sonnet",
            "anthropic/claude-3-opus",
            "google/gemini-1.5-pro",
            "mistralai/mistral-large",
            "meta-llama/llama-3.1-405b",
        ]
        for bm in banned_models:
            self.assertFalse(server.is_nvidia_model(bm), f"Model should be rejected: {bm}")
            with self.assertRaises(ValueError):
                server.validate_model_or_raise(bm)

    def test_02_telemetry_banner_format(self):
        """Test telemetry status header formatting and token estimation."""
        banner = server.format_telemetry_banner(
            model="nvidia/nemotron-3.5-lightning:free",
            provider="OpenRouter AI Gateway",
            tokens=250,
            turn=3
        )
        expected = "⚡ NVIDIA Engine Active: nvidia/nemotron-3.5-lightning:free | Provider: OpenRouter AI Gateway | Request: #3 | Tokens: ~250 tokens"
        self.assertEqual(banner, expected)

    def test_03_execute_openrouter_chat(self):
        """Test chat completion against the mock OpenRouter API."""
        reply, tokens = server.execute_openrouter_chat(
            model="nvidia/nemotron-3.5-lightning:free",
            messages=[{"role": "user", "content": "Veritas Check"}]
        )
        self.assertIn("Verified response from Nemotron engine", reply)
        self.assertEqual(tokens, 27)

    def test_04_execute_nvidia_nim_fallback(self):
        """Test NVIDIA NIM falling back to OpenRouter when NIM key is unset."""
        reply, provider, tokens = server.execute_nvidia_nim_chat(
            model="nvidia/nemotron-3-super-120b-a12b:free",
            messages=[{"role": "user", "content": "Fallback Check"}]
        )
        self.assertIn("Verified response from Nemotron engine", reply)
        self.assertEqual(provider, "OpenRouter AI Gateway (fallback)")
        self.assertEqual(tokens, 27)

    def test_05_execute_nemotron_embedding(self):
        """Test embedding generation for single and batch texts."""
        embeddings, tokens = server.execute_nemotron_embedding(
            model="nvidia/nemotron-3-embed-1b:free",
            texts=["Text A", "Text B"]
        )
        self.assertEqual(len(embeddings), 2)
        self.assertEqual(len(embeddings[0]), 512)
        self.assertEqual(tokens, 8)

    def test_06_execute_nemotron_rerank(self):
        """Test document reranker score calculation and sorting."""
        query = "rust canister security"
        documents = [
            "Random unrelated news article",
            "Canister security and access control in Rust",
            "Cooking recipes for pasta",
            "Rust memory safety invariants"
        ]
        results, tokens = server.execute_nemotron_rerank(
            query=query,
            documents=documents,
            model="nvidia/llama-nemotron-rerank-vl-1b-v2:free",
            top_n=2
        )
        self.assertEqual(len(results), 2)
        # The most relevant document should be ranked first
        self.assertEqual(results[0]["index"], 1)
        self.assertGreater(results[0]["relevance_score"], results[1]["relevance_score"])

    def test_07_stdio_mcp_protocol(self):
        """Test end-to-end MCP JSON-RPC 2.0 protocol over stdio subprocess."""
        cmd = [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")]
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=os.environ
        )

        def call(msg):
            proc.stdin.write(json.dumps(msg) + "\n")
            proc.stdin.flush()
            line = proc.stdout.readline()
            return json.loads(line)

        # 1. initialize
        init_res = call({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
        self.assertEqual(init_res["result"]["serverInfo"]["name"], "ai-gateway")

        # 2. tools/list
        tools_res = call({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
        tools = {t["name"]: t for t in tools_res["result"]["tools"]}
        self.assertIn("query_openrouter", tools)
        self.assertIn("query_nvidia_nim", tools)
        self.assertIn("generate_nemotron_embedding", tools)
        self.assertIn("rerank_nemotron", tools)

        # 3. tools/call query_openrouter
        call_res = call({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "query_openrouter",
                "arguments": {
                    "model": "nvidia/nemotron-3.5-lightning:free",
                    "prompt": "Hello test"
                }
            }
        })
        self.assertFalse(call_res["result"]["isError"])
        content_text = call_res["result"]["content"][0]["text"]
        self.assertIn("⚡ NVIDIA Engine Active: nvidia/nemotron-3.5-lightning:free", content_text)

        # 4. tools/call with banned model
        banned_res = call({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "query_openrouter",
                "arguments": {
                    "model": "openai/gpt-4o",
                    "prompt": "Hello test"
                }
            }
        })
        self.assertTrue(banned_res["result"]["isError"])
        self.assertIn("BANNED ENGINE POLICY VIOLATION", banned_res["result"]["content"][0]["text"])

        proc.stdin.close()
        proc.stdout.close()
        proc.stderr.close()
        proc.terminate()
        proc.wait(timeout=5)

    def test_08_model_category_validation_and_spoof_detection(self):
        """Test rejection of spoofed models and category mismatch enforcement."""
        # Spoofed models that try to slip past prefixes
        spoofed = [
            "nvidia/",
            "nvidia/gpt-4o",
            "nvidia/claude-3-opus",
            "nvidia/meta-llama-3",
            "nvidia-gemini",
            "nvidia/qwen-2.5",
        ]
        for s in spoofed:
            self.assertFalse(server.is_nvidia_model(s), f"Spoofed model should be rejected: {s}")
            with self.assertRaises(ValueError):
                server.validate_model_or_raise(s)

        # Cross-category mismatches
        with self.assertRaises(ValueError):
            # Passing embedding model to chat
            server.validate_model_or_raise("nvidia/nemotron-3-embed-1b:free", expected_category="chat")

        with self.assertRaises(ValueError):
            # Passing chat model to embed
            server.validate_model_or_raise("nvidia/nemotron-3.5-lightning:free", expected_category="embed")

        with self.assertRaises(ValueError):
            # Passing chat model to rerank
            server.validate_model_or_raise("nvidia/nemotron-3.5-lightning:free", expected_category="rerank")

    def test_09_rerank_http_live_endpoint(self):
        """Test reranking documents over HTTP endpoint through mock server."""
        query = "distributed consensus algorithms"
        docs = [
            "Recipe for chocolate cake",
            "Byzantine Fault Tolerance and consensus in distributed ledgers",
            "CSS grid and flexbox layout tutorial"
        ]
        results, tokens = server.execute_nemotron_rerank(
            query=query,
            documents=docs,
            model="nvidia/llama-nemotron-rerank-vl-1b-v2:free",
            top_n=2
        )
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["index"], 1)
        self.assertEqual(tokens, 18)

    def test_10_http_429_rate_limit_retry(self):
        """Test exponential backoff retry mechanism when HTTP 429 is encountered."""
        MockOpenRouterHTTPHandler.rate_limit_attempts = 0
        url = f"http://127.0.0.1:{self.port}/rate-limit-check"
        headers = {
            "Authorization": "Bearer sk-or-v1-0000000000000000000000000000000000000000000000000000",
            "Content-Type": "application/json"
        }
        data_bytes = json.dumps({"test": "rate_limit"}).encode("utf-8")
        status, body = server.http_post_with_retry(url, headers, data_bytes, timeout=10, max_retries=2)
        self.assertEqual(status, 200)
        self.assertIn("recovered_after_retry", body)

    def test_11_top_n_string_conversion_and_boundary_cases(self):
        """Test top_n string parsing and boundary handling in tool calls."""
        # top_n as string "1"
        res, is_err = server.handle_tool_call("rerank_nemotron", {
            "query": "icp",
            "documents": ["internet computer canister", "weather report"],
            "top_n": "1"
        })
        self.assertFalse(is_err)
        self.assertIn("⚡ NVIDIA Engine Active: nvidia/llama-nemotron-rerank-vl-1b-v2:free", res)
        self.assertIn("internet computer canister", res)

        # empty inputs for embedding
        res_emb, is_err_emb = server.handle_tool_call("generate_nemotron_embedding", {
            "inputs": []
        })
        self.assertTrue(is_err_emb)

        # empty query for rerank
        res_rr, is_err_rr = server.handle_tool_call("rerank_nemotron", {
            "query": "",
            "documents": ["doc1"]
        })
        self.assertTrue(is_err_rr)

    def test_12_stdio_large_payload(self):
        """Test stdio JSON-RPC server with large text payload (>120KB)."""
        cmd = [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")]
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=os.environ
        )
        large_doc = "NVIDIA Nemotron high performance computing " * 3500  # ~140KB
        req = {
            "jsonrpc": "2.0",
            "id": 99,
            "method": "tools/call",
            "params": {
                "name": "rerank_nemotron",
                "arguments": {
                    "query": "high performance computing",
                    "documents": [large_doc, "short test doc"],
                    "top_n": 1
                }
            }
        }
        proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()
        line = proc.stdout.readline()
        res = json.loads(line)
        self.assertFalse(res["result"]["isError"])
        self.assertIn("⚡ NVIDIA Engine Active", res["result"]["content"][0]["text"])

        proc.stdin.close()
        proc.stdout.close()
        proc.stderr.close()
        proc.terminate()
        proc.wait(timeout=5)

if __name__ == "__main__":
    unittest.main(verbosity=2)
