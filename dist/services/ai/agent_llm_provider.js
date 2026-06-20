"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLlmProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const agent_tool_registry_1 = require("./agent_tool_registry");
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
        // We'll use OpenAI compatible format for Tool Calling as it's the industry standard
        // In production, we'd route to Gemini or OpenAI based on settings
        const endpointUrl = "https://api.openai.com/v1/chat/completions";
        const apiKey = settings.secrets.openaiApiKey || process.env.OPENAI_API_KEY || "";
        if (!apiKey) {
            throw new Error("API Key is required for Agent Tool Calling");
        }
        while (iteration < maxIterations) {
            iteration++;
            const payload = {
                model: settings.llm.model || "gpt-4o",
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
            const response = await axios_1.default.post(endpointUrl, payload, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            });
            const responseMessage = response.data.choices[0].message;
            messages.push(responseMessage);
            if (responseMessage.tool_calls) {
                // AI wants to call tools
                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);
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
