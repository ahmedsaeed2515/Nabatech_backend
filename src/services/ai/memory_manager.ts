import AiMemory from "../../models/ai_memory_model";

export class MemoryManager {
  static async saveShortTermMemory(userId: string, key: string, value: any, ttlMinutes: number = 60) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const existing = await AiMemory.findOne({ userId, type: "short_term", key });
    if (existing) {
      console.log(`[MEMORY_MANAGER] Overwriting short_term memory for user ${userId}: key=${key}`);
    }
    await AiMemory.findOneAndUpdate(
      { userId, type: "short_term", key },
      { value, expiresAt },
      { upsert: true, new: true }
    );
  }

  static async getShortTermMemory(userId: string, key: string) {
    const record = await AiMemory.findOne({ userId, type: "short_term", key });
    if (!record || (record.expiresAt && record.expiresAt < new Date())) {
      return null;
    }
    return record.value;
  }

  static async saveLongTermMemory(userId: string, key: string, value: any) {
    await AiMemory.findOneAndUpdate(
      { userId, type: "long_term", key },
      { value },
      { upsert: true, new: true }
    );
  }

  static async getLongTermMemory(userId: string, key: string) {
    const record = await AiMemory.findOne({ userId, type: "long_term", key });
    return record?.value;
  }

  static async getAllContext(userId: string) {
    const records = await AiMemory.find({ userId });
    const now = new Date();
    
    const context = {
      shortTerm: {} as Record<string, any>,
      longTerm: {} as Record<string, any>
    };

    records.forEach(r => {
      if (r.type === "short_term" && (!r.expiresAt || r.expiresAt > now)) {
        context.shortTerm[r.key] = r.value;
      } else if (r.type === "long_term") {
        context.longTerm[r.key] = r.value;
      }
    });

    return context;
  }
}
