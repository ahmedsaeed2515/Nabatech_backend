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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommunityDraft = void 0;
var llm_provider_1 = require("./llm_provider");
var ai_config_service_1 = require("./ai_config_service");
var generateCommunityDraft = function (inputs) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, historyText, prompt, response, parts, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, ai_config_service_1.getAiSettings)()];
            case 1:
                settings = _a.sent();
                historyText = inputs.history
                    .map(function (h) { return "".concat(h.role, ": ").concat(h.content); })
                    .join("\n");
                prompt = "\nYou are an expert community manager. Your task is to generate a community post draft for a user who needs help with their plant.\nYou must extract the information from the provided context and format it clearly.\n\nContext:\n- User's main question: ".concat(inputs.userQuestion, "\n- Recent Chat History:\n").concat(historyText, "\n- AI Diagnosis Findings: ").concat(inputs.diagnosisResult ? JSON.stringify(inputs.diagnosisResult) : 'None', "\n\nGenerate a structured post with two parts separated by '|||'.\nPart 1: A catchy, concise Title.\nPart 2: The Content, which MUST include the following sections (use markdown headings or bold text):\n- Plant Type\n- Problem Summary\n- Symptoms\n- AI Findings (if any)\n- Question To Community\n\nDraft:\n");
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, (0, llm_provider_1.askLlm)(settings, prompt, "llm", [])];
            case 3:
                response = _a.sent();
                parts = response.message.split("|||");
                if (parts.length >= 2) {
                    return [2 /*return*/, {
                            title: parts[0].trim(),
                            content: parts[1].trim(),
                        }];
                }
                else {
                    // Fallback parser if LLM ignores separator
                    return [2 /*return*/, {
                            title: "Help needed with my plant!",
                            content: response.message.trim()
                        }];
                }
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error("Failed to generate draft via LLM:", error_1);
                // Fallback template
                return [2 /*return*/, {
                        title: "Help needed with my plant!",
                        content: "**Plant Type**: Unknown\n**Problem Summary**: ".concat(inputs.userQuestion, "\n**Symptoms**: See attached image.\n**AI Findings**: ").concat(inputs.diagnosisResult ? JSON.stringify(inputs.diagnosisResult) : 'N/A', "\n**Question To Community**: Any advice on how to treat this?")
                    }];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.generateCommunityDraft = generateCommunityDraft;
