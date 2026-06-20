"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenController = void 0;
const GardenService_1 = require("../services/GardenService");
const v2_1 = require("../validation/v2");
class GardenController {
    constructor() {
        this.createGarden = async (req, res) => {
            try {
                const parsed = v2_1.createGardenSchema.parse(req.body);
                // Assuming req.user is populated by an auth middleware
                const userId = req.user._id || req.user.userId;
                const garden = await this.gardenService.createGarden(userId, parsed.name, parsed.type);
                res.status(201).json({ status: 'success', data: garden });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getGardens = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const gardens = await this.gardenService.getGardensByUser(userId);
                res.status(200).json({ status: 'success', data: gardens });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updateGarden = async (req, res) => {
            try {
                const id = req.params.id;
                const userId = req.user._id || req.user.userId;
                const data = req.body;
                const garden = await this.gardenService.updateGarden(id, userId, data);
                if (!garden) {
                    return res.status(404).json({ status: 'error', message: 'Garden not found or unauthorized' });
                }
                res.status(200).json({ status: 'success', data: garden });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deleteGarden = async (req, res) => {
            try {
                const id = req.params.id;
                const userId = req.user._id || req.user.userId;
                const success = await this.gardenService.deleteGarden(id, userId);
                if (!success) {
                    return res.status(404).json({ status: 'error', message: 'Garden not found or unauthorized' });
                }
                res.status(200).json({ status: 'success', message: 'Garden deleted successfully' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.gardenService = new GardenService_1.GardenService();
    }
}
exports.GardenController = GardenController;
