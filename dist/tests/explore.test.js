"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const expert_model_1 = __importDefault(require("../models/expert_model"));
const db_setup_1 = require("./db.setup");
beforeAll(async () => {
    await (0, db_setup_1.connectTestDB)();
});
afterAll(async () => {
    await (0, db_setup_1.disconnectTestDB)();
});
beforeEach(async () => {
    await (0, db_setup_1.clearTestDB)();
});
describe("Explore Endpoints", () => {
    beforeEach(async () => {
        await store_product_model_1.default.deleteMany({});
        await expert_model_1.default.deleteMany({});
        await store_product_model_1.default.create([
            {
                name: "Test Product 1",
                category: "Tools",
                price: 15,
                rating: 4,
                subtitle: "A useful tool"
            },
            {
                name: "Test Product 2",
                category: "Nutrition",
                price: 25,
                rating: 5,
                subtitle: "Plant food"
            }
        ]);
        await expert_model_1.default.create([
            {
                name: "Expert 1",
                specialty: "Plant Pathology",
                fee: 50,
                online: true
            },
            {
                name: "Expert 2",
                specialty: "Soil Nutritionist",
                fee: 60,
                online: false
            }
        ]);
    });
    describe("GET /api/explore/store-products", () => {
        it("should fetch all products without category filter", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/explore/store-products");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
        });
        it("should filter products by category", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/explore/store-products?category=Tools");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].category).toBe("Tools");
        });
    });
    describe("GET /api/explore/experts", () => {
        it("should fetch all experts without specialty filter", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/explore/experts");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
        });
        it("should filter experts by specialty", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/explore/experts?specialty=Plant%20Pathology");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].specialty).toBe("Plant Pathology");
        });
    });
});
