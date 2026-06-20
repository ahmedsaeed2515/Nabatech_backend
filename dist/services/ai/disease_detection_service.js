"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseDetectionService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
class DiseaseDetectionService {
    constructor() {
        this.apiUrl = env_1.env.PYTHON_ML_API_URL || 'http://localhost:8000';
    }
    async predictFromImage(fileBuffer, filename) {
        try {
            const form = new form_data_1.default();
            form.append('file', fileBuffer, { filename });
            const response = await axios_1.default.post(`${this.apiUrl}/predict`, form, {
                headers: {
                    ...form.getHeaders()
                },
                timeout: 10000 // 10s timeout
            });
            const data = response.data;
            if (data && data.prediction) {
                return {
                    diseaseNameEn: data.prediction,
                    confidence: data.confidence || 0,
                    candidates: data.candidates || []
                };
            }
            else {
                throw new Error('Invalid response format from ML API');
            }
        }
        catch (error) {
            logger_1.logger.error('ML API Prediction Error:', error.message);
            throw new Error('Failed to get prediction from ML API');
        }
    }
}
exports.DiseaseDetectionService = DiseaseDetectionService;
