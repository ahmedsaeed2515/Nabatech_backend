export class AiProviderError extends Error {
  public readonly code: string;
  public readonly isUpstream: boolean;

  constructor(message: string, options?: { code?: string; isUpstream?: boolean }) {
    super(message);
    this.name = "AiProviderError";
    this.code = options?.code || "AI_PROVIDER_ERROR";
    this.isUpstream = options?.isUpstream ?? true;
  }
}

export const toProviderError = (error: unknown, fallbackMessage: string, code: string): AiProviderError => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  return new AiProviderError(message || fallbackMessage, { code, isUpstream: true });
};

export const isProviderError = (error: unknown): error is AiProviderError => {
  return error instanceof AiProviderError;
};

export const sanitizeErrorMessage = (error: unknown): string => {
  const text = error instanceof Error ? error.message : String(error);
  return text
    .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/gi, "Bearer [REDACTED]")
    .replace(/https?:\/\/\S+/gi, "[URL]")
    .slice(0, 300);
};
