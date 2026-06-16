import request from "supertest";
import app from "../app";
import { clearTestDB, connectTestDB, disconnectTestDB } from "./db.setup";
import { createTestUser, getAuthToken } from "./helpers/auth.helper";
import User from "../models/user_model";
import CommunityPost from "../models/community_post_model";
import Comment from "../models/comment_model";
import MyPlant from "../models/my_plant_model";
import DiaryEntry from "../models/diary_entry_model";
import Reminder from "../models/reminder_model";
import DiagnosisHistory from "../models/diagnosis_history_model";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Users Profile & Settings API", () => {
  describe("PUT /api/users/profile", () => {
    it("successfully updates user preferences", async () => {
      const { email, password, user } = await createTestUser();
      const token = await getAuthToken(email, password);

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          preferences: {
            theme: "dark",
            language: "ar",
            notificationsEnabled: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.preferences.theme).toBe("dark");
      expect(res.body.user.preferences.language).toBe("ar");
      expect(res.body.user.preferences.notificationsEnabled).toBe(false);

      // Verify in DB
      const dbUser = await User.findById(user?._id);
      expect(dbUser?.preferences?.theme).toBe("dark");
      expect(dbUser?.preferences?.language).toBe("ar");
    });
  });

  describe("PUT /api/users/fcm-token", () => {
    it("successfully updates the user FCM token", async () => {
      const { email, password, user } = await createTestUser();
      const token = await getAuthToken(email, password);

      const res = await request(app)
        .put("/api/users/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: "test_fcm_token_123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await User.findById(user?._id);
      expect(dbUser?.fcmToken).toBe("test_fcm_token_123");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("successfully deletes the user and cascades data deletion", async () => {
      const { email, password, user } = await createTestUser();
      const adminAuth = await createTestUser("admin");
      const adminToken = await getAuthToken(adminAuth.email, adminAuth.password);

      // Seed cascade dummy data
      const post = await CommunityPost.create({
        author: user?._id,
        authorName: user?.name,
        plantTag: "General",
        title: "Test Post",
        content: "Content",
      });

      await Comment.create({
        post: post._id,
        author: user?._id,
        authorName: user?.name,
        text: "Comment text",
      });

      await MyPlant.create({
        user: user?._id,
        name: "My Plant",
        species: "Species",
        location: "indoor",
        waterFrequencyDays: 3,
      });

      await DiaryEntry.create({
        user: user?._id,
        plantId: "650c1f2e9f1a2c3d4e5f6a7b",
        title: "Title",
        notes: "Notes",
      });

      await Reminder.create({
        user: user?._id,
        title: "Title",
        plantId: "650c1f2e9f1a2c3d4e5f6a7b",
        timeLabel: "Morning",
      });

      await DiagnosisHistory.create({
        user: user?._id,
        imageUrl: "url",
        diseaseNameAr: "مرض",
        diseaseNameEn: "Disease",
        confidence: 0.9,
      });

      // Verify data exists
      expect(await CommunityPost.countDocuments({ author: user?._id })).toBe(1);
      expect(await Comment.countDocuments({ author: user?._id })).toBe(1);
      expect(await MyPlant.countDocuments({ user: user?._id })).toBe(1);
      expect(await DiaryEntry.countDocuments({ user: user?._id })).toBe(1);
      expect(await Reminder.countDocuments({ user: user?._id })).toBe(1);
      expect(await DiagnosisHistory.countDocuments({ user: user?._id })).toBe(1);

      // Delete User via API
      const res = await request(app)
        .delete(`/api/users/${user?._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify user is gone
      const deletedUser = await User.findById(user?._id);
      expect(deletedUser).toBeNull();

      // Verify all cascade data is gone
      expect(await CommunityPost.countDocuments({ author: user?._id })).toBe(0);
      expect(await Comment.countDocuments({ author: user?._id })).toBe(0);
      expect(await MyPlant.countDocuments({ user: user?._id })).toBe(0);
      expect(await DiaryEntry.countDocuments({ user: user?._id })).toBe(0);
      expect(await Reminder.countDocuments({ user: user?._id })).toBe(0);
      expect(await DiagnosisHistory.countDocuments({ user: user?._id })).toBe(0);
    });
  });

  describe("GET /api/users/:id/details", () => {
    it("successfully fetches user details and statistics", async () => {
      const { email, password, user } = await createTestUser();
      const adminAuth = await createTestUser("admin");
      const adminToken = await getAuthToken(adminAuth.email, adminAuth.password);

      // Seed dummy data to test counts
      await MyPlant.create({ user: user?._id, name: "Plant", species: "Species", location: "indoor", waterFrequencyDays: 3 });
      await MyPlant.create({ user: user?._id, name: "Plant 2", species: "Species", location: "indoor", waterFrequencyDays: 3 });
      
      await Reminder.create({ user: user?._id, title: "Title", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "Morning" });
      
      await DiagnosisHistory.create({ user: user?._id, imageUrl: "url", diseaseNameAr: "مرض", diseaseNameEn: "Disease", confidence: 0.9 });
      await DiagnosisHistory.create({ user: user?._id, imageUrl: "url", diseaseNameAr: "مرض", diseaseNameEn: "Disease", confidence: 0.9 });
      await DiagnosisHistory.create({ user: user?._id, imageUrl: "url", diseaseNameAr: "مرض", diseaseNameEn: "Disease", confidence: 0.9 });

      await CommunityPost.create({ author: user?._id, authorName: user?.name, plantTag: "General", title: "Post", content: "Content" });

      const res = await request(app)
        .get(`/api/users/${user?._id}/details`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.plants).toBe(2);
      expect(res.body.stats.reminders).toBe(1);
      expect(res.body.stats.diagnoses).toBe(3);
      expect(res.body.stats.posts).toBe(1);
      expect(res.body.stats.diaries).toBe(0);
    });
  });
});
