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
const specialistOfferSchema = new mongoose_1.Schema({
    post: { type: mongoose_1.Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
    specialist: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    specialistName: { type: String, required: true, trim: true },
    farmer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    farmerName: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "withdrawn", "cancelled"],
        default: "pending",
    },
    clientOperationId: { type: String, required: false, index: true },
    version: { type: Number, default: 0 },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    withdrawnAt: { type: Date },
    cancelledAt: { type: Date },
    adminStatus: { type: String, enum: ["flagged", "cleared", "voided"], default: undefined },
}, { timestamps: true });
// Indexes for fast lookup and idempotency
specialistOfferSchema.index({ farmer: 1, createdAt: -1 });
specialistOfferSchema.index({ specialist: 1, createdAt: -1 });
specialistOfferSchema.index({ specialist: 1, post: 1, clientOperationId: 1 }, { unique: true, sparse: true });
exports.default = mongoose_1.default.model("SpecialistOffer", specialistOfferSchema);
