export const validateChatHistory = (history: any): boolean => {
  if (!history) return true;
  if (!Array.isArray(history)) return false;
  if (history.length > 20) return false;
  
  for (const msg of history) {
    if (!msg || typeof msg !== "object") return false;
    if (typeof msg.role !== "string" || typeof msg.content !== "string") return false;
    if (msg.role !== "user" && msg.role !== "assistant" && msg.role !== "system") return false;
    if (!msg.content.trim()) return false;
  }
  return true;
};

export const validateChatText = (text?: string): boolean => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= 2000;
};
