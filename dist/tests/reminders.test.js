"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
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
describe("Reminders API", () => {
    describe("GET /api/reminders", () => {
        it("returns user's reminders with pagination", async () => {
            const userA = await (0, auth_helper_1.createTestUser)();
            const tokenA = await (0, auth_helper_1.getAuthToken)(userA.email, userA.password);
            // Create 3 reminders
            const r1 = await reminder_model_1.default.create({ user: userA.user._id, title: "1", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "1" });
            const r2 = await reminder_model_1.default.create({ user: userA.user._id, title: "2", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "2" });
            const r3 = await reminder_model_1.default.create({ user: userA.user._id, title: "3", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "3" });
            // Get page 1 (limit 2)
            const res1 = await (0, supertest_1.default)(app_1.default)
                .get("/api/reminders?limit=2")
                .set("Authorization", `Bearer ${tokenA}`);
            expect(res1.status).toBe(200);
            expect(res1.body.data.items).toHaveLength(2);
            expect(res1.body.data.pageInfo.hasNextPage).toBe(true);
            expect(res1.body.data.items[0].title).toBe("3"); // Descending order
            expect(res1.body.data.items[1].title).toBe("2");
            const cursor = res1.body.data.pageInfo.nextCursor;
            // Get page 2
            const res2 = await (0, supertest_1.default)(app_1.default)
                .get(`/api/reminders?limit=2&cursor=${cursor}`)
                .set("Authorization", `Bearer ${tokenA}`);
            expect(res2.status).toBe(200);
            expect(res2.body.data.items).toHaveLength(1);
            expect(res2.body.data.pageInfo.hasNextPage).toBe(false);
            expect(res2.body.data.items[0].title).toBe("1");
        });
    });
    describe("POST /api/reminders", () => {
        it("creates a reminder with new schedule fields", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/reminders")
                .set("Authorization", `Bearer ${token}`)
                .send({
                title: "Water Tomato",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                scheduledAt: new Date().toISOString(),
                timeZone: "America/New_York",
                recurrence: "daily"
            });
            expect(res.status).toBe(201);
            expect(res.body.data.reminder.title).toBe("Water Tomato");
            expect(res.body.data.reminder.timeZone).toBe("America/New_York");
            expect(res.body.data.reminder.recurrence).toBe("daily");
        });
        it("rejects invalid timeZone", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/reminders")
                .set("Authorization", `Bearer ${token}`)
                .send({
                title: "Water Tomato",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                timeZone: "Invalid/Zone",
            });
            expect(res.status).toBe(400);
            expect(res.body.errorCode).toBe("VALIDATION_FAILED");
        });
        it("enforces idempotency with clientOperationId", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const payload = {
                title: "Test Idempotency",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                clientOperationId: "unique-op-123"
            };
            const res1 = await (0, supertest_1.default)(app_1.default)
                .post("/api/reminders")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);
            expect(res1.status).toBe(201);
            const res2 = await (0, supertest_1.default)(app_1.default)
                .post("/api/reminders")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);
            expect(res2.status).toBe(409);
            expect(res2.body.errorCode).toBe("CONFLICT");
        });
    });
    describe("PUT /api/reminders/:id", () => {
        it("updates own reminder and increments version", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const reminder = await reminder_model_1.default.create({
                user: user.user._id,
                title: "Before",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                timeLabel: "10:00 AM",
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/reminders/${reminder._id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "After", version: 0 });
            expect(res.status).toBe(200);
            expect(res.body.data.reminder.title).toBe("After");
            expect(res.body.data.reminder.version).toBe(1);
        });
        it("rejects update with mismatched version (optimistic concurrency)", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const reminder = await reminder_model_1.default.create({
                user: user.user._id,
                title: "Before",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                timeLabel: "10:00 AM",
                version: 1, // Current DB version
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/reminders/${reminder._id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "After", version: 0 }); // Stale client version
            expect(res.status).toBe(409);
            expect(res.body.errorCode).toBe("CONFLICT");
        });
    });
    describe("DELETE /api/reminders/:id", () => {
        it("deletes own reminder", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const reminder = await reminder_model_1.default.create({
                user: user.user._id,
                title: "Delete Me",
                plantId: "650c1f2e9f1a2c3d4e5f6a7b",
                timeLabel: "12:00 PM",
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/reminders/${reminder._id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            const dbReminder = await reminder_model_1.default.findById(reminder._id);
            expect(dbReminder).toBeNull();
        });
    });
    describe("Admin Routes", () => {
        it("GET /api/admin/reminders returns paginated list", async () => {
            const adminAuth = await (0, auth_helper_1.createTestUser)("admin");
            const adminToken = await (0, auth_helper_1.getAuthToken)(adminAuth.email, adminAuth.password);
            await reminder_model_1.default.create({ user: adminAuth.user._id, title: "A", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "A" });
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/admin/reminders")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data.total).toBeDefined();
        });
        it("GET /api/admin/reminders/stats returns aggregated stats", async () => {
            const adminAuth = await (0, auth_helper_1.createTestUser)("admin");
            const adminToken = await (0, auth_helper_1.getAuthToken)(adminAuth.email, adminAuth.password);
            await reminder_model_1.default.create({ user: adminAuth.user._id, title: "A", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "A", enabled: true });
            await reminder_model_1.default.create({ user: adminAuth.user._id, title: "B", plantId: "650c1f2e9f1a2c3d4e5f6a7b", timeLabel: "B", enabled: false });
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/admin/reminders/stats")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.total).toBeGreaterThanOrEqual(2);
            expect(res.body.data.enabled).toBeGreaterThanOrEqual(1);
            expect(res.body.data.disabled).toBeGreaterThanOrEqual(1);
            expect(res.body.data.byDay).toBeDefined();
        });
    });
});
