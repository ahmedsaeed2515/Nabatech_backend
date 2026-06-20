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
var mongoose_1 = __importStar(require("mongoose"));
var communityPostSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorName: { type: String, required: true },
    plantTag: { type: String, enum: ["Diagnosis", "Care Tips", "Watering", "Pests", "General"], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    imagePath: { type: String, default: "" },
    imagePublicId: { type: String },
    likedBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["visible", "hidden", "removed", "resolved"], default: "visible" },
    moderationReason: { type: String },
    moderationNotes: { type: String },
    moderatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    clientOperationId: { type: String, index: true },
    linkedDiagnosis: { type: mongoose_1.Schema.Types.ObjectId, ref: "DiagnosisHistory" },
    version: { type: Number, default: 0 },
}, { timestamps: true });
// Indexes for feed and idempotency
communityPostSchema.index({ status: 1, createdAt: -1, _id: -1 });
communityPostSchema.index({ author: 1, clientOperationId: 1 }, { unique: true, sparse: true });
exports.default = mongoose_1.default.model("CommunityPost", communityPostSchema);
