"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.runCnnDiagnosis = void 0;
var axios_1 = __importDefault(require("axios"));
var ai_errors_1 = require("./ai_errors");
var normalizeConfidence = function (raw) {
    if (raw === null || raw === undefined)
        return undefined;
    var num = Number(raw);
    if (!Number.isFinite(num))
        return undefined;
    if (num > 1)
        return Math.max(0, Math.min(1, num / 100));
    return Math.max(0, Math.min(1, num));
};
var runCnnDiagnosis = function (settings, formData, headers) { return __awaiter(void 0, void 0, void 0, function () {
    var candidatesList, lastError, _i, candidatesList_1, candidate, cnnApiKey, outboundHeaders, maxRetries, timeoutMs, attempt, response, data, prediction, confidence, rawCandidates, outCandidates, error_1, status_1, isNetworkError;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                if (!settings.cnn.enabled || !settings.cnn.endpointUrl) {
                    console.warn("CNN provider disabled or not configured. Will use mock fallback.");
                }
                candidatesList = settings.cnn.pool && settings.cnn.pool.length
                    ? settings.cnn.pool.filter(function (p) { return p.enabled; })
                    : [
                        {
                            name: settings.cnn.provider,
                            endpointUrl: settings.cnn.endpointUrl,
                            timeoutMs: settings.cnn.timeoutMs,
                            apiKey: settings.secrets.cnnApiKey || "",
                        },
                    ];
                _i = 0, candidatesList_1 = candidatesList;
                _e.label = 1;
            case 1:
                if (!(_i < candidatesList_1.length)) return [3 /*break*/, 10];
                candidate = candidatesList_1[_i];
                cnnApiKey = (candidate.apiKey || "").trim();
                outboundHeaders = __assign(__assign({}, headers), (cnnApiKey ? { Authorization: "Bearer ".concat(cnnApiKey) } : {}));
                maxRetries = 2;
                timeoutMs = candidate.timeoutMs || settings.cnn.timeoutMs || 60000;
                attempt = 0;
                _e.label = 2;
            case 2:
                if (!(attempt <= maxRetries)) return [3 /*break*/, 9];
                _e.label = 3;
            case 3:
                _e.trys.push([3, 5, , 8]);
                return [4 /*yield*/, axios_1.default.post(candidate.endpointUrl, formData, {
                        headers: outboundHeaders,
                        timeout: timeoutMs,
                    })];
            case 4:
                response = _e.sent();
                data = (response.data || {});
                prediction = (data.prediction || data.label || data.class || "").toString().trim();
                if (!prediction) {
                    lastError = new ai_errors_1.AiProviderError("No prediction label returned from ".concat(candidate.name), {
                        code: "CNN_EMPTY_PREDICTION",
                    });
                    return [3 /*break*/, 9]; // Don't retry if the endpoint responded but payload is bad
                }
                confidence = normalizeConfidence((_b = (_a = data.confidence) !== null && _a !== void 0 ? _a : data.score) !== null && _b !== void 0 ? _b : data.probability);
                rawCandidates = Array.isArray(data.candidates) ? data.candidates : [];
                outCandidates = rawCandidates
                    .map(function (x) { var _a, _b; return ({ label: String(x.label || x.class || x.prediction || "").trim(), confidence: normalizeConfidence((_b = (_a = x.confidence) !== null && _a !== void 0 ? _a : x.score) !== null && _b !== void 0 ? _b : x.probability) }); })
                    .filter(function (x) { return x.label; });
                return [2 /*return*/, {
                        prediction: prediction,
                        confidence: confidence,
                        candidates: outCandidates,
                        provider: candidate.name || settings.cnn.provider,
                    }];
            case 5:
                error_1 = _e.sent();
                lastError = (0, ai_errors_1.toProviderError)(error_1, "CNN provider request failed (".concat(candidate.name, ") - attempt ").concat(attempt + 1), "CNN_UPSTREAM_FAILED");
                status_1 = (_c = error_1.response) === null || _c === void 0 ? void 0 : _c.status;
                isNetworkError = error_1.code === 'ECONNABORTED' || ((_d = error_1.message) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes('timeout'));
                if (!(attempt < maxRetries && (isNetworkError || status_1 === 502 || status_1 === 503 || status_1 === 504))) return [3 /*break*/, 7];
                // Wait briefly before retrying
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
            case 6:
                // Wait briefly before retrying
                _e.sent();
                return [3 /*break*/, 8];
            case 7: return [3 /*break*/, 9]; // Stop retrying on 4xx errors or if max retries reached
            case 8:
                attempt++;
                return [3 /*break*/, 2];
            case 9:
                _i++;
                return [3 /*break*/, 1];
            case 10:
                if (lastError) {
                    throw lastError;
                }
                throw new ai_errors_1.AiProviderError("CNN providers failed or not configured", {
                    code: "CNN_UNAVAILABLE"
                });
        }
    });
}); };
exports.runCnnDiagnosis = runCnnDiagnosis;
