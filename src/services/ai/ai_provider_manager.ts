import axios from "axios";
import AiProviderSettings, { IAiProviderSettings } from "../../models/ai_provider_settings_model";
import { decryptSecret } from "./secret_crypto";
import { logger } from "../../utils/logger";
import { callProvider, HistoryTurn, LlmResult } from "./llm_provider";
import { AiProviderError } from "./ai_errors";
import { getAiSettings } from "./ai_config_service";

// Global interceptor for agentrouter.org requirements
axios.interceptors.request.use((config) => {
  if (config.url && config.url.includes("agentrouter.org")) {
    if (!config.headers) config.headers = {} as any;
    config.headers!["HTTP-Referer"] = "https://agentrouter.org/";
    config.headers!["X-Title"] = "MyApp";
  }
  return config;
});

class AiProviderManager {
  private providers: IAiProviderSettings[] = [];
  private lastReloadAt = 0;
  private readonly RELOAD_TTL_MS = 30_000; // refresh from DB every 30s

  constructor() {}

  public async reloadProviders() {
    this.providers = await AiProviderSettings.find({ enabled: true }).sort({ priority: 1 });
    this.lastReloadAt = Date.now();
  }

  public getProviders() {
    return this.providers;
  }

  private determineProviderType(url: string, providerName: string): any {
    const p = providerName.toLowerCase();
    if (p.includes('gemini') || url.includes('generativelanguage.googleapis')) return 'gemini';
    if (p.includes('anthropic')) return 'anthropic';
    if (p.includes('cohere')) return 'cohere';
    if (p.includes('openrouter')) return 'generic_llm';
    if (p.includes('groq') || url.includes('api.groq.com')) return 'generic_llm';
    if (p.includes('openai') || url.includes('api.openai.com')) return 'generic_llm';
    if (url.includes('router.huggingface.co')) return 'generic_llm';
    if (url.includes('hf.space') || p.includes('huggingface')) return 'huggingface_inference';
    return 'generic_llm';
  }

  public async executeWithFailover(
    systemPrompt: string,
    message: string,
    history: HistoryTurn[],
    options: { timeoutMs?: number } = {}
  ): Promise<LlmResult> {
    // Always reload if cache is empty or stale (TTL expired)
    const now = Date.now();
    if (this.providers.length === 0 || (now - this.lastReloadAt) > this.RELOAD_TTL_MS) {
      await this.reloadProviders();
    }

    if (this.providers.length === 0) {
      throw new AiProviderError("No active AI providers configured in the database.");
    }

    const errors: any[] = [];
    
    // Sort providers: prefer fewer consecutive errors, then by priority
    const sortedProviders = [...this.providers].sort((a, b) => {
      const errA = (this as any).consecutiveErrors?.[a.providerName] || 0;
      const errB = (this as any).consecutiveErrors?.[b.providerName] || 0;
      if (errA !== errB) return errA - errB;
      return a.priority - b.priority;
    });

    for (const provider of sortedProviders) {
      logger.info(`Attempting LLM call via ${provider.providerName} (${provider.llmModel})`);
      const apiKey = decryptSecret(provider.apiKeyEncrypted);
      const providerType = this.determineProviderType(provider.baseUrl, provider.providerName);

      try {
        const startTime = Date.now();
        const content = await callProvider({
          providerType,
          endpointUrl: provider.baseUrl,
          model: provider.llmModel,
          apiKey,
          timeoutMs: options.timeoutMs || 25000,
          systemPrompt,
          message,
          history,
        });

        // On success, reset consecutive errors
        (this as any).consecutiveErrors = (this as any).consecutiveErrors || {};
        (this as any).consecutiveErrors[provider.providerName] = 0;
        
        // Update health on success asynchronously
        this.updateHealth(provider._id.toString(), "healthy", "");

        return {
          message: content,
          source: "llm",
          provider: provider.providerName,
          model: provider.llmModel,
        };

      } catch (err: any) {
        logger.warn(`Provider ${provider.providerName} failed: ${err.message}`);
        errors.push({ provider: provider.providerName, error: err.message });
        
        // Track consecutive errors
        (this as any).consecutiveErrors = (this as any).consecutiveErrors || {};
        (this as any).consecutiveErrors[provider.providerName] = ((this as any).consecutiveErrors[provider.providerName] || 0) + 1;
        
        // Update health on failure
        this.updateHealth(provider._id.toString(), "failed", err.message);
        
        // Continue to next priority provider
      }
    }

    // If all DB providers failed, try emergency fallback if configured
    try {
      const { askRagFallback } = await import("./llm_provider");
      // Use the fallback HF space endpoint
      const fallbackResult = await askRagFallback("https://ahmedsaeed111-rag-only.hf.space/ask", message, history);
      return { message: fallbackResult, source: "hf-rag-fallback", provider: "hf-rag-fallback", model: "Qwen/Qwen2.5-72B-Instruct" };
    } catch (fallbackErr: any) {
      logger.error("Emergency fallback also failed: " + (fallbackErr?.message || String(fallbackErr)));
      // Safely serialize errors — avoid circular reference from axios error objects
      const safeErrors = errors.map((e: any) => ({ provider: e.provider, error: String(e.error) }));
      throw new AiProviderError(`All AI providers failed. Errors: ${JSON.stringify(safeErrors)}`);
    }
  }

  private async updateHealth(id: string, status: string, errorMsg: string) {
    try {
      await AiProviderSettings.findByIdAndUpdate(id, {
        status,
        lastHealthCheck: new Date(),
        lastError: errorMsg.substring(0, 500)
      });
    } catch (e) {
      logger.error("Failed to update provider health", e);
    }
  }

  public async checkAllHealth() {
    await this.reloadProviders();
    const results = [];
    for (const provider of this.providers) {
      const res = await this.testSingleProvider(provider);
      results.push(res);
    }
    return results;
  }

  public async testSingleProvider(provider: IAiProviderSettings) {
    try {
      const apiKey = decryptSecret(provider.apiKeyEncrypted);
      const providerType = this.determineProviderType(provider.baseUrl, provider.providerName);
      
      await callProvider({
        providerType,
        endpointUrl: provider.baseUrl,
        model: provider.llmModel,
        apiKey,
        timeoutMs: 10000,
        systemPrompt: "You are a helpful assistant.",
        message: "Reply with the exact word 'OK'",
        history: [],
      });
      
      await this.updateHealth(provider._id.toString(), "healthy", "");
      return { providerName: provider.providerName, status: "healthy", error: null };
    } catch (e: any) {
      await this.updateHealth(provider._id.toString(), "failed", e.message);
      return { providerName: provider.providerName, status: "failed", error: e.message };
    }
  }
}

// Singleton pattern
let managerInstance: AiProviderManager;
export const getProviderManager = () => {
  if (!managerInstance) {
    managerInstance = new AiProviderManager();
  }
  return managerInstance;
};
