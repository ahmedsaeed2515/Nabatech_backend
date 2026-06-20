"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneController = void 0;
const GardenService_1 = require("../services/GardenService");
const v2_1 = require("../validation/v2");
const ZoneRepository_1 = require("../repositories/ZoneRepository");
class ZoneController {
    constructor() {
        this.createZone = async (req, res) => {
            try {
                const parsed = v2_1.createZoneSchema.parse(req.body);
                const gardenId = req.body.gardenId; // or get from params if routes are nested
                if (!gardenId) {
                    return res.status(400).json({ status: 'error', message: 'gardenId is required' });
                }
                const zone = await this.gardenService.createZone(gardenId, parsed.name, parsed.type);
                res.status(201).json({ status: 'success', data: zone });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getZones = async (req, res) => {
            try {
                const { gardenId } = req.query;
                const userId = req.user._id || req.user.userId;
                if (!gardenId) {
                    return res.status(400).json({ status: 'error', message: 'gardenId query parameter is required' });
                }
                const zones = await this.gardenService.getZonesByGarden(gardenId, userId);
                res.status(200).json({ status: 'success', data: zones });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updateZone = async (req, res) => {
            try {
                const id = req.params.id;
                const data = req.body;
                const zone = await this.gardenService.updateZone(id, data);
                if (!zone) {
                    return res.status(404).json({ status: 'error', message: 'Zone not found' });
                }
                res.status(200).json({ status: 'success', data: zone });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deleteZone = async (req, res) => {
            try {
                const id = req.params.id;
                const success = await this.gardenService.deleteZone(id);
                if (!success) {
                    return res.status(404).json({ status: 'error', message: 'Zone not found' });
                }
                res.status(200).json({ status: 'success', message: 'Zone deleted successfully' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.gardenService = new GardenService_1.GardenService();
        this.zoneRepo = new ZoneRepository_1.ZoneRepository();
    }
}
exports.ZoneController = ZoneController;
