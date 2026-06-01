import request from "supertest";
import app from "../app";
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

describe("Auth Tests", () => {
  describe("POST /api/auth/register", () => {
    it("creates user with valid data", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Ahmed",
        email: "ahmed@example.com",
        password: "Password123"
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("ahmed@example.com");
    });

    it("rejects duplicate email", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Ahmed",
        email: "ahmed@example.com",
        password: "Password123"
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Ahmed 2",
        email: "ahmed@example.com",
        password: "Password123"
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("User already exists");
    });

    it("rejects missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "no-name@example.com",
        password: "Password123"
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("All fields are required");
    });

    it("rejects weak password (less than 6 chars)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Weak",
        email: "weak@example.com",
        password: "123"
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Password must be at least 6 characters");
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns JWT token with valid credentials", async () => {
      const { email, password } = await createTestUser();
      const res = await request(app).post("/api/auth/login").send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it("rejects wrong password", async () => {
      const { email } = await createTestUser();
      const res = await request(app).post("/api/auth/login").send({ email, password: "WrongPassword123" });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("rejects non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "notfound@example.com",
        password: "Password123"
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });
  });

  describe("GET /api/users/me", () => {
    it("returns profile with valid token", async () => {
      const { email, password } = await createTestUser();
      const token = await getAuthToken(email, password);

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(email);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
    });
  });
});
