import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import User from "../../models/user_model";
import generateToken from "../../utils/generateToken";
import { MongoMemoryServer } from "mongodb-memory-server";
import NotificationModel from "../../models/notification_model";
import DiagnosisHistory from "../../models/diagnosis_history_model";
import OutbreakSpot from "../../models/outbreak_spot_model";

describe("Real API Outputs Verification", () => {
  let mongoServer: MongoMemoryServer;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const user = await User.create({
      name: "Test User",
      email: "test_docs@nabatech.com",
      password: "Password123!",
    });
    userId = user._id.toString();
    token = generateToken(userId, "user", 0);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("1. My Plants API", async () => {
    const addPlantReq = {
      name: "Ficus Lyrata",
      species: "Ficus",
      location: "indoor",
      waterFrequencyDays: 5,
      lastWatered: new Date().toISOString(),
      healthStatus: "Healthy",
      clientOperationId: "123e4567-e89b-12d3-a456-426614174000"
    };
    
    console.log("=== My Plants API ===");
    console.log("[POST] /api/my-plants Input:", JSON.stringify(addPlantReq, null, 2));
    
    let res = await request(app)
      .post("/api/my-plants")
      .set("Authorization", `Bearer ${token}`)
      .send(addPlantReq);
      
    console.log("[POST] /api/my-plants Output:", JSON.stringify(res.body, null, 2));

    res = await request(app).get("/api/my-plants").set("Authorization", `Bearer ${token}`);
    console.log("[GET] /api/my-plants Output:", JSON.stringify(res.body, null, 2));
  });

  it("2. Notifications API", async () => {
    const notif = await NotificationModel.create({
      user: userId,
      title: "Old Title",
      body: "Old Body",
      titleAr: "إشعار تجريبي",
      titleEn: "Test Notification",
      bodyAr: "هذا إشعار لتجربة الـ API",
      bodyEn: "This is an API test notification",
      type: "WATERING_REMINDER",
      read: false
    });

    console.log("=== Notifications API ===");
    let res = await request(app).get("/api/notifications").set("Authorization", `Bearer ${token}`);
    console.log("[GET] /api/notifications Output:", JSON.stringify(res.body, null, 2));

    res = await request(app).put(`/api/notifications/${notif._id}/read`).set("Authorization", `Bearer ${token}`);
    console.log(`[PUT] /api/notifications/read Output:`, JSON.stringify(res.body, null, 2));
  });

  it("3. Diagnosis History API", async () => {
    const diag = await DiagnosisHistory.create({
      user: userId,
      imageUrl: "https://example.com/plant.jpg",
      diseaseNameAr: "مرض تجريبي",
      diseaseNameEn: "Test Disease",
      confidence: 0.95,
      severity: "high",
      isOffline: false,
      version: 1
    });

    console.log("=== Diagnosis History API ===");
    let res = await request(app).get("/api/history").set("Authorization", `Bearer ${token}`);
    console.log("[GET] /api/history Output:", JSON.stringify(res.body, null, 2));

    const feedbackReq = { status: "confirmed", version: 1, clientOperationId: "abc-123" };
    console.log("[PUT] /api/history/:id/feedback Input:", JSON.stringify(feedbackReq, null, 2));
    
    res = await request(app)
      .put(`/api/history/${diag._id}/feedback`)
      .set("Authorization", `Bearer ${token}`)
      .send(feedbackReq);
      
    console.log("[PUT] /api/history/:id/feedback Output:", JSON.stringify(res.body, null, 2));
  });

  it("4. Disease Map API", async () => {
    await OutbreakSpot.create({
      region: "Riyadh",
      disease: "Leaf Spot",
      severity: "high",
      cases: 42,
      trendPercent: 12,
      mapX: 0.5,
      mapY: 0.5,
      colorHex: "#FF0000"
    });

    console.log("=== Disease Map API ===");
    let res = await request(app).get("/api/explore/outbreaks").set("Authorization", `Bearer ${token}`);
    console.log("[GET] /api/explore/outbreaks Output:", JSON.stringify(res.body, null, 2));
  });
});
