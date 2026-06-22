# Dashboard Control Validation

The dashboard control flow allows administrators to manage AI providers (Groq, Gemini, OpenRouter, etc.) dynamically without requiring any backend restarts or code deployments.

## Verification Details

1. **Add / Update API Key**
   - Implemented via `createProvider` and `updateProvider` in `admin_ai_providers_controller.ts`.
   - The API key is securely encrypted using `encryptSecret` before being persisted to the MongoDB `AiProviderSettings` collection.

2. **Enable / Disable Provider**
   - The boolean `enabled` flag is toggled via the dashboard.
   - When a provider is disabled, `manager.reloadProviders()` ensures it is instantly removed from the failover pool.

3. **Change Priority & Change Model**
   - Priority integers determine the failover sequence (1 is highest priority). Groq is currently set to `1`.
   - Modifying `llmModel` updates the specific model requested by the `Generic_LLM` adapter (e.g., updating `qwen/qwen3-32b` to `llama-3.3-70b-versatile`).

4. **Hot Reloading (No Restart Required)**
   - Every time the dashboard triggers a `create` or `update` request, the controller explicitly invokes:
     ```typescript
     clearSettingsCache();
     const manager = getProviderManager();
     await manager.reloadProviders();
     ```
   - This invalidates the local memory cache and immediately pulls the new configuration from MongoDB. Furthermore, the `executeWithFailover` method implements a 30-second TTL fallback check (`RELOAD_TTL_MS`), ensuring that manual DB edits are also picked up dynamically.

5. **Run Health Check & Test Prompt**
   - The dashboard invokes `checkHealth` which triggers `manager.checkAllHealth()`.
   - The system dispatches an isolated prompt `"Reply with the exact word 'OK'"` to all active providers.
   - Success or failure updates the respective `status` ("healthy", "failed") and `lastError` fields in MongoDB.
   - Tested specifically for Groq, and it properly registers as `healthy`.
