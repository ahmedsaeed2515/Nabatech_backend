"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOutbreakMonitor = startOutbreakMonitor;
// FIX [TASK-7.1]: Monitor diagnosis history for local disease outbreaks
const node_cron_1 = __importDefault(require("node-cron"));
const mongoose_1 = __importDefault(require("mongoose"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
function startOutbreakMonitor() {
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days
        const outbreaks = await diagnosis_history_model_1.default.aggregate([
            { $match: { createdAt: { $gte: since }, 'location.country': { $exists: true } } },
            {
                $group: {
                    _id: { disease: '$diseaseNameEn', country: '$location.country' },
                    count: { $sum: 1 },
                    affectedUsers: { $addToSet: '$userId' }
                }
            },
            { $match: { count: { $gte: 10 } } }
        ]);
        for (const outbreak of outbreaks) {
            const { disease, country } = outbreak._id;
            const existingAlert = await community_post_model_1.default.findOne({
                plantTag: 'Pests',
                'metadata.disease': disease,
                createdAt: { $gte: since }
            });
            if (!existingAlert) {
                await community_post_model_1.default.create({
                    author: new mongoose_1.default.Types.ObjectId("000000000000000000000000"), // Admin/System user
                    authorName: "Nabatech Alert System",
                    title: `🚨 Disease Alert: ${disease}`,
                    content: `🚨 Disease Alert: ${disease} has been reported by ${outbreak.count} users in ${country} over the past 2 weeks. Check your plants and take preventive measures.`,
                    plantTag: 'Pests',
                    status: 'visible',
                    metadata: { disease, country, reportCount: outbreak.count }
                });
                console.log(`[Outbreak] Alert created: ${disease} in ${country} (${outbreak.count} reports)`);
            }
        }
    });
}
