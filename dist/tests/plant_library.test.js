"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const plant_model_1 = __importDefault(require("../models/plant_model"));
const seeder_1 = require("../utils/seeder");
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
describe("Plant Library Tests", () => {
    describe("GET /api/plant-library/plants", () => {
        it("returns plants list (public, no auth needed)", async () => {
            await plant_model_1.default.create({ nameAr: "نعناع", nameEn: "Mint", slug: "mint", normalizedNameEn: "mint", normalizedNameAr: "نعناع" });
            const res = await (0, supertest_1.default)(app_1.default).get("/api/plant-library/plants");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.items).toBeDefined();
            expect(Array.isArray(res.body.data.items)).toBe(true);
            expect(res.body.data.items.length).toBeGreaterThan(0);
        });
        it("returns 20 plants by default after seeding (pagination)", async () => {
            await (0, seeder_1.seedPlantLibrary)();
            const res = await (0, supertest_1.default)(app_1.default).get("/api/plant-library/plants");
            expect(res.status).toBe(200);
            expect(res.body.data.items).toHaveLength(20);
            expect(res.body.count).toBe(23);
            expect(res.body.totalPages).toBe(2);
        });
        it("searches plants by Arabic and English names", async () => {
            await (0, seeder_1.seedPlantLibrary)();
            // Search English
            const resEn = await (0, supertest_1.default)(app_1.default).get("/api/plant-library/plants?search=aloe");
            expect(resEn.status).toBe(200);
            expect(resEn.body.data.items.some((p) => p.nameEn.toLowerCase().includes("aloe"))).toBe(true);
            // Search Arabic
            const resAr = await (0, supertest_1.default)(app_1.default).get("/api/plant-library/plants?search=صبار");
            expect(resAr.status).toBe(200);
            expect(resAr.body.data.items.some((p) => p.nameAr.includes("صبار"))).toBe(true);
        });
        it("applies pagination limits correctly", async () => {
            await (0, seeder_1.seedPlantLibrary)();
            const res = await (0, supertest_1.default)(app_1.default).get("/api/plant-library/plants?page=2&limit=5");
            expect(res.status).toBe(200);
            expect(res.body.data.items).toHaveLength(5);
            expect(res.body.count).toBe(23);
            expect(res.body.totalPages).toBe(5);
        });
    });
    describe("POST /api/plant-library/plants", () => {
        it("admin can add plant", async () => {
            const admin = await (0, auth_helper_1.createAdminUser)();
            const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/plant-library/plants")
                .set("Authorization", `Bearer ${token}`)
                .send({ nameAr: "طماطم", nameEn: "Tomato" });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
        it("regular user gets 403", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/plant-library/plants")
                .set("Authorization", `Bearer ${token}`)
                .send({ nameAr: "طماطم", nameEn: "Tomato" });
            expect(res.status).toBe(403);
        });
    });
    describe("DELETE /api/plant-library/plants/:id", () => {
        it("admin can delete", async () => {
            const admin = await (0, auth_helper_1.createAdminUser)();
            const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
            const plant = await plant_model_1.default.create({ nameAr: "ريحان", nameEn: "Basil", slug: "basil-1", normalizedNameEn: "basil", normalizedNameAr: "ريحان" });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/plant-library/plants/${plant._id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
        it("regular user gets 403", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const plant = await plant_model_1.default.create({ nameAr: "ريحان", nameEn: "Basil", slug: "basil-2", normalizedNameEn: "basil", normalizedNameAr: "ريحان" });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/plant-library/plants/${plant._id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(403);
        });
    });
});
