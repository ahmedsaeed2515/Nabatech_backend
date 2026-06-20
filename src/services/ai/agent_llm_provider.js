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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLlmProvider = void 0;
var axios_1 = __importDefault(require("axios"));
var agent_tool_registry_1 = require("./agent_tool_registry");
var AgentLlmProvider = /** @class */ (function () {
    function AgentLlmProvider() {
        this.registry = new agent_tool_registry_1.AgentToolRegistry();
    }
    AgentLlmProvider.prototype.runAgentLoop = function (settings_1, userId_1, message_1, history_1, tools_1) {
        return __awaiter(this, arguments, void 0, function (settings, userId, message, history, tools, maxIterations, onProgress) {
            var currentMessage, iteration, messages, toolCallCounts, totalToolCalls, startTime, executedToolCalls, endpointUrl, apiKey, payload, response, responseMessage, _i, _a, toolCall, functionName, functionArgs, currentCount, toolStartTime, toolResult, toolStatus, toolError, error_1, durationMs;
            if (maxIterations === void 0) { maxIterations = 15; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        currentMessage = message;
                        iteration = 0;
                        messages = __spreadArray(__spreadArray([], history, true), [{ role: "user", content: currentMessage }], false);
                        toolCallCounts = new Map();
                        totalToolCalls = 0;
                        startTime = Date.now();
                        executedToolCalls = [];
                        endpointUrl = "https://api.openai.com/v1/chat/completions";
                        apiKey = settings.secrets.openaiApiKey || process.env.OPENAI_API_KEY || "";
                        if (!apiKey) {
                            throw new Error("API Key is required for Agent Tool Calling");
                        }
                        _b.label = 1;
                    case 1:
                        if (!(iteration < maxIterations)) return [3 /*break*/, 12];
                        iteration++;
                        payload = {
                            model: settings.llm.model || "gpt-4o",
                            messages: messages,
                            tools: tools.map(function (t) { return ({
                                type: "function",
                                function: {
                                    name: t.name,
                                    description: t.description,
                                    parameters: t.parameters
                                }
                            }); }),
                            tool_choice: "auto"
                        };
                        return [4 /*yield*/, axios_1.default.post(endpointUrl, payload, {
                                headers: {
                                    Authorization: "Bearer ".concat(apiKey),
                                    "Content-Type": "application/json"
                                }
                            })];
                    case 2:
                        response = _b.sent();
                        responseMessage = response.data.choices[0].message;
                        messages.push(responseMessage);
                        if (!responseMessage.tool_calls) return [3 /*break*/, 10];
                        _i = 0, _a = responseMessage.tool_calls;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        toolCall = _a[_i];
                        functionName = toolCall.function.name;
                        functionArgs = JSON.parse(toolCall.function.arguments);
                        totalToolCalls++;
                        currentCount = (toolCallCounts.get(functionName) || 0) + 1;
                        toolCallCounts.set(functionName, currentCount);
                        if (currentCount > 5) {
                            console.warn("[AGENT_LOOP] Loop protection triggered for ".concat(functionName, ". Called ").concat(currentCount, " times."));
                            return [2 /*return*/, { message: "I have used the ".concat(functionName, " tool too many times in a row. Please provide more specific instructions or break down your request."), toolCalls: executedToolCalls }];
                        }
                        if (totalToolCalls > 20) {
                            console.warn("[AGENT_LOOP] Total tool calls exceeded maximum safe limit (20).");
                            return [2 /*return*/, { message: "I have performed too many actions overall for a single request. Let's start fresh.", toolCalls: executedToolCalls }];
                        }
                        toolStartTime = Date.now();
                        toolResult = "";
                        toolStatus = "success";
                        toolError = void 0;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.registry.executeTool(functionName, functionArgs, userId, onProgress, settings)];
                    case 5:
                        toolResult = _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _b.sent();
                        toolStatus = "failure";
                        toolError = error_1.message;
                        toolResult = "Error executing tool: ".concat(error_1.message);
                        return [3 /*break*/, 7];
                    case 7:
                        executedToolCalls.push({
                            toolName: functionName,
                            argsSummary: JSON.stringify(functionArgs).substring(0, 500),
                            status: toolStatus,
                            errorMessage: toolError,
                            durationMs: Date.now() - toolStartTime,
                            timestamp: new Date()
                        });
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: functionName,
                            content: toolResult
                        });
                        _b.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 3];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        durationMs = Date.now() - startTime;
                        console.log("[AGENT_LOOP] Finished in ".concat(durationMs, "ms with ").concat(iteration, " iterations and ").concat(totalToolCalls, " tool calls."));
                        return [2 /*return*/, { message: responseMessage.content, toolCalls: executedToolCalls }];
                    case 11: return [3 /*break*/, 1];
                    case 12: return [2 /*return*/, { message: "I needed to perform too many actions and couldn't finish in time. Let's try breaking down your request.", toolCalls: executedToolCalls }];
                }
            });
        });
    };
    return AgentLlmProvider;
}());
exports.AgentLlmProvider = AgentLlmProvider;
