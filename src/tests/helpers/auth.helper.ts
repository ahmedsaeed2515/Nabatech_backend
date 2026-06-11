import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../app";
import User from "../../models/user_model";

let userCounter = 0;

export async function createTestUser(role: "user" | "admin" = "user") {
  userCounter += 1;
  const email = `test.user.${userCounter}@example.com`;
  const password = "Password123";
  const name = role === "admin" ? `Admin ${userCounter}` : `User ${userCounter}`;

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, role });
  return { user, email, password };
}

export async function createAdminUser() {
  return createTestUser("admin");
}

export async function getAuthToken(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body?.data?.accessToken || res.body?.token;
}
