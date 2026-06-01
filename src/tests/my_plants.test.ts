import request from "supertest";
import app from "../app";
import MyPlant from "../models/my_plant_model";
import { clearTestDB, connectTestDB, disconnectTestDB } from "./db.setup";
import { createTestUser, getAuthToken } from "./helpers/auth.helper";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("My Plants Tests", () => {
  describe("GET /api/my-plants", () => {
    it("returns user's plants only (not other users)", async () => {
      const userA = await createTestUser();
      const tokenA = await getAuthToken(userA.email, userA.password);
      const userB = await createTestUser();

      await MyPlant.create({
        user: userA.user!._id,
        name: "Mint A",
        species: "Mint",
        location: "indoor",
        waterFrequencyDays: 3
      });

      await MyPlant.create({
        user: userB.user!._id,
        name: "Rose B",
        species: "Rose",
        location: "outdoor",
        waterFrequencyDays: 4
      });

      const res = await request(app)
        .get("/api/my-plants")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.plants).toHaveLength(1);
      expect(res.body.plants[0].name).toBe("Mint A");
    });

    it("returns empty array if no plants", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .get("/api/my-plants")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.plants).toEqual([]);
    });
  });

  describe("POST /api/my-plants", () => {
    it("creates plant with valid data", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/my-plants")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Tomato",
          species: "Solanum",
          location: "indoor",
          waterFrequencyDays: 2
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.plant.name).toBe("Tomato");
    });

    it("rejects missing name", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/my-plants")
        .set("Authorization", `Bearer ${token}`)
        .send({ species: "Solanum", location: "indoor", waterFrequencyDays: 2 });

      expect(res.status).toBe(400);
    });

    it("rejects invalid location value", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/my-plants")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Tomato",
          species: "Solanum",
          location: "kitchen",
          waterFrequencyDays: 2
        });

      expect(res.status).toBe(500);
    });
  });

  describe("PUT /api/my-plants/:id", () => {
    it("updates own plant", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);
      const plant = await MyPlant.create({
        user: user.user!._id,
        name: "Before",
        species: "Mint",
        location: "indoor",
        waterFrequencyDays: 2
      });

      const res = await request(app)
        .put(`/api/my-plants/${plant._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "After" });

      expect(res.status).toBe(200);
      expect(res.body.plant.name).toBe("After");
    });

    it("rejects updating another user's plant", async () => {
      const owner = await createTestUser();
      const attacker = await createTestUser();
      const attackerToken = await getAuthToken(attacker.email, attacker.password);

      const plant = await MyPlant.create({
        user: owner.user!._id,
        name: "Owner Plant",
        species: "Mint",
        location: "indoor",
        waterFrequencyDays: 2
      });

      const res = await request(app)
        .put(`/api/my-plants/${plant._id}`)
        .set("Authorization", `Bearer ${attackerToken}`)
        .send({ name: "Hacked" });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe("DELETE /api/my-plants/:id", () => {
    it("deletes own plant", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const plant = await MyPlant.create({
        user: user.user!._id,
        name: "Delete Me",
        species: "Rose",
        location: "outdoor",
        waterFrequencyDays: 5
      });

      const res = await request(app)
        .delete(`/api/my-plants/${plant._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("rejects deleting another user's plant", async () => {
      const owner = await createTestUser();
      const attacker = await createTestUser();
      const attackerToken = await getAuthToken(attacker.email, attacker.password);

      const plant = await MyPlant.create({
        user: owner.user!._id,
        name: "Owner Plant",
        species: "Rose",
        location: "outdoor",
        waterFrequencyDays: 5
      });

      const res = await request(app)
        .delete(`/api/my-plants/${plant._id}`)
        .set("Authorization", `Bearer ${attackerToken}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  describe("POST /api/my-plants/:id/water", () => {
    it("updates lastWatered timestamp", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const plant = await MyPlant.create({
        user: user.user!._id,
        name: "Thirsty",
        species: "Basil",
        location: "indoor",
        waterFrequencyDays: 2,
        lastWatered: new Date("2024-01-01T00:00:00.000Z")
      });

      const res = await request(app)
        .post(`/api/my-plants/${plant._id}/water`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.lastWatered).toBeDefined();
    });
  });
});
