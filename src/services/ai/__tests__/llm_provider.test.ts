import { askLlm } from "../llm_provider";
import { AiSettingsShape } from "../ai_config_service";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeProvider = (name: string, taskRole: "search" | "chat" | "both", enabled = true) => ({
  name,
  enabled,
  taskRole,
  providerType: "generic_llm" as const,
  endpointUrl: "http://mock-provider.test",
  model: "mock-model",
  apiKey: "mock-key",
  timeoutMs: 5000,
});

const makeSettings = (pool: ReturnType<typeof makeProvider>[]): AiSettingsShape =>
  ({
    llm: {
      enabled: true,
      provider: "openai",
      model: "gpt-4",
      timeoutMs: 5000,
      systemPrompt: "You are a helpful assistant.",
      pool,
    },
    secrets: {},
    ragFallback: {
      enabled: true,
      endpointUrl: "http://mock-hf.test/ask",
      timeoutMs: 5000,
    },
    features: {
      allowBackendFallbackToLLM: false,
    },
  } as unknown as AiSettingsShape);

const mockSuccessResponse = {
  data: { choices: [{ message: { content: "mock response text" } }] },
} as any;

const mockHfSuccessResponse = {
  data: { answer: "hf fallback answer" },
} as any;

describe("llm_provider — taskRole filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 1 ──────────────────────────────────────────────────
  it("includes 'search' provider when taskRole is 'search'", async () => {
    const settings = makeSettings([makeProvider("Searcher", "search")]);
    mockedAxios.post.mockResolvedValueOnce(mockSuccessResponse);

    const result = await askLlm(settings, "test query", "llm", [], "search");

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("llm");
    expect(result.message).toBe("mock response text");
  });

  // ── Test 2 ──────────────────────────────────────────────────
  it("excludes 'search' provider when taskRole is 'chat'", async () => {
    // Only a "search" provider in the pool, calling with "chat"
    // → no provider matches → should hit HF fallback
    const settings = makeSettings([makeProvider("Searcher", "search")]);
    mockedAxios.post.mockResolvedValueOnce(mockHfSuccessResponse);

    const result = await askLlm(settings, "test question", "llm", [], "chat");

    // Provider call was skipped, HF fallback was called instead
    expect(result.source).toBe("hf-rag-fallback");
  });

  // ── Test 3 ──────────────────────────────────────────────────
  it("excludes 'chat' provider when taskRole is 'search'", async () => {
    const settings = makeSettings([makeProvider("Chatter", "chat")]);
    mockedAxios.post.mockRejectedValue(new Error("should not be called"));

    // No search provider → should throw, not call HF fallback
    await expect(
      askLlm(settings, "test query", "llm", [], "search")
    ).rejects.toThrow();
  });

  // ── Test 4 ──────────────────────────────────────────────────
  it("includes 'both' provider when taskRole is 'search'", async () => {
    const settings = makeSettings([makeProvider("Bother", "both")]);
    mockedAxios.post.mockResolvedValueOnce(mockSuccessResponse);

    const result = await askLlm(settings, "test query", "llm", [], "search");

    expect(result.source).toBe("llm");
  });

  // ── Test 5 ──────────────────────────────────────────────────
  it("includes 'both' provider when taskRole is 'chat'", async () => {
    const settings = makeSettings([makeProvider("Bother", "both")]);
    mockedAxios.post.mockResolvedValueOnce(mockSuccessResponse);

    const result = await askLlm(settings, "test question", "llm", [], "chat");

    expect(result.source).toBe("llm");
  });

  // ── Test 6 ──────────────────────────────────────────────────
  it("HF fallback is triggered when all 'chat' providers fail", async () => {
    const settings = makeSettings([makeProvider("Chatter", "chat")]);
    mockedAxios.post
      .mockRejectedValueOnce(new Error("chat provider failed"))
      .mockResolvedValueOnce(mockHfSuccessResponse);

    const result = await askLlm(settings, "test question", "llm", [], "chat");

    expect(result.source).toBe("hf-rag-fallback");
    expect(result.message).toBe("hf fallback answer");
  });

  // ── Test 7 ──────────────────────────────────────────────────
  it("HF fallback is NOT triggered when taskRole is 'search' and providers fail", async () => {
    const settings = makeSettings([makeProvider("Searcher", "search")]);
    mockedAxios.post.mockRejectedValue(new Error("search provider failed"));

    await expect(
      askLlm(settings, "test query", "llm", [], "search")
    ).rejects.toThrow();

    // HF /ask must NOT be called
    const hfCalls = mockedAxios.post.mock.calls.filter((c) =>
      String(c[0]).includes("hf") || String(c[0]).includes("ask")
    );
    expect(hfCalls.length).toBe(0);
  });

  // ── Test 8 ──────────────────────────────────────────────────
  it("disabled providers are excluded regardless of taskRole", async () => {
    const settings = makeSettings([
      makeProvider("DisabledSearcher", "search", false),
      makeProvider("ActiveBoth", "both", true),
    ]);
    mockedAxios.post.mockResolvedValueOnce(mockSuccessResponse);

    const result = await askLlm(settings, "test query", "llm", [], "search");

    // Only ActiveBoth should be called
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("llm");
  });
});


