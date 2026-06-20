"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveRagChunks = void 0;
var axios_1 = __importDefault(require("axios"));
var ai_errors_1 = require("./ai_errors");
// ?? Helpers ???????????????????????????????????????????????????????????????????
var formatChunksAsContext = function (chunks) {
    if (!chunks.length)
        return "";
    return chunks
        .map(function (chunk, i) {
        return "[".concat(i + 1, "] [Source: ").concat(chunk.source, " | Relevance: ").concat((chunk.score * 100).toFixed(1), "%]:\n").concat(chunk.text.trim());
    })
        .join("\n\n---\n\n");
};
// ?? Primary export ?????????????????????????????????????????????????????????????
var retrieveRagChunks = function (settings, diseaseName, question, topK) { return __awaiter(void 0, void 0, void 0, function () {
    var ragApiKey, rawEndpoint, baseUrl, retrieveUrl, sanitizedDisease, skipPhrases, lowerQ, usefulQuestion, response, error_1, data, rawChunks, chunks, contextText;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!settings.rag.enabled || !settings.rag.endpointUrl) {
                    throw new ai_errors_1.AiProviderError("RAG disabled or not configured", {
                        code: "RAG_NOT_CONFIGURED",
                        isUpstream: false,
                    });
                }
                ragApiKey = (settings.secrets.ragApiKey || "").trim();
                // FIX [TASK-0.1]: Append ragApiKey to Bearer token — was always empty before
                if (ragApiKey)
                    console.log("[RAG] Auth configured: Bearer ***".concat(ragApiKey.slice(-4)));
                rawEndpoint = process.env.NEW_RAG_URL || settings.rag.endpointUrl;
                baseUrl = rawEndpoint
                    .replace(/\/ask(\/stream)?$/, "")
                    .replace(/\/$/, "");
                retrieveUrl = "".concat(baseUrl, "/retrieve");
                sanitizedDisease = diseaseName.trim().substring(0, 200);
                skipPhrases = ["please analyze", "analyze this", "analyze my", "please check"];
                lowerQ = (question || "").toLowerCase();
                usefulQuestion = question && !skipPhrases.some(function (p) { return lowerQ.includes(p); })
                    ? question.substring(0, 500)
                    : "";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1.default.post(retrieveUrl, {
                        disease_name: sanitizedDisease,
                        question: usefulQuestion,
                        top_k: topK || settings.rag.topK || 8,
                    }, {
                        timeout: settings.rag.timeoutMs,
                        headers: ragApiKey ? { Authorization: "Bearer ".concat(ragApiKey) } : undefined,
                    })];
            case 2:
                response = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                throw (0, ai_errors_1.toProviderError)(error_1, "RAG /retrieve request failed for disease: ", "RAG_UPSTREAM_FAILED");
            case 4:
                data = (response.data || {});
                rawChunks = Array.isArray(data.chunks) ? data.chunks : [];
                if (!rawChunks.length) {
                    throw new ai_errors_1.AiProviderError("RAG returned no chunks for disease: ", { code: "RAG_EMPTY_RESPONSE" });
                }
                chunks = rawChunks
                    .filter(function (c) { return c && typeof c.text === "string" && c.text.trim().length > 10; })
                    .map(function (c) { return ({
                    text: String(c.text).trim(),
                    source: String(c.source || "Unknown").trim(),
                    score: typeof c.score === "number" ? Math.max(0, Math.min(1, c.score)) : 0,
                }); });
                if (!chunks.length) {
                    throw new ai_errors_1.AiProviderError("RAG chunks were all empty or malformed", {
                        code: "RAG_INVALID_RESPONSE",
                    });
                }
                contextText = formatChunksAsContext(chunks);
                console.log("[RAG_RETRIEVE_SUCCESS] disease=\"".concat(sanitizedDisease, "\" | chunks=").concat(chunks.length));
                return [2 /*return*/, {
                        contextText: contextText,
                        chunks: chunks,
                        totalFound: data.total_found || chunks.length,
                        source: "rag",
                        provider: "rag",
                    }];
        }
    });
}); };
exports.retrieveRagChunks = retrieveRagChunks;
