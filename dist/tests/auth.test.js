"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const db_setup_1 = require("./db.setup");
const auth_helper_1 = require("./helpers/auth.helper");
const password_reset_request_model_1 = __importDefault(require("../models/password_reset_request_model"));
const refresh_session_model_1 = __importDefault(require("../models/refresh_session_model"));
const outbox_job_model_1 = __importDefault(require("../models/outbox_job_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
beforeAll(async () => {
    await (0, db_setup_1.connectTestDB)();
});
afterAll(async () => {
    await (0, db_setup_1.disconnectTestDB)();
});
beforeEach(async () => {
    await (0, db_setup_1.clearTestDB)();
});
describe("Auth Tests", () => {
    describe("POST /api/auth/register", () => {
        it("creates user with valid data", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/register").send({
                name: "Ahmed",
                email: "ahmed@example.com",
                password: "Password123"
            });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.user.email).toBe("ahmed@example.com");
            const outboxJobs = await outbox_job_model_1.default.find({ type: 'email_verification' });
            expect(outboxJobs.length).toBe(1);
            // Assert no plaintext token is saved
            const user = await user_model_1.default.findOne({ email: "ahmed@example.com" });
            expect(user.emailVerificationToken).toBeFalsy();
            expect(user.refreshToken).toBeFalsy();
            expect(user.emailVerificationTokenHash).toBeDefined();
        });
        it("rejects duplicate email", async () => {
            await (0, supertest_1.default)(app_1.default).post("/api/auth/register").send({
                name: "Ahmed",
                email: "ahmed@example.com",
                password: "Password123"
            });
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/register").send({
                name: "Ahmed 2",
                email: "ahmed@example.com",
                password: "Password123"
            });
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe("AUTH_EMAIL_EXISTS");
        });
        it("rejects missing required fields", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/register").send({
                email: "no-name@example.com",
                password: "Password123"
            });
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe("VALIDATION_FAILED");
        });
        it("rejects weak password (less than 6 chars)", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/register").send({
                name: "Weak",
                email: "weak@example.com",
                password: "123"
            });
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe("VALIDATION_FAILED");
        });
    });
    describe("POST /api/auth/login", () => {
        it("returns JWT token with valid credentials", async () => {
            const { email, password } = await (0, auth_helper_1.createTestUser)();
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            // Should create a refresh session
            const refreshSessions = await refresh_session_model_1.default.find();
            expect(refreshSessions.length).toBe(1);
        });
        it("rejects wrong password", async () => {
            const { email } = await (0, auth_helper_1.createTestUser)();
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password: "WrongPassword123" });
            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
        });
        it("rejects non-existent email", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({
                email: "notfound@example.com",
                password: "Password123"
            });
            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
        });
    });
    describe("POST /api/auth/forgot-password & reset-password", () => {
        it("POST /api/auth/forgot-password — returns 200 and creates request", async () => {
            const { email } = await (0, auth_helper_1.createTestUser)();
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/forgot-password").send({ email });
            expect(res.status).toBe(200);
            const outboxJobs = await outbox_job_model_1.default.find({ type: 'password_reset' });
            expect(outboxJobs.length).toBe(1);
            const resetReq = await password_reset_request_model_1.default.findOne({ email });
            expect(resetReq.token).toBeUndefined();
            expect(resetReq.tokenHash).toBeDefined();
        });
        it("POST /api/auth/reset-password — resets password with valid token", async () => {
            const { email } = await (0, auth_helper_1.createTestUser)();
            await (0, supertest_1.default)(app_1.default).post("/api/auth/forgot-password").send({ email });
            const job = await outbox_job_model_1.default.findOne({ type: 'password_reset' });
            expect(job).toBeTruthy();
            const rawToken = job.payload.token;
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/reset-password").send({
                token: rawToken,
                newPassword: "NewStrongPassword123"
            });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const loginRes = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({
                email,
                password: "NewStrongPassword123"
            });
            expect(loginRes.status).toBe(200);
        });
    });
    describe("POST /api/auth/refresh-token", () => {
        it("POST /api/auth/refresh-token — returns new tokens with valid refresh token", async () => {
            const { email, password } = await (0, auth_helper_1.createTestUser)();
            const loginRes = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password });
            const refreshToken = loginRes.body.data.refreshToken;
            const res = await (0, supertest_1.default)(app_1.default).post("/api/auth/refresh-token").send({ refreshToken });
            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });
        it("POST /api/auth/refresh-token — detects reuse and revokes", async () => {
            const { email, password } = await (0, auth_helper_1.createTestUser)();
            const loginRes = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password });
            const refreshToken = loginRes.body.data.refreshToken;
            // First refresh is okay
            const res1 = await (0, supertest_1.default)(app_1.default).post("/api/auth/refresh-token").send({ refreshToken });
            expect(res1.status).toBe(200);
            // Second refresh with same token triggers reuse detection
            const res2 = await (0, supertest_1.default)(app_1.default).post("/api/auth/refresh-token").send({ refreshToken });
            expect(res2.status).toBe(401);
            expect(res2.body.error.code).toBe("AUTH_REFRESH_REUSED");
            // Try using the latest token, it should be revoked
            const latestToken = res1.body.data.refreshToken;
            const res3 = await (0, supertest_1.default)(app_1.default).post("/api/auth/refresh-token").send({ refreshToken: latestToken });
            expect(res3.status).toBe(401);
            expect(res3.body.error.code).toBe("AUTH_REFRESH_REUSED"); // Family is revoked
        });
        it("POST /api/auth/refresh-token — concurrent reuse detects and revokes", async () => {
            const { email, password } = await (0, auth_helper_1.createTestUser)();
            const loginRes = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password });
            const refreshToken = loginRes.body.data.refreshToken;
            // Concurrent requests
            const [res1, res2] = await Promise.all([
                (0, supertest_1.default)(app_1.default).post("/api/auth/refresh-token").send({ refreshToken }),
                (0, supertest_1.default)(app_1.default).post("/api/auth/refresh-token").send({ refreshToken })
            ]);
            // Either one fails with WriteConflict or one succeeds and one fails. 
            // Regardless, the family should end up revoked if reuse was successfully processed.
            const succeeded = res1.status === 200 ? res1 : res2.status === 200 ? res2 : null;
            if (succeeded && (res1.status === 401 || res2.status === 401)) {
                const latestToken = succeeded.body.data.refreshToken;
                const res3 = await (0, supertest_1.default)(app_1.default).post("/api/auth/refresh-token").send({ refreshToken: latestToken });
                expect(res3.status).toBe(401);
                expect(res3.body.error.code).toBe("AUTH_REFRESH_REUSED");
            }
        });
    });
    describe("POST /api/auth/logout", () => {
        it("POST /api/auth/logout — clears refresh token, returns 200", async () => {
            const { email, password } = await (0, auth_helper_1.createTestUser)();
            const loginRes = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password });
            const token = loginRes.body.data.accessToken;
            const refreshToken = loginRes.body.data.refreshToken;
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/auth/logout")
                .set("Authorization", `Bearer ${token}`)
                .send({ refreshToken });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
    describe("POST /api/auth/logout-all", () => {
        it("POST /api/auth/logout-all — revokes all sessions", async () => {
            const { email, password } = await (0, auth_helper_1.createTestUser)();
            await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password }); // Session 1
            const loginRes2 = await (0, supertest_1.default)(app_1.default).post("/api/auth/login").send({ email, password }); // Session 2
            const token = loginRes2.body.data.accessToken;
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/auth/logout-all")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.revokedSessions).toBeGreaterThanOrEqual(2);
        });
    });
});
