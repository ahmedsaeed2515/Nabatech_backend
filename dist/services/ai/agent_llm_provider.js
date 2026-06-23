"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLlmProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const agent_tool_registry_1 = require("./agent_tool_registry");
const ai_provider_manager_1 = require("./ai_provider_manager");
const secret_crypto_1 = require("./secret_crypto");
const ai_errors_1 = require("./ai_errors");
class AgentLlmProvider {
    constructor() {
        this.registry = new agent_tool_registry_1.AgentToolRegistry();
    }
    async runAgentLoop(settings, userId, message, history, tools, maxIterations = 15, onProgress) {
        let currentMessage = message;
        let iteration = 0;
        const messages = [...history, { role: "user", content: currentMessage }];
        const toolCallCounts = new Map();
        let totalToolCalls = 0;
        const startTime = Date.now();
        const executedToolCalls = [];
        // Get the top generic_llm provider from AiProviderManager
        const manager = (0, ai_provider_manager_1.getProviderManager)();
        const providers = manager.getProviders();
        if (providers.length === 0) {
            await manager.reloadProviders();
        }
        const agentProvider = manager.getProviders().find(p => p.enabled && p.status !== "failed" && (p.providerName.includes('openai') ||
            p.providerName.includes('openrouter') ||
            p.providerName.includes('groq') ||
            p.providerName.includes('agentrouter') ||
            p.baseUrl.includes('openai.com') ||
            p.baseUrl.includes('openrouter.ai') ||
            p.baseUrl.includes('api.groq.com') ||
            p.baseUrl.includes('agentrouter.org') ||
            p.baseUrl.includes('router.huggingface.co') ||
            p.providerName.includes('huggingface')));
        if (!agentProvider) {
            throw new ai_errors_1.AiProviderError("No compatible generic_llm provider available for Agent Tool Calling.");
        }
        const endpointUrl = agentProvider.baseUrl;
        const apiKey = (0, secret_crypto_1.decryptSecret)(agentProvider.apiKeyEncrypted);
        const isOpenRouter = endpointUrl.includes("openrouter.ai");
        const isAgentRouter = endpointUrl.includes("agentrouter.org");
        if (!apiKey) {
            throw new Error("API Key is required for Agent Tool Calling");
        }
        while (iteration < maxIterations) {
            iteration++;
            const payload = {
                model: agentProvider.llmModel || "gpt-4o",
                messages,
                tools: tools.map(t => ({
                    type: "function",
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: t.parameters
                    }
                })),
                tool_choice: "auto"
            };
            let response = null;
            let callAttempt = 0;
            let maxCallAttempts = 3;
            while (callAttempt < maxCallAttempts && !response) {
                callAttempt++;
                try {
                    response = await axios_1.default.post(endpointUrl, payload, {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            "Content-Type": "application/json",
                            ...(isOpenRouter ? {
                                "HTTP-Referer": "https://nabatech.com",
                                "X-Title": "Nabatech AI Platform"
                            } : {}),
                            ...(isAgentRouter ? {
                                "HTTP-Referer": "https://agentrouter.org/",
                                "X-Title": "MyApp"
                            } : {})
                        },
                        timeout: 15000 // 15s timeout to prevent hanging
                    });
                }
                catch (callErr) {
                    if (callErr.response?.status === 429) {
                        console.warn(`[AGENT] 429 Rate Limit. Retrying attempt ${callAttempt}/${maxCallAttempts}...`);
                        if (callAttempt >= maxCallAttempts)
                            throw callErr;
                        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, callAttempt))); // Exponential backoff: 2s, 4s
                    }
                    else if (callErr.response?.status === 413) {
                        console.warn(`[AGENT] 413 Payload Too Large. Compressing messages...`);
                        if (messages.length > 5) {
                            // Keep first message (system/context), and last 3 messages, drop middle
                            messages.splice(1, messages.length - 4);
                            payload.messages = messages;
                        }
                        else {
                            throw callErr;
                        }
                    }
                    else {
                        console.warn(`[AGENT] Call failed: ${callErr.message}`);
                        if (callAttempt >= maxCallAttempts)
                            throw callErr;
                    }
                }
            }
            if (!response) {
                throw new Error("Agent LLM call failed after retries.");
            }
            const responseMessage = response.data.choices[0].message;
            messages.push(responseMessage);
            if (responseMessage.tool_calls) {
                // AI wants to call tools
                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    let functionArgs;
                    try {
                        functionArgs = JSON.parse(toolCall.function.arguments);
                    }
                    catch (err) {
                        console.warn(`[AGENT_LOOP] Invalid JSON in tool arguments for ${functionName}. Error:`, err.message);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: functionName,
                            content: `Error: Invalid JSON payload provided to tool ${functionName}. Please fix syntax.`
                        });
                        continue;
                    }
                    totalToolCalls++;
                    const currentCount = (toolCallCounts.get(functionName) || 0) + 1;
                    toolCallCounts.set(functionName, currentCount);
                    if (currentCount > 5) {
                        console.warn(`[AGENT_LOOP] Loop protection triggered for ${functionName}. Called ${currentCount} times.`);
                        return { message: `I have used the ${functionName} tool too many times in a row. Please provide more specific instructions or break down your request.`, toolCalls: executedToolCalls };
                    }
                    if (totalToolCalls > 20) {
                        console.warn(`[AGENT_LOOP] Total tool calls exceeded maximum safe limit (20).`);
                        return { message: `I have performed too many actions overall for a single request. Let's start fresh.`, toolCalls: executedToolCalls };
                    }
                    // Intercept create_community_post for user approval (Production Hardening)
                    if (functionName === "create_community_post") {
                        console.log(`[AGENT_LOOP] Intercepting ${functionName} for user approval.`);
                        return {
                            message: "I have prepared a draft for your community post. Please review and publish it below.",
                            toolCalls: executedToolCalls,
                            pendingToolCall: { name: functionName, args: functionArgs }
                        };
                    }
                    // Execute the tool
                    const toolStartTime = Date.now();
                    let toolResult = "";
                    let toolStatus = "success";
                    let toolError;
                    try {
                        toolResult = await this.registry.executeTool(functionName, functionArgs, userId, onProgress, settings);
                    }
                    catch (error) {
                        toolStatus = "failure";
                        toolError = error.message;
                        toolResult = `Error executing tool: ${error.message}`;
                    }
                    executedToolCalls.push({
                        toolName: functionName,
                        argsSummary: JSON.stringify(functionArgs).substring(0, 500),
                        status: toolStatus,
                        errorMessage: toolError,
                        durationMs: Date.now() - toolStartTime,
                        timestamp: new Date()
                    });
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: functionName,
                        content: toolResult
                    });
                }
            }
            else {
                // AI is done, returning final response
                const durationMs = Date.now() - startTime;
                console.log(`[AGENT_LOOP] Finished in ${durationMs}ms with ${iteration} iterations and ${totalToolCalls} tool calls.`);
                return { message: responseMessage.content, toolCalls: executedToolCalls };
            }
        }
        return { message: "I needed to perform too many actions and couldn't finish in time. Let's try breaking down your request.", toolCalls: executedToolCalls };
    }
}
exports.AgentLlmProvider = AgentLlmProvider;
