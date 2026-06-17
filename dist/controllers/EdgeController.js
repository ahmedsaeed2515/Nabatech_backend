"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeController = void 0;
const VoiceService_1 = require("../services/VoiceService");
const MediaService_1 = require("../services/MediaService");
class EdgeController {
    constructor() {
        this.processVoiceCommand = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                // Assume audio file is uploaded via multer
                if (!req.file) {
                    res.status(400).json({ status: 'error', message: 'No audio file provided' });
                    return;
                }
                const audioFilePath = req.file.path;
                const result = await this.voiceService.processAudio(userId, audioFilePath);
                res.status(200).json({ status: 'success', data: result });
            }
            catch (err) {
                res.status(500).json({ status: 'error', message: err.message });
            }
        };
        this.requestTimelapse = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { plantId } = req.body;
                if (!plantId) {
                    res.status(400).json({ status: 'error', message: 'plantId is required' });
                    return;
                }
                const job = await this.mediaService.requestTimelapse(userId, plantId);
                res.status(202).json({ status: 'success', data: job, message: 'Timelapse generation queued' });
            }
            catch (err) {
                res.status(500).json({ status: 'error', message: err.message });
            }
        };
        this.getTimelapseJobs = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const jobs = await this.mediaService.getTimelapseJobs(userId);
                res.status(200).json({ status: 'success', data: jobs });
            }
            catch (err) {
                res.status(500).json({ status: 'error', message: err.message });
            }
        };
        this.voiceService = new VoiceService_1.VoiceService();
        this.mediaService = new MediaService_1.MediaService();
    }
}
exports.EdgeController = EdgeController;
