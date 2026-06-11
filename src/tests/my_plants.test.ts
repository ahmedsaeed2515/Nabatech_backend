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
      expect(res.body.data.plants).toHaveLength(1);
      expect(res.body.data.plants[0].name).toBe("Mint A");
    });

    it("returns empty array if no plants", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .get("/api/my-plants")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.plants).toEqual([]);
    });
  });

  describe("GET /api/my-plants/:id", () => {
    it("returns plant by ID for owner", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const plant = await MyPlant.create({
        user: user.user!._id,
        name: "Mint A",
        species: "Mint",
        location: "indoor",
        waterFrequencyDays: 3
      });

      const res = await request(app)
        .get(`/api/my-plants/${plant._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.plant.name).toBe("Mint A");
    });

    it("returns 404 for non-existent plant", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .get("/api/my-plants/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 if plant belongs to another user", async () => {
      const owner = await createTestUser();
      const attacker = await createTestUser();
      const attackerToken = await getAuthToken(attacker.email, attacker.password);

      const plant = await MyPlant.create({
        user: owner.user!._id,
        name: "Mint A",
        species: "Mint",
        location: "indoor",
        waterFrequencyDays: 3
      });

      const res = await request(app)
        .get(`/api/my-plants/${plant._id}`)
        .set("Authorization", `Bearer ${attackerToken}`);

      expect(res.status).toBe(404);
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
      expect(res.body.data.plant.name).toBe("Tomato");
    });

    it("creates plant idempotently", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const payload = {
        name: "Idempotent Plant",
        species: "Solanum",
        location: "indoor",
        waterFrequencyDays: 2
      };

      const res1 = await request(app)
        .post("/api/my-plants")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", "test-key-123")
        .send(payload);

      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post("/api/my-plants")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", "test-key-123")
        .send(payload);

      expect(res2.status).toBe(201); // same success response
      expect(res2.body.data.plant.id).toBe(res1.body.data.plant.id); // same entity

      // Verify no duplicates
      const plants = await MyPlant.find({ user: user.user!._id, name: "Idempotent Plant" });
      expect(plants).toHaveLength(1);
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

    it("rejects invalid location value with 400", async () => {
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

      expect(res.status).toBe(400);
    });

    it("rejects invalid healthStatus with 400", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/my-plants")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Tomato",
          species: "Solanum",
          location: "indoor",
          waterFrequencyDays: 2,
          healthStatus: "dead"
        });

      expect(res.status).toBe(400);
    });

    it("rejects waterFrequencyDays < 1", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/my-plants")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Tomato",
          species: "Solanum",
          location: "indoor",
          waterFrequencyDays: 0
        });

      expect(res.status).toBe(400);
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
      expect(res.body.data.plant.name).toBe("After");
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
    it("updates lastWatered timestamp and creates WateringLog", async () => {
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
        .send({ note: "Added fertilizer" });

      expect(res.status).toBe(200);
      expect(res.body.data.lastWatered).toBeDefined();
      expect(res.body.data.log).toBeDefined();
      expect(res.body.data.log.note).toBe("Added fertilizer");
    });
  });

  describe("GET /api/my-plants/:id/water-logs", () => {
    it("returns watering history for plant owner", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const plant = await MyPlant.create({
        user: user.user!._id,
        name: "Thirsty",
        species: "Basil",
        location: "indoor",
        waterFrequencyDays: 2,
      });

      await request(app)
        .post(`/api/my-plants/${plant._id}/water`)
        .set("Authorization", `Bearer ${token}`)
        .send({ note: "Added fertilizer" });

      const res = await request(app)
        .get(`/api/my-plants/${plant._id}/water-logs`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toHaveLength(1);
      expect(res.body.data.logs[0].note).toBe("Added fertilizer");
    });

    it("returns 404 for another user's plant", async () => {
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
        .get(`/api/my-plants/${plant._id}/water-logs`)
        .set("Authorization", `Bearer ${attackerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/my-plants/:id/image", () => {
    it("returns 400 if no file provided", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const plant = await MyPlant.create({
        user: user.user!._id,
        name: "My Plant",
        species: "Mint",
        location: "indoor",
        waterFrequencyDays: 2
      });

      const res = await request(app)
        .post(`/api/my-plants/${plant._id}/image`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("No file uploaded");
    });

    it("returns 404 for non-existent plant", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      // Supertest trick: we won't mock Cloudinary upload fully here unless needed,
      // but we can test the missing file or missing plant easily.
      // Assuming multer doesn't block 404
      const res = await request(app)
        .post("/api/my-plants/507f1f77bcf86cd799439011/image")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("fake image data"), "plant.jpg");

      expect(res.status).toBe(404);
    });

    it("rejects unsupported MIME types", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);
      const plant = await MyPlant.create({
        user: user.user!._id,
        name: "My Plant",
        species: "Mint",
        location: "indoor",
        waterFrequencyDays: 2
      });

      const res = await request(app)
        .post(`/api/my-plants/${plant._id}/image`)
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("fake data"), { filename: "text.txt", contentType: "text/plain" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_INVALID");
    });
  });
});
