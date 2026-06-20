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
exports.FertilizerType = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var FertilizerType;
(function (FertilizerType) {
    FertilizerType["LIQUID"] = "LIQUID";
    FertilizerType["GRANULAR"] = "GRANULAR";
    FertilizerType["SLOW_RELEASE"] = "SLOW_RELEASE";
    FertilizerType["ORGANIC"] = "ORGANIC";
    FertilizerType["NPK"] = "NPK";
    FertilizerType["CUSTOM"] = "CUSTOM";
})(FertilizerType || (exports.FertilizerType = FertilizerType = {}));
var fertilizerLogSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'MyPlant', required: true, index: true },
    fertilizerType: { type: String, enum: Object.values(FertilizerType), required: true },
    amountGrams: { type: Number, required: true },
    fertilizedAt: { type: Date, required: true, default: Date.now },
    note: { type: String },
    clientOperationId: { type: String, trim: true },
    // Legacy fields (optional) to preserve old data
    type: { type: String, enum: Object.values(FertilizerType) },
    amount: { type: String },
    date: { type: Date },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });
fertilizerLogSchema.index({ user: 1, clientOperationId: 1 }, { unique: true, sparse: true });
fertilizerLogSchema.pre(/^find/, function (next) {
    var query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('FertilizerLog', fertilizerLogSchema);
