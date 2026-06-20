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
exports.TicketSentiment = exports.TicketCategory = exports.TicketPriority = exports.TicketStatus = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["NEW"] = "new";
    TicketStatus["OPEN"] = "open";
    TicketStatus["PENDING"] = "pending";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["MEDIUM"] = "medium";
    TicketPriority["HIGH"] = "high";
    TicketPriority["URGENT"] = "urgent";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TicketCategory;
(function (TicketCategory) {
    TicketCategory["TECHNICAL"] = "technical";
    TicketCategory["BILLING"] = "billing";
    TicketCategory["GENERAL"] = "general";
    TicketCategory["FEEDBACK"] = "feedback";
})(TicketCategory || (exports.TicketCategory = TicketCategory = {}));
var TicketSentiment;
(function (TicketSentiment) {
    TicketSentiment["POSITIVE"] = "positive";
    TicketSentiment["NEUTRAL"] = "neutral";
    TicketSentiment["NEGATIVE"] = "negative";
})(TicketSentiment || (exports.TicketSentiment = TicketSentiment = {}));
var ticketSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: Object.values(TicketStatus),
        default: TicketStatus.NEW,
        index: true
    },
    priority: {
        type: String,
        enum: Object.values(TicketPriority),
        default: TicketPriority.MEDIUM,
        index: true
    },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    category: {
        type: String,
        enum: Object.values(TicketCategory),
        default: TicketCategory.GENERAL,
        index: true
    },
    sentiment: {
        type: String,
        enum: Object.values(TicketSentiment),
        default: TicketSentiment.NEUTRAL,
        index: true
    },
    tags: [{ type: String }],
    attachments: [
        {
            filename: { type: String },
            url: { type: String },
            contentType: { type: String }
        }
    ],
    suggestedReply: { type: String },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose_1.Schema.Types.ObjectId, ref: "Ticket" },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });
// Exclude soft-deleted records from basic queries
ticketSchema.pre(/^find/, function (next) {
    var query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model("Ticket", ticketSchema);
