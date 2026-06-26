import request from "supertest";
import app from "../app";
import CommunityPost from "../models/community_post_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import Reminder from "../models/reminder_model";
import { clearTestDB, connectTestDB, disconnectTestDB } from "./db.setup";
import { createAdminUser, createTestUser, getAuthToken } from "./helpers/auth.helper";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Admin Tests", () => {
  describe("GET /api/users", () => {
    it("admin gets all users", async () => {
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin.email, admin.password);
      await createTestUser();

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    });

    it("regular user gets 403", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/users/dashboard-stats", () => {
    it("returns all required fields", async () => {
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin.email, admin.password);

      await CommunityPost.create({
        author: admin.user!._id,
        authorName: "Admin",
        title: "Valid title",
        content: "This is valid content with enough length",
        plantTag: "General"
      });

      await Reminder.create({
        user: admin.user!._id,
        title: "Water basil",
        plantId: "650c1f2e9f1a2c3d4e5f6a7b",
        timeLabel: "Daily at 8:00",
        enabled: true
      });

      await DiagnosisHistory.create({
        user: admin.user!._id,
        imageUrl: "https://example.com/leaf.jpg",
        diseaseNameEn: "powdery mildew",
        diseaseNameAr: "ÇáÈíÇÖ ÇáÏÞíÞí",
        confidence: 0.9,
        severity: "high",
        isOffline: false,
        diagnosedAt: new Date()
      });

      const res = await request(app)
        .get("/api/users/dashboard-stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeDefined();
      expect(res.body.totalDiagnoses).toBeDefined();
      expect(res.body.totalPosts).toBeDefined();
      expect(res.body.activeReminders).toBeDefined();
      expect(Array.isArray(res.body.dailyDiagnoses)).toBe(true);
      expect(Array.isArray(res.body.topDiseases)).toBe(true);
      expect(res.body.offlineVsRemote).toBeDefined();
    });
  });

  describe("PUT /api/users/:id/role", () => {
    it("admin can change role", async () => {
      const admin = await createAdminUser();
      const adminToken = await getAuthToken(admin.email, admin.password);
      const user = await createTestUser();

      const res = await request(app)
        .put(`/api/users/${user.user!._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "admin" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe("admin");
    });

    it("regular user gets 403", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);
      const target = await createTestUser();

      const res = await request(app)
        .put(`/api/users/${target.user!._id}/role`)
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "admin" });

      expect(res.status).toBe(403);
    });
  });
});


