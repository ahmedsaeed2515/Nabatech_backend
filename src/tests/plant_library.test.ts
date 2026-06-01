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
      await Plant.create({ nameAr: "äÚäÇÚ", nameEn: "Mint" });
      const res = await request(app).get("/api/plant-library/plants");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("returns 23 plants after seeding", async () => {
      await seedPlantLibrary();
      const res = await request(app).get("/api/plant-library/plants");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(23);
    });
  });

  describe("POST /api/plant-library/plants", () => {
    it("admin can add plant", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin.email, admin.password);

      const res = await request(app)
        .post("/api/plant-library/plants")
        .set("Authorization", `Bearer ${token}`)
        .send({ nameAr: "ØãÇØã", nameEn: "Tomato" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("regular user gets 403", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/plant-library/plants")
        .set("Authorization", `Bearer ${token}`)
        .send({ nameAr: "ØãÇØã", nameEn: "Tomato" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/plant-library/plants/:id", () => {
    it("admin can delete", async () => {
      const admin = await createAdminUser();
      const token = await getAuthToken(admin.email, admin.password);
      const plant = await Plant.create({ nameAr: "ÑíÍÇä", nameEn: "Basil" });

      const res = await request(app)
        .delete(`/api/plant-library/plants/${plant._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("regular user gets 403", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);
      const plant = await Plant.create({ nameAr: "ÑíÍÇä", nameEn: "Basil" });

      const res = await request(app)
        .delete(`/api/plant-library/plants/${plant._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
