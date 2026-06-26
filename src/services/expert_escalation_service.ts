import ExpertEscalation from "../models/expert_escalation_model";
import { NotificationService } from "./NotificationService";
import { UserRepository } from "../repositories/UserRepository";

export class ExpertEscalationService {
  static notificationService = new NotificationService();
  static userRepo = new UserRepository();

  static async requestExpertReview(args: {
    userId: string;
    aiPrediction?: string;
    aiConfidence?: number;
    userContext?: string;
    imagePath?: string;
  }) {
    const request = new ExpertEscalation({
      userId: args.userId,
      aiPrediction: args.aiPrediction,
      aiConfidence: args.aiConfidence,
      userContext: args.userContext,
      imagePath: args.imagePath,
      status: "pending",
    });

    await request.save();

    console.log(`[EXPERT_ESCALATION] Created request ${request._id} for user ${args.userId}`);
    
    // Notify experts based on matching interests, fallback to all experts
    try {
      // Find experts whose interests include the disease (case-insensitive) or general 'Plant Pathology'
      let experts = await this.userRepo.find({
        role: "expert",
        interests: { 
          $in: [
            new RegExp(`^${args.aiPrediction}$`, 'i'),
            new RegExp('^Plant Pathology$', 'i'),
            new RegExp('^Diagnosis$', 'i')
          ] 
        }
      } as any);

      // If no specialized experts found, fallback to all experts
      if (experts.length === 0) {
        experts = await this.userRepo.find({ role: "expert" } as any);
      }

      for (const expert of experts) {
        if (expert.fcmToken) {
          await this.notificationService.sendPushNotification(
            expert.fcmToken,
            {
              notification: {
                title: "New AI Escalation Request",
                body: `A low-confidence diagnosis (${(args.aiConfidence! * 100).toFixed(0)}%) for ${args.aiPrediction} requires human review.`
              },
              data: { type: "EXPERT_ESCALATION", requestId: request._id.toString() }
            }
          );
        }
      }
    } catch (e) {
      console.error("[EXPERT_ESCALATION] Failed to send notifications:", e);
    }
    
    return request;
  }

  static async getPendingRequests() {
    return ExpertEscalation.find({ status: "pending" }).sort({ createdAt: 1 });
  }

  static async updateRequestStatus(requestId: string, status: "reviewed" | "rejected", expertId: string, expertResponse: string) {
    const request = await ExpertEscalation.findByIdAndUpdate(
      requestId,
      { status, expertId, expertResponse },
      { new: true }
    );
    
    if (!request) {
      throw new Error("Escalation request not found");
    }

    // ✅ FIX: Notify the original user that their escalation was reviewed
    try {
      const user = await this.userRepo.findById(request.userId.toString());
      if (user?.fcmToken) {
        const statusText = status === "reviewed" ? "reviewed ✅" : "processed";
        await this.notificationService.sendPushNotification(user.fcmToken, {
          notification: {
            title: status === "reviewed" ? "Expert Review Complete ✅" : "Diagnosis Update",
            body: `An expert has ${statusText} your plant diagnosis. ${expertResponse.substring(0, 100)}`
          },
          data: {
            type: "EXPERT_REVIEW_COMPLETE",
            requestId: request._id.toString(),
            status
          }
        });
        console.log(`[EXPERT_ESCALATION] User ${request.userId} notified of ${status} review.`);
      } else {
        console.log(`[EXPERT_ESCALATION] Request ${requestId} reviewed. User has no FCM token — skipping push.`);
      }
    } catch (notifErr) {
      console.error("[EXPERT_ESCALATION] Failed to notify original user:", notifErr);
    }

    return request;
  }
}


