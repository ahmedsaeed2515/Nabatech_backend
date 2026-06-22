# Groq Provider Implementation

## Implementation Details

1. **Provider Manager Integration (`ai_provider_manager.ts`)**
   - We updated the `determineProviderType` method to map any provider name containing `groq` or base URL containing `api.groq.com` to the `generic_llm` adapter type.
   - The `generic_llm` adapter correctly formats system prompts, history, and current user messages into the standard OpenAI format array (`[{role: "system", content: "..."}, {role: "user", content: "..."}]`).

2. **Agent LLM Provider Integration (`agent_llm_provider.ts`)**
   - The `runAgentLoop` explicitly searches for providers capable of function calling. We updated the whitelist to include `groq` and `api.groq.com`. Groq is officially compatible with JSON mode and structured tool calling.

3. **Database Registration (`AiProviderSettings`)**
   - Configured Groq with priority `1` (Highest).
   - Configured the API Endpoint: `https://api.groq.com/openai/v1/chat/completions`.
   - Set the default LLM Model to: `qwen/qwen3-32b` (based on user specification).
   - Encrypted the API key using AES-256-CBC via `secret_crypto.ts`.

4. **Failover Adjustments**
   - Demoted `agentrouter` instances to priority `99` (disabled) to avoid latency penalties due to their current WAF issues.
   - Demoted `openrouter` and `gemini` to priority `10` to act as primary fallbacks if Groq hits rate limits.

## Verification
- Verified the base URL structure matches OpenAI compatibility requirements perfectly.
- Streaming and JSON mode support are natively handled by `llm_provider.ts` and `agent_llm_provider.ts` via standard parameters.
