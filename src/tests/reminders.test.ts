import request from "supertest";
import app from "../app";
import Reminder from "../models/reminder_model";
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

describe("Reminders API", () => {
  describe("GET /api/reminders", () => {
    it("returns user's reminders with pagination", async () => {
      const userA = await createTestUser();
      const tokenA = await getAuthToken(userA.email, userA.password);

      // Create 3 reminders
      const r1 = await Reminder.create({ user: userA.user!._id, title: "1", plantName: "P1", timeLabel: "1" });
      const r2 = await Reminder.create({ user: userA.user!._id, title: "2", plantName: "P2", timeLabel: "2" });
      const r3 = await Reminder.create({ user: userA.user!._id, title: "3", plantName: "P3", timeLabel: "3" });

      // Get page 1 (limit 2)
      const res1 = await request(app)
        .get("/api/reminders?limit=2")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.items).toHaveLength(2);
      expect(res1.body.data.pageInfo.hasNextPage).toBe(true);
      expect(res1.body.data.items[0].title).toBe("3"); // Descending order
      expect(res1.body.data.items[1].title).toBe("2");

      const cursor = res1.body.data.pageInfo.nextCursor;

      // Get page 2
      const res2 = await request(app)
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
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Water Tomato",
          plantName: "Tomato",
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
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const res = await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Water Tomato",
          plantName: "Tomato",
          timeZone: "Invalid/Zone",
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe("VALIDATION_FAILED");
    });

    it("enforces idempotency with clientOperationId", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const payload = {
        title: "Test Idempotency",
        plantName: "Tomato",
        clientOperationId: "unique-op-123"
      };

      const res1 = await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(res2.status).toBe(409);
      expect(res2.body.errorCode).toBe("CONFLICT");
    });
  });

  describe("PUT /api/reminders/:id", () => {
    it("updates own reminder and increments version", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);
      const reminder = await Reminder.create({
        user: user.user!._id,
        title: "Before",
        plantName: "Mint",
        timeLabel: "10:00 AM",
      });

      const res = await request(app)
        .put(`/api/reminders/${reminder._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "After", version: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.reminder.title).toBe("After");
      expect(res.body.data.reminder.version).toBe(1);
    });

    it("rejects update with mismatched version (optimistic concurrency)", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);
      const reminder = await Reminder.create({
        user: user.user!._id,
        title: "Before",
        plantName: "Mint",
        timeLabel: "10:00 AM",
        version: 1, // Current DB version
      });

      const res = await request(app)
        .put(`/api/reminders/${reminder._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "After", version: 0 }); // Stale client version

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe("CONFLICT");
    });
  });

  describe("DELETE /api/reminders/:id", () => {
    it("deletes own reminder", async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user.email, user.password);

      const reminder = await Reminder.create({
        user: user.user!._id,
        title: "Delete Me",
        plantName: "Rose",
        timeLabel: "12:00 PM",
      });

      const res = await request(app)
        .delete(`/api/reminders/${reminder._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const dbReminder = await Reminder.findById(reminder._id);
      expect(dbReminder).toBeNull();
    });
  });

  describe("Admin Routes", () => {
    it("GET /api/admin/reminders returns paginated list", async () => {
      const adminAuth = await createTestUser("admin");
      const adminToken = await getAuthToken(adminAuth.email, adminAuth.password);

      await Reminder.create({ user: adminAuth.user!._id, title: "A", plantName: "A", timeLabel: "A" });
      
      const res = await request(app)
        .get("/api/admin/reminders")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.total).toBeDefined();
    });

    it("GET /api/admin/reminders/stats returns aggregated stats", async () => {
      const adminAuth = await createTestUser("admin");
      const adminToken = await getAuthToken(adminAuth.email, adminAuth.password);

      await Reminder.create({ user: adminAuth.user!._id, title: "A", plantName: "A", timeLabel: "A", enabled: true });
      await Reminder.create({ user: adminAuth.user!._id, title: "B", plantName: "B", timeLabel: "B", enabled: false });

      const res = await request(app)
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
