# HuggingFace Router Provider Integration

This document outlines the architectural changes made to integrate the HuggingFace Router as a fully managed production AI provider in the Nabatech platform.

## 1. Provider Configuration
The HuggingFace Router (`router.huggingface.co`) exposes an OpenAI-compatible `/v1/chat/completions` endpoint. Because of this architectural symmetry, we configured the backend to route HuggingFace payloads through the existing `generic_llm` adapter rather than building a custom SDK implementation.

**Key Changes in `ai_provider_manager.ts`:**
```typescript
if (url.includes('router.huggingface.co')) return 'generic_llm';
```
This forces the orchestrator to automatically attach the standard `Authorization: Bearer <TOKEN>` and format the `messages` array seamlessly.

## 2. Agent Tool-Calling Support
HuggingFace Router models (specifically Qwen 32B and Llama 3.3) support native tool-calling. The `agent_llm_provider.ts` was updated to whitelist HuggingFace for execution within the complex recursive Agent Loop:
```typescript
p.baseUrl.includes('router.huggingface.co') || p.providerName.includes('huggingface')
```
This ensures that if Groq hits a Rate Limit mid-loop, HuggingFace can pick up the exact JSON Schema state and continue executing horticultural diagnosis tools natively.

## 3. Database State
The provider was provisioned securely in MongoDB (`setup_huggingface.js`):
- `providerName`: `huggingface`
- `baseUrl`: `https://router.huggingface.co/v1/chat/completions`
- `llmModel`: `Qwen/Qwen3-32B`
- `priority`: 4
- `enabled`: `true`

The raw HF token is symmetrically encrypted via `secret_crypto.ts` (`aes-256-cbc`) before storage. It is never exposed to the frontend or visible in API responses.
