import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

export const createReportSchema = z.object({
  body: z.object({
    reportedEntityId: objectIdSchema,
    entityModel: z.enum(["CommunityPost", "CommentV2"]),
    reason: z.enum(["Spam", "Wrong Diagnosis", "Harassment", "Fake Information", "Other"]),
    details: z.string().max(500).optional(),
  }),
});

export const updateReportStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Used to validate the query params for fetching reports
export const getReportsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
    status: z.enum(["Pending", "Resolved", "Dismissed"]).optional(),
    reason: z.enum(["Spam", "Wrong Diagnosis", "Harassment", "Fake Information", "Other"]).optional(),
  }),
});
