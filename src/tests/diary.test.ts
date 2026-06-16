import request from "supertest";
import app from "../app";
import User from "../models/user_model";
import DiaryEntry from "../models/diary_entry_model";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db.setup";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Diary API Endpoints", () => {
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeEach(async () => {
    // 1. Create main test user
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Diary User",
        email: "diary.user@example.com",
        password: "Password123"
      });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;

    // 2. Create another test user for security/isolation checks
    const otherUserRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Other User",
        email: "other.user@example.com",
        password: "Password123"
      });
    otherUserToken = otherUserRes.body.token;
    otherUserId = otherUserRes.body.user.id;
  });

  describe("Authorization Security Checks", () => {
    it("should reject GET /api/diary if no token is provided", async () => {
      const res = await request(app).get("/api/diary");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should reject POST /api/diary if no token is provided", async () => {
      const res = await request(app)
        .post("/api/diary")
        .send({ plantId: "650c1f2e9f1a2c3d4e5f6a7b", title: "Watering", notes: "Done" });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should reject PUT /api/diary/:id if no token is provided", async () => {
      const res = await request(app).put("/api/diary/650c1f2e9f1a2c3d4e5f6a7b");
      expect(res.status).toBe(401);
    });

    it("should reject DELETE /api/diary/:id if no token is provided", async () => {
      const res = await request(app).delete("/api/diary/650c1f2e9f1a2c3d4e5f6a7b");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/diary", () => {
    const validEntry = {
      plantId: "650c1f2e9f1a2c3d4e5f6a7b",
      title: "New Leaf Alert!",
      notes: "Found a brand new leaf sprouting today. Looks very healthy.",
      moodCode: 2,
      healthScore: 90
    };

    it("should successfully create a new diary entry for authenticated user", async () => {
      const res = await request(app)
        .post("/api/diary")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validEntry);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.entry).toBeDefined();
      expect(res.body.entry.plantId).toBe(validEntry.plantId);
      expect(res.body.entry.title).toBe(validEntry.title);
      expect(res.body.entry.notes).toBe(validEntry.notes);
      expect(res.body.entry.moodCode).toBe(validEntry.moodCode);
      expect(res.body.entry.healthScore).toBe(validEntry.healthScore);
      expect(res.body.entry.id).toBeDefined();

      // Verify saving in MongoDB
      const dbEntry = await DiaryEntry.findById(res.body.entry.id);
      expect(dbEntry).not.toBeNull();
      expect(dbEntry?.user.toString()).toBe(userId);
    });

    it("should fail to create diary entry if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/diary")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          plantId: "650c1f2e9f1a2c3d4e5f6a7b"
          // missing title and notes
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Plant name, title and notes are required");
    });
  });

  describe("GET /api/diary", () => {
    it("should fetch all diary entries belonging only to the authenticated user", async () => {
      // 1. Create an entry for the first user
      await request(app)
        .post("/api/diary")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          plantId: "650c1f2e9f1a2c3d4e5f6a7b",
          title: "User 1 Title",
          notes: "User 1 Notes"
        });

      // 2. Create an entry for the other user
      await request(app)
        .post("/api/diary")
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({
          plantId: "650c1f2e9f1a2c3d4e5f6a7b",
          title: "User 2 Title",
          notes: "User 2 Notes"
        });

      // 3. Fetch user 1 entries
      const res = await request(app)
        .get("/api/diary")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.entries).toHaveLength(1);
      expect(res.body.entries[0].plantId).toBe("User 1 Plant");
    });
  });

  describe("PUT /api/diary/:id", () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a diary entry to update
      const entryRes = await request(app)
        .post("/api/diary")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          plantId: "650c1f2e9f1a2c3d4e5f6a7b",
          title: "Original Title",
          notes: "Original Notes"
        });
      entryId = entryRes.body.entry.id;
    });

    it("should successfully update diary entry owned by the user", async () => {
      const updatedData = {
        plantId: "650c1f2e9f1a2c3d4e5f6a7b",
        title: "Updated Title",
        notes: "Updated Notes",
        healthScore: 95
      };

      const res = await request(app)
        .put(`/api/diary/${entryId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.entry.plantId).toBe(updatedData.plantId);
      expect(res.body.entry.title).toBe(updatedData.title);
      expect(res.body.entry.notes).toBe(updatedData.notes);
      expect(res.body.entry.healthScore).toBe(updatedData.healthScore);

      // Verify db changes
      const dbEntry = await DiaryEntry.findById(entryId);
      expect(dbEntry?.plantId).toBe(updatedData.plantId);
    });

    it("should return 404 if user tries to update another user's diary entry", async () => {
      const res = await request(app)
        .put(`/api/diary/${entryId}`)
        .set("Authorization", `Bearer ${otherUserToken}`) // Using the other user's token
        .send({
          plantId: "650c1f2e9f1a2c3d4e5f6a7b"
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Diary entry not found");

      // Verify db is unchanged
      const dbEntry = await DiaryEntry.findById(entryId);
      expect(dbEntry?.plantId).toBe("Original Plant");
    });

    it("should return 404 if the diary entry does not exist", async () => {
      const nonExistentId = "650c1f2e9f1a2c3d4e5f6a7b";
      const res = await request(app)
        .put(`/api/diary/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          plantId: "650c1f2e9f1a2c3d4e5f6a7b"
        });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/diary/:id", () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a diary entry to delete
      const entryRes = await request(app)
        .post("/api/diary")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          plantId: "650c1f2e9f1a2c3d4e5f6a7b",
          title: "Delete Me",
          notes: "Bye bye"
        });
      entryId = entryRes.body.entry.id;
    });

    it("should successfully delete a diary entry owned by the user", async () => {
      const res = await request(app)
        .delete(`/api/diary/${entryId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("deleted successfully");

      // Verify deletion in database
      const dbEntry = await DiaryEntry.findById(entryId);
      expect(dbEntry).toBeNull();
    });

    it("should return 404/unauthorized when deleting another user's diary entry", async () => {
      const res = await request(app)
        .delete(`/api/diary/${entryId}`)
        .set("Authorization", `Bearer ${otherUserToken}`); // other user token

      expect(res.status).toBe(404);

      // Verify entry STILL exists in database
      const dbEntry = await DiaryEntry.findById(entryId);
      expect(dbEntry).not.toBeNull();
    });

    it("should return 404 if diary entry does not exist", async () => {
      const nonExistentId = "650c1f2e9f1a2c3d4e5f6a7b";
      const res = await request(app)
        .delete(`/api/diary/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });
});
