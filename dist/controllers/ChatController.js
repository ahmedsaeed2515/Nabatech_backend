"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const AiOrchestratorService_1 = require("../services/AiOrchestratorService");
const v2_1 = require("../validation/v2");
class ChatController {
    constructor() {
        this.processChat = async (req, res) => {
            try {
                const parsed = v2_1.chatMessageSchema.parse(req.body);
                const userId = req.user._id || req.user.userId;
                const aiResponse = await this.aiOrchestrator.processChat(userId, parsed.body.message);
                res.status(200).json({ status: 'success', data: aiResponse });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.aiOrchestrator = new AiOrchestratorService_1.AiOrchestratorService();
    }
}
exports.ChatController = ChatController;
