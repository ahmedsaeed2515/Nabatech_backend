"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const generateToken_1 = __importDefault(require("../../utils/generateToken"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const notification_model_1 = __importDefault(require("../../models/notification_model"));
const diagnosis_history_model_1 = __importDefault(require("../../models/diagnosis_history_model"));
const outbreak_spot_model_1 = __importDefault(require("../../models/outbreak_spot_model"));
describe("Real API Outputs Verification", () => {
    let mongoServer;
    let token;
    let userId;
    beforeAll(async () => {
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        await mongoose_1.default.connect(mongoServer.getUri());
        const user = await user_model_1.default.create({
            name: "Test User",
            email: "test_docs@nabatech.com",
            password: "Password123!",
        });
        userId = user._id.toString();
        token = (0, generateToken_1.default)(userId, "user", 0);
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
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
        let res = await (0, supertest_1.default)(app_1.default)
            .post("/api/my-plants")
            .set("Authorization", `Bearer ${token}`)
            .send(addPlantReq);
        console.log("[POST] /api/my-plants Output:", JSON.stringify(res.body, null, 2));
        res = await (0, supertest_1.default)(app_1.default).get("/api/my-plants").set("Authorization", `Bearer ${token}`);
        console.log("[GET] /api/my-plants Output:", JSON.stringify(res.body, null, 2));
    });
    it("2. Notifications API", async () => {
        const notif = await notification_model_1.default.create({
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
        let res = await (0, supertest_1.default)(app_1.default).get("/api/notifications").set("Authorization", `Bearer ${token}`);
        console.log("[GET] /api/notifications Output:", JSON.stringify(res.body, null, 2));
        res = await (0, supertest_1.default)(app_1.default).put(`/api/notifications/${notif._id}/read`).set("Authorization", `Bearer ${token}`);
        console.log(`[PUT] /api/notifications/read Output:`, JSON.stringify(res.body, null, 2));
    });
    it("3. Diagnosis History API", async () => {
        const diag = await diagnosis_history_model_1.default.create({
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
        let res = await (0, supertest_1.default)(app_1.default).get("/api/history").set("Authorization", `Bearer ${token}`);
        console.log("[GET] /api/history Output:", JSON.stringify(res.body, null, 2));
        const feedbackReq = { status: "confirmed", version: 1, clientOperationId: "abc-123" };
        console.log("[PUT] /api/history/:id/feedback Input:", JSON.stringify(feedbackReq, null, 2));
        res = await (0, supertest_1.default)(app_1.default)
            .put(`/api/history/${diag._id}/feedback`)
            .set("Authorization", `Bearer ${token}`)
            .send(feedbackReq);
        console.log("[PUT] /api/history/:id/feedback Output:", JSON.stringify(res.body, null, 2));
    });
    it("4. Disease Map API", async () => {
        await outbreak_spot_model_1.default.create({
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
        let res = await (0, supertest_1.default)(app_1.default).get("/api/explore/outbreaks").set("Authorization", `Bearer ${token}`);
        console.log("[GET] /api/explore/outbreaks Output:", JSON.stringify(res.body, null, 2));
    });
});
