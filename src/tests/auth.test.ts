import request from "supertest";
import app from "../app";
import User from "../models/user_model";
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

describe("Authentication API Endpoints", () => {
  const validUser = {
    name: "Ahmad Test",
    email: "ahmad.test@example.com",
    password: "Password123",
    phoneNumber: "01012345678"
  };

  describe("POST /api/auth/register", () => {
    it("should successfully register a new user with valid details", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(validUser.name);
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.user.phoneNumber).toBe(validUser.phoneNumber);
      expect(res.body.user.id).toBeDefined();

      // Verify user exists in the database
      const user = await User.findOne({ email: validUser.email.toLowerCase() });
      expect(user).not.toBeNull();
      expect(user?.name).toBe(validUser.name);
    });

    it("should fail registration if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "incomplete@example.com"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("All fields are required");
    });

    it("should fail registration with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          email: "invalid-email"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid email format");
    });

    it("should fail registration with a weak password (less than 6 chars or no letters/numbers)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          password: "123"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Password must be at least 6 characters and contain both letters and numbers");
    });

    it("should fail registration if user already exists", async () => {
      // Register first time
      await request(app).post("/api/auth/register").send(validUser);

      // Register second time
      const res = await request(app).post("/api/auth/register").send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Pre-register user for login tests
      await request(app).post("/api/auth/register").send(validUser);
    });

    it("should successfully login registered user with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
    });

    it("should fail login with incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: "WrongPassword123"
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("should fail login with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Password123"
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("should fail login if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Email and password are required");
    });
  });
});
