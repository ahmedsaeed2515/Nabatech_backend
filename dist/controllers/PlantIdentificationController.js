"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantIdentificationController = void 0;
const PlantIdentificationService_1 = require("../services/PlantIdentificationService");
const ai_memory_model_1 = __importDefault(require("../models/ai_memory_model"));
class PlantIdentificationController {
    constructor() {
        this.identifyPlant = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const imagePath = req.file?.path;
                if (!imagePath) {
                    return res.status(400).json({ status: 'error', message: 'No image uploaded' });
                }
                const result = await this.idService.identifyImage(userId, imagePath);
                res.status(200).json({ status: 'success', data: result });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getHistory = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const history = await this.idService.getHistory(userId);
                res.status(200).json({ status: 'success', data: history });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.markAddedToGarden = async (req, res) => {
            try {
                const { id } = req.params; // identificationId
                const userId = req.user._id || req.user.userId;
                const { species } = req.body;
                const record = await this.idService.markAddedToGarden(id);
                if (!record) {
                    return res.status(404).json({ status: 'error', message: 'Identification record not found' });
                }
                // Proactively push this context to the AI Agent Memory
                await ai_memory_model_1.default.create({
                    userId: userId.toString(),
                    type: 'long_term',
                    key: `garden_plant_${Date.now()}`,
                    value: `User added a new plant: ${species || record.identifiedSpecies} on ${new Date().toISOString()}`
                });
                res.status(200).json({ status: 'success', message: 'Marked as added to garden and updated AI memory' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.idService = new PlantIdentificationService_1.PlantIdentificationService();
    }
}
exports.PlantIdentificationController = PlantIdentificationController;
