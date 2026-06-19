import { askLlm } from "./llm_provider";
import { getAiSettings } from "./ai_config_service";

export interface DraftInputs {
  diagnosisResult?: any;
  history: Array<{ role: string; content: string }>;
  userQuestion: string;
}

export interface GeneratedDraft {
  title: string;
  content: string;
}

export const generateCommunityDraft = async (inputs: DraftInputs): Promise<GeneratedDraft> => {
  const settings = await getAiSettings();
  
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
    const response = await askLlm(settings, prompt, "chat", []);
    const parts = response.message.split("|||");
    if (parts.length >= 2) {
      return {
        title: parts[0].trim(),
        content: parts[1].trim(),
      };
    } else {
      // Fallback parser if LLM ignores separator
      return {
        title: "Help needed with my plant!",
        content: response.message.trim()
      };
    }
  } catch (error) {
    console.error("Failed to generate draft via LLM:", error);
    // Fallback template
    return {
      title: "Help needed with my plant!",
      content: `**Plant Type**: Unknown\n**Problem Summary**: ${inputs.userQuestion}\n**Symptoms**: See attached image.\n**AI Findings**: ${inputs.diagnosisResult ? JSON.stringify(inputs.diagnosisResult) : 'N/A'}\n**Question To Community**: Any advice on how to treat this?`
    };
  }
};
