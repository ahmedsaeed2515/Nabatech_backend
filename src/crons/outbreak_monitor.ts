// FIX [TASK-7.1]: Monitor diagnosis history for local disease outbreaks
import cron from 'node-cron';
import mongoose from 'mongoose';
import DiagnosisHistoryModel from '../models/diagnosis_history_model';
import CommunityPostModel from '../models/community_post_model';

export function startOutbreakMonitor() {
  cron.schedule('0 */6 * * *', async () => { // Every 6 hours
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days

    const outbreaks = await DiagnosisHistoryModel.aggregate([
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
      const existingAlert = await CommunityPostModel.findOne({
        plantTag: 'Pests',
        'metadata.disease': disease,
        createdAt: { $gte: since }
      });

      if (!existingAlert) {
        await CommunityPostModel.create({
          author: new mongoose.Types.ObjectId("000000000000000000000000"), // Admin/System user
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


