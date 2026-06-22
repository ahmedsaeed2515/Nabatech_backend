"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityAuditService = void 0;
const community_audit_model_1 = __importDefault(require("../models/community_audit_model"));
class CommunityAuditService {
    static async logAction(actorId, action, targetType, targetId, metadata) {
        try {
            await community_audit_model_1.default.create({
                actor: actorId,
                action,
                targetType,
                targetId,
                metadata
            });
        }
        catch (error) {
            console.error('Failed to log community audit action:', error);
        }
    }
}
exports.CommunityAuditService = CommunityAuditService;
