"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareController = void 0;
const CareService_1 = require("../services/CareService");
const v2_1 = require("../validation/v2");
class CareController {
    constructor() {
        this.logCareAction = async (req, res) => {
            try {
                const { id: rawId } = req.params;
                const id = Array.isArray(rawId) ? rawId[0] : rawId;
                const parsed = v2_1.careActionSchema.parse(req.body);
                const userId = req.user._id || req.user.userId;
                const date = parsed.date ? new Date(parsed.date) : new Date();
                const action = await this.careService.logAction(id, userId, parsed.type, date, parsed.notes);
                res.status(201).json({ status: 'success', data: action, message: 'Care action logged and queued for health sync' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.logFertilizer = async (req, res) => {
            try {
                const { id: rawId } = req.params;
                const id = Array.isArray(rawId) ? rawId[0] : rawId;
                const parsed = v2_1.fertilizerSchema.parse(req.body);
                const userId = req.user._id || req.user.userId;
                const date = parsed.date ? new Date(parsed.date) : new Date();
                const fertLog = await this.careService.logFertilizer(id, userId, parsed.type, parsed.amount, date);
                res.status(201).json({ status: 'success', data: fertLog, message: 'Fertilizer logged and queued for health sync' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.careService = new CareService_1.CareService();
    }
}
exports.CareController = CareController;
