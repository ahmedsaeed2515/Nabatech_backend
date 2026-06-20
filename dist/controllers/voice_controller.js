"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceController = void 0;
const VoiceService_1 = require("../services/VoiceService");
class VoiceController {
    static async processVoiceCommand(req, res) {
        try {
            const userId = req.user._id.toString();
            const { audioBase64, language } = req.body;
            if (!audioBase64) {
                res.status(400).json({ success: false, message: 'audioBase64 is required' });
                return;
            }
            const voiceService = new VoiceService_1.VoiceService();
            const result = await voiceService.processCommand(audioBase64, userId, language || 'ar');
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.VoiceController = VoiceController;
