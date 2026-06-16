import request from "supertest";
import bcrypt from "bcrypt";
import app from "../app";
import User from "../models/user_model";
import MyPlant from "../models/my_plant_model";
import Reminder from "../models/reminder_model";
import CommunityPost from "../models/community_post_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db.setup";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Dashboard Stats API Endpoints", () => {
  let adminToken: string;
  let adminId: string;
  let userToken: string;

  beforeEach(async () => {
    // 1. Create standard user
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Standard Farmer",
        email: "farmer@example.com",
        password: "Password123"
      });
    userToken = userRes.body.token;

    // 2. Create admin user with properly hashed password
    const hashedPassword = await bcrypt.hash("Password123", 10);
    const adminUser = await User.create({
      name: "Super Admin",
      email: "superadmin@example.com",
      password: hashedPassword,
      role: "admin"
    });
    adminId = adminUser._id.toString();

    // Login admin
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "superadmin@example.com",
        password: "Password123"
      });
    adminToken = loginRes.body.token;
  });

  describe("GET /api/users/dashboard-stats", () => {
    it("should reject access if no token is provided", async () => {
      const res = await request(app).get("/api/users/dashboard-stats");
      expect(res.status).toBe(401);
    });

    it("should reject access (403 Forbidden) if a standard user tries to fetch dashboard stats", async () => {
      const res = await request(app)
        .get("/api/users/dashboard-stats")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Access denied: Requires one of");
    });

    it("should successfully return all metrics, daily counts, and breakdown charts for authenticated admin", async () => {
      // 1. Create mock data to populate collections
      await MyPlant.create({
        user: adminId,
        name: "Admin Rose",
        species: "Rosa",
        location: "outdoor",
        waterFrequencyDays: 3
      });

      // Fixed: included all required validation fields for Reminder model (title, plantId, timeLabel)
      await Reminder.create({
        user: adminId,
        title: "Water Admin Rose",
        plantId: "650c1f2e9f1a2c3d4e5f6a7b",
        timeLabel: "Every 3 days at 08:00 AM",
        enabled: true
      });

      await CommunityPost.create({
        author: adminId,
        authorName: "Super Admin",
        title: "Announcing new features!",
        content: "We have updated the diagnosis prediction space today.",
        plantTag: "General"
      });

      await DiagnosisHistory.create({
        user: adminId,
        imageUrl: "https://res.cloudinary.com/dummy/image/upload/v1/leaves.jpg",
        diseaseNameEn: "powdery mildew",
        diseaseNameAr: "البياض الدقيقي",
        confidence: 0.95,
        severity: "high",
        isOffline: false,
        diagnosedAt: new Date()
      });

      await DiagnosisHistory.create({
        user: adminId,
        imageUrl: "https://res.cloudinary.com/dummy/image/upload/v2/leaves.jpg",
        diseaseNameEn: "healthy",
        diseaseNameAr: "سليم",
        confidence: 0.98,
        severity: "low",
        isOffline: true,
        diagnosedAt: new Date()
      });

      // 2. Query dashboard-stats as Admin
      const res = await request(app)
        .get("/api/users/dashboard-stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify general count fields
      expect(res.body.totalUsers).toBe(2); // Regular + Admin
      expect(res.body.totalDiagnoses).toBe(2);
      expect(res.body.totalPosts).toBe(1);
      expect(res.body.activeReminders).toBe(1);

      // Verify daily diagnoses aggregated array
      expect(res.body.dailyDiagnoses).toBeDefined();
      expect(res.body.dailyDiagnoses.length).toBeGreaterThan(0);
      expect(res.body.dailyDiagnoses[0].count).toBe(2);

      // Verify top diseases breakdown list
      expect(res.body.topDiseases).toBeDefined();
      expect(res.body.topDiseases).toHaveLength(2);
      expect(res.body.topDiseases.map((d: any) => d.name)).toContain("powdery mildew");
      expect(res.body.topDiseases.map((d: any) => d.name)).toContain("healthy");

      // Verify offline vs remote pie metrics
      expect(res.body.offlineVsRemote.offline).toBe(1);
      expect(res.body.offlineVsRemote.remote).toBe(1);

      // Verify nested dual-compatibility 'stats' object exists
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalUsers).toBe(2);
      expect(res.body.stats.totalPlants).toBe(1);
      expect(res.body.stats.scanDistribution).toHaveLength(2);
      expect(res.body.stats.scanDistribution[0].value).toBe(1); // Remote
      expect(res.body.stats.scanDistribution[1].value).toBe(1); // Offline
    });
  });

  describe("GET /api/admin/diagnoses", () => {
    it("should offset paginate admin diagnoses", async () => {
      // Create some mock data
      await DiagnosisHistory.create({
        user: adminId,
        imageUrl: "https://example.com/1.jpg",
        diseaseNameEn: "powdery mildew",
        diseaseNameAr: "البياض الدقيقي",
        confidence: 0.95,
        severity: "high",
        diagnosedAt: new Date()
      });
      await DiagnosisHistory.create({
        user: adminId,
        imageUrl: "https://example.com/2.jpg",
        diseaseNameEn: "healthy",
        diseaseNameAr: "سليم",
        confidence: 0.99,
        severity: "low",
        diagnosedAt: new Date()
      });

      const res = await request(app)
        .get("/api/admin/diagnoses?page=1&limit=1&severity=high")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].severity).toBe("high");
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.totalPages).toBe(1);
    });
  });

  describe("GET /api/admin/diagnoses/analytics", () => {
    it("should return diagnosis analytics for admins", async () => {
      const res = await request(app)
        .get("/api/admin/diagnoses/analytics?timeZone=UTC")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totals).toBeDefined();
      expect(res.body.data.byDay).toBeDefined();
      expect(res.body.data.bySeverity).toBeDefined();
      expect(res.body.data.topDiseases).toBeDefined();
      expect(res.body.data.offlineVsRemote).toBeDefined();
    });
  });
});
