"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantController = void 0;
const PlantService_1 = require("../services/PlantService");
const v2_1 = require("../validation/v2");
const zod_1 = require("zod");
const updatePlantSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional()
});
class PlantController {
    constructor() {
        this.createPlant = async (req, res) => {
            try {
                const parsed = v2_1.createPlantSchema.parse(req.body);
                const userId = req.user._id || req.user.userId;
                const plant = await this.plantService.createPlant(userId, parsed.zoneId, parsed.dnaId, parsed.name);
                res.status(201).json({ status: 'success', data: plant });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getPlantDetails = async (req, res) => {
            try {
                const id = req.params.id;
                const userId = req.user._id || req.user.userId;
                const plant = await this.plantService.getPlantDetails(id, userId);
                if (!plant) {
                    return res.status(404).json({ status: 'error', message: 'Plant not found' });
                }
                res.status(200).json({ status: 'success', data: plant });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updatePlant = async (req, res) => {
            try {
                const id = req.params.id;
                const parsed = updatePlantSchema.parse(req.body);
                const userId = req.user._id || req.user.userId;
                const plant = await this.plantService.getPlantDetails(id, userId);
                if (!plant) {
                    return res.status(404).json({ status: 'error', message: 'Plant not found' });
                }
                if (parsed.name)
                    plant.name = parsed.name;
                if (parsed.imageUrl)
                    plant.imageUrl = parsed.imageUrl;
                await plant.save();
                res.status(200).json({ status: 'success', data: plant });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deletePlant = async (req, res) => {
            try {
                const id = req.params.id;
                const userId = req.user._id || req.user.userId;
                const success = await this.plantService.deletePlant(id, userId);
                if (!success) {
                    return res.status(404).json({ status: 'error', message: 'Plant not found or unauthorized' });
                }
                res.status(200).json({ status: 'success', message: 'Plant deleted successfully' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.plantService = new PlantService_1.PlantService();
    }
}
exports.PlantController = PlantController;
