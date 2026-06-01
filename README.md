# NABATECH Backend (Node.js + Express + MongoDB + TypeScript)

## Run Locally
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example`
4. Start dev server:
   - `npm run dev`
5. Build/start production:
   - `npm run build`
   - `npm start`

## Environment Variables (AI + App)
- `PORT`
- `MONGODB_URI` / `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `OPENAI_API_KEY` (backend-only secret)
- `OPENAI_MODEL`
- `LLM_PROVIDER`
- `AI_LLM_TIMEOUT_MS`
- `AI_SYSTEM_PROMPT`
- `CNN_PROVIDER`
- `CNN_ENDPOINT_URL`
- `AI_CNN_TIMEOUT_MS`
- `CNN_INPUT_SIZE`
- `CNN_PREPROCESS_REQUIRED`
- `CNN_CONFIDENCE_THRESHOLD`
- `RAG_ENDPOINT_URL`
- `AI_RAG_TIMEOUT_MS`
- `AI_CHAT_TOP_K`
- `AI_CHAT_FALLBACK_ORDER` (example: `rag,llm`)
- `AI_DIAGNOSIS_FALLBACK_ORDER` (example: `cnn`)
- `AI_ALLOW_FLUTTER_OFFLINE_MODEL`
- `AI_ALLOW_BACKEND_FALLBACK_TO_LLM`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_NAME`

## AI Admin Endpoints
- `GET /api/admin/ai-settings`
- `PUT /api/admin/ai-settings`
- `POST /api/admin/ai-settings/test`
- `GET /api/admin/ai-settings/logs`

## AI Settings Source of Truth
- Backend environment variables provide safe defaults.
- Dashboard `AI Settings` updates can override editable runtime AI settings in MongoDB.
- API keys/secrets remain backend-only and are never returned to Flutter/Dashboard.
- Flutter/mobile should use `NABATECH_API_BASE` only and call backend routes (no direct provider URLs).

## Database Seeding
Seeding happens automatically on server startup (`src/server.ts`):
- Plant library (plants + diseases)
- Default admin account (if not existing)

## Useful Commands
- `npm run test`
- `npm run build`
