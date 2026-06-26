import request from "supertest";
import app from "../app";
import Plant from "../models/plant_model";
import { seedPlantLibrary } from "../utils/seeder";
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

describe("Plant Library Tests", () => {
  describe("GET /api/plant-library/plants", () => {

    it("returns plants list (public, no auth needed)", async () => {
      await Plant.create({ nameAr: "نعناع", nameEn: "Mint", slug: "mint", normalizedNameEn: "mint", normalizedNameAr: "نعناع" });
      const res = await request(app).get("/api/plant-library/plants");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it("returns plants by default after seeding (pagination)", async () => {
      await seedPlantLibrary();
      const res = await request(app).get("/api/plant-library/plants");

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it("applies pagination limits correctly", async () => {
      await seedPlantLibrary();
      const res = await request(app).get("/api/plant-library/plants?page=2&limit=5");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(5);
    });
  });

  describe("POST /api/plant-library/plants", () => {
    it("admin can add plant", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin.email, admin.password);

      const res = await request(app)
        .post("/api/plant-library/plants")
        .set("Authorization", `Bearer ${token}`)
        .send({ nameAr: "طماطم", nameEn: "Tomato" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("regular user gets 403", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/plant-library/plants")
        .set("Authorization", `Bearer ${token}`)
        .send({ nameAr: "طماطم", nameEn: "Tomato" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/plant-library/plants/:id", () => {
    it("admin can delete", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin.email, admin.password);
      const plant = await Plant.create({ nameAr: "ريحان", nameEn: "Basil", slug: "basil-1", normalizedNameEn: "basil", normalizedNameAr: "ريحان" });

      const res = await request(app)
        .delete(`/api/plant-library/plants/${plant._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("regular user gets 403", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);
      const plant = await Plant.create({ nameAr: "ريحان", nameEn: "Basil", slug: "basil-2", normalizedNameEn: "basil", normalizedNameAr: "ريحان" });

      const res = await request(app)
        .delete(`/api/plant-library/plants/${plant._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});


