"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const communityReportSchema = new mongoose_1.Schema({
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportedEntityId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    entityModel: { type: String, enum: ["CommunityPost", "CommentV2"], required: true },
    reason: {
        type: String,
        enum: ["Spam", "Wrong Diagnosis", "Harassment", "Fake Information", "Other"],
        required: true,
    },
    details: { type: String, maxlength: 500 },
    status: { type: String, enum: ["Pending", "Resolved", "Dismissed"], default: "Pending", index: true },
    resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
}, { timestamps: true });
// Compound index to prevent duplicate reports by the same user on the same entity
communityReportSchema.index({ reporterId: 1, reportedEntityId: 1 }, { unique: true });
communityReportSchema.index({ status: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("CommunityReport", communityReportSchema);
