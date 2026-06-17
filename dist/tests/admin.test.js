"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
const db_setup_1 = require("./db.setup");
const auth_helper_1 = require("./helpers/auth.helper");
beforeAll(async () => {
    await (0, db_setup_1.connectTestDB)();
});
afterAll(async () => {
    await (0, db_setup_1.disconnectTestDB)();
});
beforeEach(async () => {
    await (0, db_setup_1.clearTestDB)();
});
describe("Admin Tests", () => {
    describe("GET /api/users", () => {
        it("admin gets all users", async () => {
            const admin = await (0, auth_helper_1.createAdminUser)();
            const adminToken = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
            await (0, auth_helper_1.createTestUser)();
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/users")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body.users.length).toBeGreaterThanOrEqual(2);
        });
        it("regular user gets 403", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/users")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(403);
        });
    });
    describe("GET /api/users/dashboard-stats", () => {
        it("returns all required fields", async () => {
            const admin = await (0, auth_helper_1.createAdminUser)();
            const adminToken = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
            await community_post_model_1.default.create({
                author: admin.user._id,
                authorName: "Admin",
                title: "Valid title",
                content: "This is valid content with enough length",
                plantTag: "General"
            });
            await reminder_model_1.default.create({
                user: admin.user._id,
                title: "Water basil",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                timeLabel: "Daily at 8:00",
                enabled: true
            });
            await diagnosis_history_model_1.default.create({
                user: admin.user._id,
                imageUrl: "https://example.com/leaf.jpg",
                diseaseNameEn: "powdery mildew",
                diseaseNameAr: "������ �������",
                confidence: 0.9,
                severity: "high",
                isOffline: false,
                diagnosedAt: new Date()
            });
            const res = await (0, supertest_1.default)(app_1.default)
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
            const admin = await (0, auth_helper_1.createAdminUser)();
            const adminToken = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
            const user = await (0, auth_helper_1.createTestUser)();
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/users/${user.user._id}/role`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "admin" });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.role).toBe("admin");
        });
        it("regular user gets 403", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const target = await (0, auth_helper_1.createTestUser)();
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/users/${target.user._id}/role`)
                .set("Authorization", `Bearer ${token}`)
                .send({ role: "admin" });
            expect(res.status).toBe(403);
        });
    });
});
