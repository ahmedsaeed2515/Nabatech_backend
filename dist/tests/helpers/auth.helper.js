"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestUser = createTestUser;
exports.createAdminUser = createAdminUser;
exports.getAuthToken = getAuthToken;
const supertest_1 = __importDefault(require("supertest"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
let userCounter = 0;
async function createTestUser(role = "user") {
    userCounter += 1;
    const email = `test.user.${userCounter}@example.com`;
    const password = "Password123";
    const name = role === "admin" ? `Admin ${userCounter}` : `User ${userCounter}`;
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await user_model_1.default.create({ name, email, password: hashedPassword, role });
    return { user, email, password };
}
async function createAdminUser() {
    return createTestUser("admin");
}
async function getAuthToken(email, password) {
    const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password });
    return res.body?.data?.accessToken || res.body?.token;
}
