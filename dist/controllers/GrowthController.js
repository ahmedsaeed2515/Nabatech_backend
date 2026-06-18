"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthController = void 0;
const GrowthService_1 = require("../services/GrowthService");
const v2_1 = require("../validation/v2");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
class GrowthController {
    constructor() {
        this.logMeasurement = async (req, res) => {
            try {
                const { id: rawId } = req.params;
                const id = Array.isArray(rawId) ? rawId[0] : rawId;
                const userId = req.user._id || req.user.userId;
                const parsed = v2_1.growthMeasurementSchema.parse(req.body);
                let photoUrl = undefined;
                if (req.file) {
                    // Upload buffer to cloudinary
                    const b64 = Buffer.from(req.file.buffer).toString('base64');
                    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
                    const result = await cloudinary_1.default.uploader.upload(dataURI, {
                        folder: 'nabatech/growth',
                    });
                    photoUrl = result.secure_url;
                }
                const measurement = await this.growthService.logMeasurement(id, userId, {
                    heightCm: parsed.heightCm,
                    leafCount: parsed.leafCount,
                    stage: parsed.stage,
                    photoUrl
                });
                res.status(201).json({ status: 'success', data: measurement });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getTimeline = async (req, res) => {
            try {
                const { id: rawId } = req.params;
                const id = Array.isArray(rawId) ? rawId[0] : rawId;
                const userId = req.user._id || req.user.userId;
                const timeline = await this.growthService.getTimeline(id, userId);
                res.status(200).json({ status: 'success', data: timeline });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.growthService = new GrowthService_1.GrowthService();
    }
}
exports.GrowthController = GrowthController;
