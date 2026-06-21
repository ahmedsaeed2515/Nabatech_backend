import axios from "axios";
import { AiSettingsShape } from "./ai_config_service";
import { AgentToolDefinition, AgentToolRegistry } from "./agent_tool_registry";
import { getProviderManager } from "./ai_provider_manager";
import { decryptSecret } from "./secret_crypto";
import { AiProviderError } from "./ai_errors";

export class AgentLlmProvider {
  private registry = new AgentToolRegistry();

  async runAgentLoop(
    settings: AiSettingsShape,
    userId: string,
    message: string,
    history: any[],
    tools: AgentToolDefinition[],
    maxIterations = 15,
    onProgress?: (phase: string) => void
  ): Promise<{ message: string; toolCalls: any[] }> {
    let currentMessage = message;
    let iteration = 0;
    const messages = [...history, { role: "user", content: currentMessage }];
    const toolCallCounts = new Map<string, number>();
    let totalToolCalls = 0;
    const startTime = Date.now();
    
    const executedToolCalls: any[] = [];

    // Get the top generic_llm provider from AiProviderManager
    const manager = getProviderManager();
    const providers = manager.getProviders();
    if (providers.length === 0) {
      await manager.reloadProviders();
    }
    const agentProvider = manager.getProviders().find(p => p.enabled && p.status !== "failed" && (p.providerName.includes('openai') || p.providerName.includes('openrouter') || p.baseUrl.includes('openai.com') || p.baseUrl.includes('openrouter.ai')));

    if (!agentProvider) {
      throw new AiProviderError("No compatible generic_llm provider available for Agent Tool Calling.");
    }

    const endpointUrl = agentProvider.baseUrl;
    const apiKey = decryptSecret(agentProvider.apiKeyEncrypted);
    const isOpenRouter = endpointUrl.includes("openrouter.ai");

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

      const response = await axios.post(endpointUrl, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(isOpenRouter ? { 
            "HTTP-Referer": "https://nabatech.com", 
            "X-Title": "Nabatech AI Platform" 
          } : {})
        }
      });

      const responseMessage = (response.data as any).choices[0].message;
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
          let toolStatus: "success" | "failure" = "success";
          let toolError: string | undefined;

          try {
            toolResult = await this.registry.executeTool(functionName, functionArgs, userId, onProgress, settings);
          } catch (error: any) {
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
      } else {
        // AI is done, returning final response
        const durationMs = Date.now() - startTime;
        console.log(`[AGENT_LOOP] Finished in ${durationMs}ms with ${iteration} iterations and ${totalToolCalls} tool calls.`);
        return { message: responseMessage.content, toolCalls: executedToolCalls };
      }
    }

    return { message: "I needed to perform too many actions and couldn't finish in time. Let's try breaking down your request.", toolCalls: executedToolCalls };
  }
}
