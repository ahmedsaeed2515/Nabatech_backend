"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommunityDraft = void 0;
const llm_provider_1 = require("./llm_provider");
const ai_config_service_1 = require("./ai_config_service");
const generateCommunityDraft = async (inputs) => {
    const settings = await (0, ai_config_service_1.getAiSettings)();
    const historyText = inputs.history
        .map(h => `${h.role}: ${h.content}`)
        .join("\n");
    const prompt = `
You are an expert community manager. Your task is to generate a community post draft for a user who needs help with their plant.
You must extract the information from the provided context and format it clearly.

Context:
- User's main question: ${inputs.userQuestion}
- Recent Chat History:
${historyText}
- AI Diagnosis Findings: ${inputs.diagnosisResult ? JSON.stringify(inputs.diagnosisResult) : 'None'}

Generate a structured post with two parts separated by '|||'.
Part 1: A catchy, concise Title.
Part 2: The Content, which MUST include the following sections (use markdown headings or bold text):
- Plant Type
- Problem Summary
- Symptoms
- AI Findings (if any)
- Question To Community

Draft:
`;
    try {
        const response = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", []);
        const parts = response.message.split("|||");
        if (parts.length >= 2) {
            return {
                title: parts[0].trim(),
                content: parts[1].trim(),
            };
        }
        else {
            // Fallback parser if LLM ignores separator
            return {
                title: "Help needed with my plant!",
                content: response.message.trim()
            };
        }
    }
    catch (error) {
        console.error("Failed to generate draft via LLM:", error);
        // Fallback template
        return {
            title: "Help needed with my plant!",
            content: `**Plant Type**: Unknown\n**Problem Summary**: ${inputs.userQuestion}\n**Symptoms**: See attached image.\n**AI Findings**: ${inputs.diagnosisResult ? JSON.stringify(inputs.diagnosisResult) : 'N/A'}\n**Question To Community**: Any advice on how to treat this?`
        };
    }
};
exports.generateCommunityDraft = generateCommunityDraft;
