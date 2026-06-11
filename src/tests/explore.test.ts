import request from "supertest";
import app from "../app";
import StoreProduct from "../models/store_product_model";
import Expert from "../models/expert_model";
import { clearTestDB, connectTestDB, disconnectTestDB } from "./db.setup";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Explore Endpoints", () => {
  beforeEach(async () => {
    await StoreProduct.deleteMany({});
    await Expert.deleteMany({});

    await StoreProduct.create([
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

    await Expert.create([
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
      const res = await request(app).get("/api/explore/store-products");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should filter products by category", async () => {
      const res = await request(app).get("/api/explore/store-products?category=Tools");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe("Tools");
    });
  });

  describe("GET /api/explore/experts", () => {
    it("should fetch all experts without specialty filter", async () => {
      const res = await request(app).get("/api/explore/experts");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should filter experts by specialty", async () => {
      const res = await request(app).get("/api/explore/experts?specialty=Plant%20Pathology");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].specialty).toBe("Plant Pathology");
    });
  });
});
