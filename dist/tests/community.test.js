"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const db_setup_1 = require("./db.setup");
const auth_helper_1 = require("./helpers/auth.helper");
beforeAll(async () => {
    await (0, db_setup_1.connectTestDB)();
});
afterAll(async () => {
    await (0, db_setup_1.disconnectTestDB)();
});
beforeEach(async () => {
    await (0, db_setup_1.clearTestDB)();
});
describe("Community Tests", () => {
    describe("GET /api/community/posts", () => {
        it("returns posts list", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            await community_post_model_1.default.create({
                author: user.user._id,
                authorName: "Test User",
                title: "Valid title",
                content: "This is valid content with enough length",
                plantTag: "General",
                clientOperationId: "op-list-1"
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/community/posts")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.posts)).toBe(true);
        });
        it("filters by category correctly", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            await community_post_model_1.default.create({
                author: user.user._id,
                authorName: "Test User",
                title: "Diagnosis title",
                content: "This is valid content for diagnosis category",
                plantTag: "Diagnosis",
                clientOperationId: "op-filter-1"
            });
            await community_post_model_1.default.create({
                author: user.user._id,
                authorName: "Test User",
                title: "Watering title",
                content: "This is valid content for watering category",
                plantTag: "Watering",
                clientOperationId: "op-filter-2"
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/community/posts?category=watering")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.posts).toHaveLength(1);
            expect(res.body.posts[0].plantTag).toBe("Watering");
        });
    });
    describe("POST /api/community/posts", () => {
        it("creates post with valid data", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/community/posts")
                .set("Authorization", `Bearer ${token}`)
                .send({
                title: "How to treat tomato leaves?",
                content: "My tomato leaves have yellow spots for 3 days. Any help?",
                plantTag: "Diagnosis",
                clientOperationId: "op-123"
            });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.post.title).toBeDefined();
        });
        it("rejects title less than 5 chars", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/community/posts")
                .set("Authorization", `Bearer ${token}`)
                .send({
                title: "abcd",
                content: "My tomato leaves have yellow spots for 3 days. Any help?",
                plantTag: "Diagnosis",
                clientOperationId: "op-124"
            });
            expect(res.status).toBe(400);
        });
        it("rejects content less than 10 chars", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/community/posts")
                .set("Authorization", `Bearer ${token}`)
                .send({
                title: "Valid title",
                content: "short",
                plantTag: "Diagnosis",
                clientOperationId: "op-125"
            });
            expect(res.status).toBe(400);
        });
    });
    describe("POST /api/community/posts/:id/like", () => {
        it("adds like then removes like on second call", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const post = await community_post_model_1.default.create({
                author: user.user._id,
                authorName: "Test User",
                title: "Valid title",
                content: "This is valid content with enough length",
                plantTag: "General",
                clientOperationId: "op-like-1"
            });
            const likeRes = await (0, supertest_1.default)(app_1.default)
                .post(`/api/community/posts/${post._id}/like`)
                .set("Authorization", `Bearer ${token}`);
            expect(likeRes.status).toBe(200);
            expect(likeRes.body.liked).toBe(true);
            const unlikeRes = await (0, supertest_1.default)(app_1.default)
                .post(`/api/community/posts/${post._id}/like`)
                .set("Authorization", `Bearer ${token}`);
            expect(unlikeRes.status).toBe(200);
            expect(unlikeRes.body.liked).toBe(false);
        });
    });
    describe("POST /api/community/posts/:id/comments", () => {
        it("adds comment", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const post = await community_post_model_1.default.create({
                author: user.user._id,
                authorName: "Test User",
                title: "Valid title",
                content: "This is valid content with enough length",
                plantTag: "General",
                clientOperationId: "op-comment-1"
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/community/posts/${post._id}/comments`)
                .set("Authorization", `Bearer ${token}`)
                .send({ text: "Helpful answer", clientOperationId: "op-126" });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.comment.text).toBe("Helpful answer");
        });
        it("rejects empty comment", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const post = await community_post_model_1.default.create({
                author: user.user._id,
                authorName: "Test User",
                title: "Valid title",
                content: "This is valid content with enough length",
                plantTag: "General",
                clientOperationId: "op-comment-2"
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/community/posts/${post._id}/comments`)
                .set("Authorization", `Bearer ${token}`)
                .send({ text: "   ", clientOperationId: "op-127" });
            expect(res.status).toBe(400);
        });
    });
    describe("Specialist Offers", () => {
        it("prevents non-specialists from creating offers", async () => {
            const user = await (0, auth_helper_1.createTestUser)();
            const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
            const post = await community_post_model_1.default.create({
                author: user.user._id,
                authorName: "Test User",
                title: "Valid title",
                content: "This is valid content with enough length",
                plantTag: "General",
                clientOperationId: "op-offer-1"
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/community/offers")
                .set("Authorization", `Bearer ${token}`)
                .send({
                postId: post._id,
                plan: "I can help",
                price: 50,
                clientOperationId: "op-offer-1"
            });
            expect(res.status).toBe(403);
        });
    });
});
