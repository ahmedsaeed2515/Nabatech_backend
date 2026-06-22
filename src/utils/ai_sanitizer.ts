export const sanitizeModelOutput = (text: string): string => {
  if (!text) return text;
  
  // Strip common reasoning block tags and their contents
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
    .replace(/<chain_of_thought>[\s\S]*?<\/chain_of_thought>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .trim();
};
