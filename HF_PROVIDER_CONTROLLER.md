# HuggingFace Provider Controller Architecture

This document describes how the Nabatech backend controllers manage the state of the HuggingFace Router dynamically.

## 1. Hot-Swapping Infrastructure
The `admin_ai_providers_controller.ts` exposes standard CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`) for AI Provider Management under the `/api/admin/ai/providers` route. 

When an Admin toggles HuggingFace Router on/off or updates the active model (e.g., from `Qwen3-32B` to `Mistral-7B`), the controller executes:
```typescript
await provider.save();
clearSettingsCache();
const manager = getProviderManager();
await manager.reloadProviders();
```

## 2. Immediate Runtime Application
The `reloadProviders()` function immediately flushes the internal `AiProviderManager` singleton memory arrays and forces a synchronous read from MongoDB.
- **NO Restart Required:** Node.js process does not need to restart to pick up the new HuggingFace token or model name.
- **Active Traffic Routing:** In-flight requests will complete using the loaded memory context, and all subsequent requests instantly utilize the updated provider rules without dropping connections.

## 3. Health Checking
The controller exposes a `checkHealth` route. The frontend dashboard polls this route, which triggers an active ping to `router.huggingface.co`. If the API key is revoked or the token rate limit is completely exhausted (resulting in sustained 401s or 429s), the manager autonomously flags `huggingface` as `degraded` or `failed`.
