# Current AI Architecture

## Execution Path
1. **Flutter Frontend:** Makes HTTP requests via Dio (from Cubit/Repository) to the Node.js backend.
2. **Controllers:** Routes such as `chat_controller` and `diagnosis_controller` handle the HTTP requests and pass them to the `ai_orchestrator_service.ts`.
3. **Orchestrator (`ai_orchestrator_service.ts`):** 
   - Handles Image Diagnosis (CNN -> LLM synthesis) and Text Chat (RAG -> LLM).
   - If tools/agents are enabled for logged-in users, routes through `AgentLlmProvider`.
   - Logs metrics (tokens, latency, provider) to `AiCallLog`.
4. **Provider Manager (`ai_provider_manager.ts`):**
   - Implements a Singleton pattern fetching active providers from MongoDB (`AiProviderSettings`).
   - Maintains a failover pool sorted by `priority`.
5. **LLM Provider (`llm_provider.ts`):**
   - The core adapter handling multiple provider specifications (`openai_compatible`, `generic_llm`, `gemini`, `anthropic`, `cohere`, `huggingface_inference`, `ollama`).

## Current Providers & Failover Order
Currently active providers managed dynamically via MongoDB:
1. AgentRouter (deepseek-v4-flash, pro, glm) — *Note: Currently experiencing WAF issues*.
2. OpenRouter (fallback).
3. Gemini (Google AI Studio).
4. HuggingFace RAG Fallback (Emergency Hardcoded Space `ahmedsaeed111-rag-only.hf.space`).

The `executeWithFailover` method attempts the highest priority provider. On catch (e.g., API key invalid, 401, 500), it catches the error, updates the provider health status to `failed`, and immediately loops to the next provider.

## Dashboard Control Flow
- The Admin Dashboard makes requests to `admin_ai_providers_controller.ts`.
- The controller updates the MongoDB collection `AiProviderSettings`.
- Updates to `enabled`, `priority`, or `apiKeyEncrypted` are picked up automatically by `ai_provider_manager.ts` which refreshes its internal array if the TTL (30s) expires or if the cache is empty. No restart is needed.
