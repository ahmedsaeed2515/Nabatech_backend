import axios from "axios";
import { AiSettingsShape } from "./ai_config_service";
import { AiProviderError, toProviderError } from "./ai_errors";

export type CnnDiagnosisResult = {
  prediction: string;
  confidence?: number;
  candidates?: Array<{ label: string; confidence?: number }>;
  provider: string;
};

const normalizeConfidence = (raw: unknown): number | undefined => {
  if (raw === null || raw === undefined) return undefined;
  const num = Number(raw);
  if (!Number.isFinite(num)) return undefined;
  if (num > 1) return Math.max(0, Math.min(1, num / 100));
  return Math.max(0, Math.min(1, num));
};

export const runCnnDiagnosis = async (
  settings: AiSettingsShape,
  formData: any,
  headers: Record<string, string>
): Promise<CnnDiagnosisResult> => {
  if (!settings.cnn.enabled || !settings.cnn.endpointUrl) {
    console.warn("CNN provider disabled or not configured. Will use mock fallback.");
  }

  const candidatesList =
    settings.cnn.pool && settings.cnn.pool.length
      ? settings.cnn.pool.filter((p) => p.enabled)
      : [
          {
            name: settings.cnn.provider,
            endpointUrl: settings.cnn.endpointUrl,
            timeoutMs: settings.cnn.timeoutMs,
            apiKey: settings.secrets.cnnApiKey || "",
          },
        ];

  let lastError: unknown;
  for (const candidate of candidatesList) {
    const cnnApiKey = (candidate.apiKey || "").trim();
    const outboundHeaders = {
      ...headers,
      ...(cnnApiKey ? { Authorization: `Bearer ${cnnApiKey}` } : {}),
    };
    const maxRetries = 2;
    const timeoutMs = candidate.timeoutMs || settings.cnn.timeoutMs || 60000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {


        const response = await axios.post(candidate.endpointUrl, formData, {
          headers: outboundHeaders,
          timeout: timeoutMs,
        });

        const data = (response.data || {}) as any;
        let prediction = (data.prediction || data.label || data.class || "").toString().trim();
        let confidence = normalizeConfidence(data.confidence ?? data.score ?? data.probability);
        let rawCandidates = Array.isArray(data.candidates) ? data.candidates : [];

        // Support new API format from abdulrhmanHelmy's space
        if (!prediction && data.diagnosis) {
          prediction = (data.diagnosis.disease || data.diagnosis.name || "").toString().trim();
          confidence = normalizeConfidence(data.diagnosis.confidence ?? confidence);
        }
        if (!prediction && Array.isArray(data.predictions) && data.predictions.length > 0) {
          prediction = (data.predictions[0].class_name || data.predictions[0].display_name || "").toString().trim();
          confidence = normalizeConfidence(data.predictions[0].confidence ?? confidence);
          rawCandidates = data.predictions;
        }

        if (!prediction) {
          lastError = new AiProviderError(`No prediction label returned from ${candidate.name}`, {
            code: "CNN_EMPTY_PREDICTION",
          });
          break; // Don't retry if the endpoint responded but payload is bad
        }

        const outCandidates = rawCandidates
          .map((x: any) => ({ label: String(x.label || x.class_name || x.class || x.prediction || "").trim(), confidence: normalizeConfidence(x.confidence ?? x.score ?? x.probability) }))
          .filter((x: any) => x.label);

        return {
          prediction,
          confidence,
          candidates: outCandidates,
          provider: candidate.name || settings.cnn.provider,
        };
      } catch (error: any) {
        lastError = toProviderError(error, `CNN provider request failed (${candidate.name}) - attempt ${attempt + 1}`, "CNN_UPSTREAM_FAILED");
        const status = error.response?.status;
        const isNetworkError = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
        if (attempt < maxRetries && (isNetworkError || status === 502 || status === 503 || status === 504)) {
          // Wait briefly before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        break; // Stop retrying on 4xx errors or if max retries reached
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
  
  throw new AiProviderError("CNN providers failed or not configured", {
    code: "CNN_UNAVAILABLE"
  });
};


