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
exports.MemoryManager = void 0;
var ai_memory_model_1 = __importDefault(require("../../models/ai_memory_model"));
var MemoryManager = /** @class */ (function () {
    function MemoryManager() {
    }
    MemoryManager.saveShortTermMemory = function (userId_1, key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (userId, key, value, ttlMinutes) {
            var expiresAt, existing;
            if (ttlMinutes === void 0) { ttlMinutes = 60; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
                        return [4 /*yield*/, ai_memory_model_1.default.findOne({ userId: userId, type: "short_term", key: key })];
                    case 1:
                        existing = _a.sent();
                        if (existing) {
                            console.log("[MEMORY_MANAGER] Overwriting short_term memory for user ".concat(userId, ": key=").concat(key));
                        }
                        return [4 /*yield*/, ai_memory_model_1.default.findOneAndUpdate({ userId: userId, type: "short_term", key: key }, { value: value, expiresAt: expiresAt }, { upsert: true, new: true })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MemoryManager.getShortTermMemory = function (userId, key) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ai_memory_model_1.default.findOne({ userId: userId, type: "short_term", key: key })];
                    case 1:
                        record = _a.sent();
                        if (!record || (record.expiresAt && record.expiresAt < new Date())) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, record.value];
                }
            });
        });
    };
    MemoryManager.saveLongTermMemory = function (userId, key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ai_memory_model_1.default.findOneAndUpdate({ userId: userId, type: "long_term", key: key }, { value: value }, { upsert: true, new: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MemoryManager.getLongTermMemory = function (userId, key) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ai_memory_model_1.default.findOne({ userId: userId, type: "long_term", key: key })];
                    case 1:
                        record = _a.sent();
                        return [2 /*return*/, record === null || record === void 0 ? void 0 : record.value];
                }
            });
        });
    };
    MemoryManager.getAllContext = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var records, now, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ai_memory_model_1.default.find({ userId: userId })];
                    case 1:
                        records = _a.sent();
                        now = new Date();
                        context = {
                            shortTerm: {},
                            longTerm: {}
                        };
                        records.forEach(function (r) {
                            if (r.type === "short_term" && (!r.expiresAt || r.expiresAt > now)) {
                                context.shortTerm[r.key] = r.value;
                            }
                            else if (r.type === "long_term") {
                                context.longTerm[r.key] = r.value;
                            }
                        });
                        return [2 /*return*/, context];
                }
            });
        });
    };
    return MemoryManager;
}());
exports.MemoryManager = MemoryManager;
