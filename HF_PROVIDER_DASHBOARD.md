# HuggingFace Dashboard Integration Analysis

This document addresses the frontend dashboard UI specifications for the HuggingFace Router.

## 1. Zero-Code Dashboard Deployment
The Nabatech frontend architecture relies on a dynamic data-driven UI inside `dashboard/src/app/dashboard/ai-management/page.tsx`.
The frontend does not hardcode provider cards. Instead, it queries the backend API (`GET /api/admin/ai/providers`) and maps over the array of registered providers to render the grid:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {providers.map((p) => (
    <ProviderCard key={p._id} provider={p} />
  ))}
</div>
```

## 2. Dynamic Field Mapping
By simply provisioning the HuggingFace record in MongoDB, the dashboard automatically populated the HuggingFace Router card with the following requested fields natively:
- **Provider Name:** `huggingface`
- **Enabled:** Read dynamically via boolean toggle.
- **Priority:** Rendered as `4`.
- **Model:** Pre-filled as `Qwen/Qwen3-32B`.
- **Status:** Shows real-time backend state (`healthy` / `failed`).

## 3. Supported Model Dropdown
Because the UI relies on backend state, the admin can freely type or select supported HuggingFace endpoint models (e.g., `meta-llama/Llama-3.3-70B-Instruct`, `google/gemma-3-27b-it`, `moonshotai/Kimi-K2-Instruct-0905`) without requiring frontend deployments or PRs. The frontend merely dispatches a `PUT /api/admin/ai/providers/:id` containing the new string, and the backend instantly applies the routing configuration.
