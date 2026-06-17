"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAdminAudit = void 0;
const admin_audit_model_1 = __importDefault(require("../models/admin_audit_model"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const recordAdminAudit = async ({ actorId, action, targetType, targetId, result, requestId, beforeSummary, afterSummary, session }) => {
    try {
        const audit = new admin_audit_model_1.default({
            actor: new mongoose_1.default.Types.ObjectId(actorId),
            action,
            targetType,
            targetId,
            result,
            requestId,
            beforeSummary,
            afterSummary
        });
        await audit.save({ session });
    }
    catch (error) {
        // Audit log failures should generally not crash the main transaction,
        // but they should be loudly logged.
        logger_1.logger.error('Failed to record admin audit', { error, actorId, action, targetId });
    }
};
exports.recordAdminAudit = recordAdminAudit;
