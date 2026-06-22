"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportsQuerySchema = exports.updateReportStatusSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const objectIdSchema = zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
});
exports.createReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        reportedEntityId: objectIdSchema,
        entityModel: zod_1.z.enum(["CommunityPost", "CommentV2"]),
        reason: zod_1.z.enum(["Spam", "Wrong Diagnosis", "Harassment", "Fake Information", "Other"]),
        details: zod_1.z.string().max(500).optional(),
    }),
});
exports.updateReportStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema,
    }),
});
// Used to validate the query params for fetching reports
exports.getReportsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
        limit: zod_1.z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
        status: zod_1.z.enum(["Pending", "Resolved", "Dismissed"]).optional(),
        reason: zod_1.z.enum(["Spam", "Wrong Diagnosis", "Harassment", "Fake Information", "Other"]).optional(),
    }),
});
