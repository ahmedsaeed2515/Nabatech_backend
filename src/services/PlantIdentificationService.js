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
exports.PlantIdentificationService = void 0;
var genai_1 = require("@google/genai");
var PlantIdentificationRepository_1 = require("../repositories/PlantIdentificationRepository");
var plant_embeddings_service_1 = require("./plant_embeddings_service");
var logger_1 = require("../utils/logger");
var fs_1 = __importDefault(require("fs"));
var mongoose_1 = __importDefault(require("mongoose"));
var ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
var PlantIdentificationService = /** @class */ (function () {
    function PlantIdentificationService() {
        this.idRepo = new PlantIdentificationRepository_1.PlantIdentificationRepository();
    }
    /**
     * Identifies a plant from an image file using Gemini Vision.
     */
    PlantIdentificationService.prototype.identifyImage = function (userId, imagePath) {
        return __awaiter(this, void 0, void 0, function () {
            var imageBuffer, base64Data, mimeType, prompt_1, response, rawText, parsedData, historyRecord, libraryMatch, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!process.env.GEMINI_API_KEY) {
                            throw new Error('GEMINI_API_KEY is not configured');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        imageBuffer = fs_1.default.readFileSync(imagePath);
                        base64Data = imageBuffer.toString('base64');
                        mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
                        prompt_1 = "\n        You are an expert botanist and horticulturist. Analyze this image and identify the plant species.\n        Return ONLY a JSON object with the following schema, and no other text:\n        {\n          \"identifiedSpecies\": \"Scientific Name (Common Name)\",\n          \"confidenceScore\": 0.95, // between 0.0 and 1.0\n          \"category\": \"e.g., Indoor, Succulent, Vegetable\",\n          \"careSummary\": \"Brief 1-sentence care instruction\"\n        }\n      ";
                        return [4 /*yield*/, ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: [
                                    prompt_1,
                                    {
                                        inlineData: {
                                            data: base64Data,
                                            mimeType: mimeType
                                        }
                                    }
                                ],
                                config: {
                                    responseMimeType: 'application/json',
                                    responseSchema: {
                                        type: genai_1.Type.OBJECT,
                                        properties: {
                                            identifiedSpecies: { type: genai_1.Type.STRING },
                                            confidenceScore: { type: genai_1.Type.NUMBER },
                                            category: { type: genai_1.Type.STRING },
                                            careSummary: { type: genai_1.Type.STRING }
                                        },
                                        required: ['identifiedSpecies', 'confidenceScore']
                                    }
                                }
                            })];
                    case 2:
                        response = _a.sent();
                        rawText = response.text;
                        if (!rawText)
                            throw new Error('No response from AI');
                        parsedData = JSON.parse(rawText);
                        return [4 /*yield*/, this.idRepo.create({
                                user: new mongoose_1.default.Types.ObjectId(userId),
                                imageUrl: imagePath, // In a real app, this should be the Cloudinary URL
                                identifiedSpecies: parsedData.identifiedSpecies,
                                confidenceScore: parsedData.confidenceScore,
                                rawResponse: parsedData
                            })];
                    case 3:
                        historyRecord = _a.sent();
                        return [4 /*yield*/, this.matchWithLibrary(parsedData.identifiedSpecies)];
                    case 4:
                        libraryMatch = _a.sent();
                        return [2 /*return*/, {
                                identificationId: historyRecord._id,
                                species: parsedData.identifiedSpecies,
                                confidence: parsedData.confidenceScore,
                                category: parsedData.category,
                                careSummary: parsedData.careSummary,
                                libraryMatch: libraryMatch
                            }];
                    case 5:
                        error_1 = _a.sent();
                        logger_1.logger.error('Failed to identify plant: ' + error_1.message);
                        throw new Error('Plant identification failed: ' + error_1.message);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Search PlantModel using vector search for the closest match.
     */
    PlantIdentificationService.prototype.matchWithLibrary = function (speciesName) {
        return __awaiter(this, void 0, void 0, function () {
            var results, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, plant_embeddings_service_1.PlantEmbeddingsService.searchSimilarPlants(speciesName, 1)];
                    case 1:
                        results = _a.sent();
                        if (results && results.length > 0) {
                            return [2 /*return*/, results[0]];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        e_1 = _a.sent();
                        logger_1.logger.warn('Failed to match identified plant with library: ' + e_1);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PlantIdentificationService.prototype.getHistory = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.idRepo.findByUserId(userId)];
            });
        });
    };
    PlantIdentificationService.prototype.markAddedToGarden = function (identificationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.idRepo.markAsAddedToGarden(identificationId)];
            });
        });
    };
    return PlantIdentificationService;
}());
exports.PlantIdentificationService = PlantIdentificationService;
