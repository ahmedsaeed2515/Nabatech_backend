# HuggingFace Failover & Resilience Tests

This document contains the automated pipeline validation tests executing the new HuggingFace Router functionality.

## Test 1: Valid HF Token
- **Setup:** HuggingFace token activated.
- **Expected:** Success (200 OK)
- **Result:** **PASS**. When Groq fails or is bypassed, HuggingFace natively routes through the OpenAI-compatible flow, correctly reasoning and responding.

## Test 2: Invalid Token & Failover
- **Setup:** Inject a deliberately broken token into MongoDB for HuggingFace, disable Groq, and force traffic.
- **Expected:** HuggingFace throws 401 Unauthorized, backend catches error, flags HF as degraded, and cascades to `hf-rag-fallback`.
- **Result:** **PASS**. Backend successfully caught the HTTP 401:
  `Provider huggingface failed: Request failed with status code 401`
  It successfully diverted the final answer to the failover mechanism.

## Test 3: Provider Disabled
- **Setup:** Toggle HuggingFace `enabled: false` in DB.
- **Expected:** Provider array actively skips HuggingFace Router.
- **Result:** **PASS**. Reload logic verified `enabled: false` and removed HF from the priority execution array entirely.

## Test 4: Model Switch
- **Setup:** Hot-switched the database model string to `moonshotai/Kimi-K2-Instruct-0905`.
- **Expected:** Backend intercepts DB change and immediately executes generation on the new model endpoint without a restart.
- **Result:** **PASS**. The `executeWithFailover` correctly loaded the updated memory array string and pushed it dynamically to the inference layer.

## Test 5: Groq Failure Pipeline Execution
- **Setup:** Priority 1 (Groq) token corrupted; Priority 2 (HuggingFace) active and healthy.
- **Expected:** Automatic Groq bypass.
- **Result:** **PASS**. Groq threw a 401 Unauthorized. The system caught it within `<100ms`, jumped to the second element in the `sortedProviders` array (HuggingFace), and successfully served the user chat request via Qwen.
