export const validateHistory = (history: any): boolean => {
  if (!history) return true;
  if (!Array.isArray(history)) return false;
  if (history.length > 12) return false;
  
  for (const msg of history) {
    if (!msg || typeof msg !== "object") return false;
    if (typeof msg.role !== "string" || typeof msg.content !== "string") return false;
  }
  return true;
};

export const validateQuestion = (question?: string): boolean => {
  if (!question) return true;
  return question.length <= 2000;
};

export const validateTopK = (topK?: number): boolean => {
  if (topK === undefined) return true;
  return Number.isInteger(topK) && topK >= 1 && topK <= 20;
};


