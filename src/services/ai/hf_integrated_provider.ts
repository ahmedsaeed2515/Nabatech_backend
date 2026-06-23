import axios from "axios";

/**
 * HuggingFace Integrated Provider
 * يتعامل مع 3 endpoints مختلفة:
 *   - llm-grok /query    → { query, history }   → { answer }
 *   - agrirag-pro /ask   → { question, history } → { answer }
 *   - agrirag v8  /ask   → { question, history } → { answer }
 *
 * يعمل كـ drop-in replacement للـ RAG+LLM Pipeline الحالي
 * بحيث لو فشل، الـ Orchestrator يرجع للنظام الأساسي تلقائياً
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type HfMode = "hf_grok" | "hf_v8" | "hf_v62";

export type HfIntegratedResult = {
  answer: string;
  provider: string;
  mode: HfMode;
  latencyMs: number;
  success: true;
};

export type HfIntegratedError = {
  success: false;
  mode: HfMode;
  error: string;
  latencyMs: number;
};

export type HfIntegratedResponse = HfIntegratedResult | HfIntegratedError;

export type HfHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * يبني الـ request body بناءً على نوع الـ endpoint
 * grok يستخدم "query" بينما agrirag يستخدم "question"
 */
const buildRequestBody = (
  mode: HfMode,
  question: string,
  history: HfHistoryItem[]
): Record<string, unknown> => {
  const trimmedHistory = history.slice(-6); // آخر 6 رسائل فقط
  if (mode === "hf_grok") {
    return {
      question: question,
      history: trimmedHistory.map((h) => ({ role: h.role, content: h.content })),
    };
  }
  // hf_v8 و hf_v62 كلاهما يستخدمان agrirag /ask format
  return {
    question: question,
    history: trimmedHistory.map((h) => ({ role: h.role, content: h.content })),
  };
};

/**
 * يستخرج الإجابة النصية من الـ response بغض النظر عن الشكل
 */
const extractAnswer = (data: unknown, mode: HfMode): string | null => {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  // grok يرجع { answer: "..." } أو { response: "..." } أو { result: "..." }
  if (mode === "hf_grok") {
    const answer = d.answer ?? d.response ?? d.result ?? d.text;
    if (typeof answer === "string" && answer.trim()) return answer.trim();
  }

  // agrirag يرجع { answer: "..." }
  if (typeof d.answer === "string" && d.answer.trim()) return d.answer.trim();

  return null;
};

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * يستدعي HuggingFace endpoint محدد ويرجع الإجابة
 * لا يرمي exception أبداً — يرجع HfIntegratedError عند الفشل
 *
 * @param mode    - نوع الـ endpoint المراد استخدامه
 * @param endpointUrl - الرابط الكامل للـ endpoint
 * @param question    - سؤال المستخدم
 * @param history     - تاريخ المحادثة
 * @param timeoutMs   - timeout بالمللي ثانية
 */
export const askHuggingFaceIntegrated = async (
  mode: HfMode,
  endpointUrl: string,
  question: string,
  history: HfHistoryItem[] = [],
  timeoutMs = 40_000
): Promise<HfIntegratedResponse> => {
  const t0 = Date.now();

  if (!endpointUrl || !question?.trim()) {
    return {
      success: false,
      mode,
      error: "Missing endpoint URL or question",
      latencyMs: 0,
    };
  }

  const body = buildRequestBody(mode, question.trim(), history);

  try {
    console.log(`[HF_INTEGRATED] mode=${mode} | url=${endpointUrl} | q="${question.slice(0, 60)}..."`);

    const res = await axios.post(endpointUrl, body, {
      timeout: timeoutMs,
      headers: { "Content-Type": "application/json" },
      validateStatus: (status) => status < 500, // نعالج 4xx بأنفسنا
    });

    const latencyMs = Date.now() - t0;

    if (res.status >= 400) {
      const errMsg = (res.data as any)?.detail || (res.data as any)?.message || `HTTP ${res.status}`;
      console.warn(`[HF_INTEGRATED] mode=${mode} returned HTTP ${res.status}: ${errMsg}`);
      return { success: false, mode, error: errMsg, latencyMs };
    }

    const answer = extractAnswer(res.data, mode);

    if (!answer) {
      console.warn(`[HF_INTEGRATED] mode=${mode} returned empty/unparseable answer`, res.data);
      return {
        success: false,
        mode,
        error: "Empty or unparseable response from HF endpoint",
        latencyMs,
      };
    }

    console.log(`[HF_INTEGRATED] ✅ mode=${mode} answered in ${latencyMs}ms (${answer.length} chars)`);

    return {
      success: true,
      mode,
      answer,
      provider: endpointUrl,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - t0;
    const msg =
      (err as any)?.code === "ECONNABORTED"
        ? `Timeout after ${timeoutMs}ms`
        : (err as any)?.message || "Unknown error";

    console.warn(`[HF_INTEGRATED] ❌ mode=${mode} failed in ${latencyMs}ms: ${msg}`);
    return { success: false, mode, error: msg, latencyMs };
  }
};

/**
 * يجرب الـ modes بالترتيب حتى يحصل على رد ناجح
 * يُستخدم في الـ auto-fallback chain
 *
 * @param modes       - الأوضاع بالترتيب (من الأسرع للأبطأ)
 * @param endpointMap - خريطة mode → URL
 * @param question
 * @param history
 * @param timeoutMs
 */
export const askHuggingFaceWithFallback = async (
  modes: HfMode[],
  endpointMap: Record<HfMode, string>,
  question: string,
  history: HfHistoryItem[] = [],
  timeoutMs = 40_000
): Promise<HfIntegratedResponse> => {
  for (const mode of modes) {
    const url = endpointMap[mode];
    if (!url) continue;
    const result = await askHuggingFaceIntegrated(mode, url, question, history, timeoutMs);
    if (result.success) return result;
    console.warn(`[HF_FALLBACK] mode=${mode} failed, trying next...`);
  }
  return {
    success: false,
    mode: modes[modes.length - 1] ?? "hf_grok",
    error: "All HF modes exhausted without a successful answer",
    latencyMs: 0,
  };
};
