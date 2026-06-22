# AgentRouter Fix Plan

Since the root cause of the failures (`400 content-blocked` for Arabic, and `401 unauthorized client`) lies entirely within **AgentRouter's Web Application Firewall (WAF) policies**, there are no code-level bugs in the current backend integration.

However, to maintain backend stability and prevent unnecessary failed requests, we must implement a mitigation strategy.

## 1. Action Required by User
The ultimate fix must be executed by you (the account owner):
1. Join the AgentRouter Discord server: `https://discord.gg/aYq5B4RW3`
2. Open a support ticket.
3. Provide your API Key or IP address to be whitelisted (to bypass the `unauthorized_client` check).
4. Explicitly ask them to **whitelist Arabic language text** on your account (to bypass the `content-blocked` WAF filter).

## 2. Backend Mitigation Plan
Until the AgentRouter account is verified, the backend should be configured to avoid routing critical Arabic prompts to AgentRouter.

### Required Changes:
**File:** `MongoDB -> aiprovidersettings` collection
**Action:** Disable the AgentRouter models to prevent the AI Provider Manager from selecting them and inevitably failing.

**Execution Script:**
Run the following inside your backend directory:
```bash
npx @dotenvx/dotenvx run -- node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await mongoose.connection.collection('aiprovidersettings').updateMany(
    { providerName: { \$in: ['agentrouter-flash', 'agentrouter-pro', 'agentrouter-glm'] } },
    { \$set: { enabled: false, status: 'failed' } }
  );
  console.log('AgentRouter models disabled successfully to prevent WAF errors.');
  process.exit();
}).catch(console.error);
"
```

### 3. Alternative: Routing English-Only Tasks
If you eventually get the account verified but the Arabic filter remains active, we can modify `ai_provider_manager.ts` to strictly route AgentRouter only when `detectLanguage(prompt) === 'en'`. For now, disabling it is the safest approach.
