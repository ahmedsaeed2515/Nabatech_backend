"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const db_setup_1 = require("./db.setup");
const auth_helper_1 = require("./helpers/auth.helper");
const user_model_1 = __importDefault(require("../models/user_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const comment_model_1 = __importDefault(require("../models/comment_model"));
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
beforeAll(async () => {
    await (0, db_setup_1.connectTestDB)();
});
afterAll(async () => {
    await (0, db_setup_1.disconnectTestDB)();
});
beforeEach(async () => {
    await (0, db_setup_1.clearTestDB)();
});
describe("Users Profile & Settings API", () => {
    describe("PUT /api/users/profile", () => {
        it("successfully updates user preferences", async () => {
            const { email, password, user } = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(email, password);
            const res = await (0, supertest_1.default)(app_1.default)
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
            const dbUser = await user_model_1.default.findById(user?._id);
            expect(dbUser?.preferences?.theme).toBe("dark");
            expect(dbUser?.preferences?.language).toBe("ar");
        });
    });
    describe("PUT /api/users/fcm-token", () => {
        it("successfully updates the user FCM token", async () => {
            const { email, password, user } = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(email, password);
            const res = await (0, supertest_1.default)(app_1.default)
                .put("/api/users/fcm-token")
                .set("Authorization", `Bearer ${token}`)
                .send({ token: "test_fcm_token_123" });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const dbUser = await user_model_1.default.findById(user?._id);
            expect(dbUser?.fcmToken).toBe("test_fcm_token_123");
        });
    });
    describe("DELETE /api/users/:id", () => {
        it("successfully deletes the user and cascades data deletion", async () => {
            const { email, password, user } = await (0, auth_helper_1.createTestUser)();
            const adminAuth = await (0, auth_helper_1.createTestUser)("admin");
            const adminToken = await (0, auth_helper_1.getAuthToken)(adminAuth.email, adminAuth.password);
            // Seed cascade dummy data
            const post = await community_post_model_1.default.create({
                author: user?._id,
                authorName: user?.name,
                plantTag: "General",
                title: "Test Post",
                content: "Content",
            });
            await comment_model_1.default.create({
                post: post._id,
                author: user?._id,
                authorName: user?.name,
                text: "Comment text",
            });
            await my_plant_model_1.default.create({
                user: user?._id,
                name: "My Plant",
                species: "Species",
                location: "indoor",
                waterFrequencyDays: 3,
            });
            await diary_entry_model_1.default.create({
                user: user?._id,
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                title: "Title",
                notes: "Notes",
            });
            await reminder_model_1.default.create({
                user: user?._id,
                title: "Title",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                timeLabel: "Morning",
            });
            await diagnosis_history_model_1.default.create({
                user: user?._id,
                imageUrl: "url",
                diseaseNameAr: "مرض",
                diseaseNameEn: "Disease",
                confidence: 0.9,
            });
            // Verify data exists
            expect(await community_post_model_1.default.countDocuments({ author: user?._id })).toBe(1);
            expect(await comment_model_1.default.countDocuments({ author: user?._id })).toBe(1);
            expect(await my_plant_model_1.default.countDocuments({ user: user?._id })).toBe(1);
            expect(await diary_entry_model_1.default.countDocuments({ user: user?._id })).toBe(1);
            expect(await reminder_model_1.default.countDocuments({ user: user?._id })).toBe(1);
            expect(await diagnosis_history_model_1.default.countDocuments({ user: user?._id })).toBe(1);
            // Delete User via API
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/users/${user?._id}`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            // Verify user is gone
            const deletedUser = await user_model_1.default.findById(user?._id);
            expect(deletedUser).toBeNull();
            // Verify all cascade data is gone
            expect(await community_post_model_1.default.countDocuments({ author: user?._id })).toBe(0);
            expect(await comment_model_1.default.countDocuments({ author: user?._id })).toBe(0);
            expect(await my_plant_model_1.default.countDocuments({ user: user?._id })).toBe(0);
            expect(await diary_entry_model_1.default.countDocuments({ user: user?._id })).toBe(0);
            expect(await reminder_model_1.default.countDocuments({ user: user?._id })).toBe(0);
            expect(await diagnosis_history_model_1.default.countDocuments({ user: user?._id })).toBe(0);
        });
    });
    describe("GET /api/users/:id/details", () => {
        it("successfully fetches user details and statistics", async () => {
            const { email, password, user } = await (0, auth_helper_1.createTestUser)();
            const adminAuth = await (0, auth_helper_1.createTestUser)("admin");
            const adminToken = await (0, auth_helper_1.getAuthToken)(adminAuth.email, adminAuth.password);
            // Seed dummy data to test counts
            await my_plant_model_1.default.create({ user: user?._id, name: "Plant", species: "Species", location: "indoor", waterFrequencyDays: 3 });
            await my_plant_model_1.default.create({ user: user?._id, name: "Plant 2", species: "Species", location: "indoor", waterFrequencyDays: 3 });
            await reminder_model_1.default.create({ user: user?._id, title: "Title", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "Morning" });
            await diagnosis_history_model_1.default.create({ user: user?._id, imageUrl: "url", diseaseNameAr: "مرض", diseaseNameEn: "Disease", confidence: 0.9 });
            await diagnosis_history_model_1.default.create({ user: user?._id, imageUrl: "url", diseaseNameAr: "مرض", diseaseNameEn: "Disease", confidence: 0.9 });
            await diagnosis_history_model_1.default.create({ user: user?._id, imageUrl: "url", diseaseNameAr: "مرض", diseaseNameEn: "Disease", confidence: 0.9 });
            await community_post_model_1.default.create({ author: user?._id, authorName: user?.name, plantTag: "General", title: "Post", content: "Content" });
            const res = await (0, supertest_1.default)(app_1.default)
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
