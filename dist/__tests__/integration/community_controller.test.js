"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const post_model_1 = __importDefault(require("../../models/post_model"));
const comment_v2_model_1 = __importDefault(require("../../models/comment_v2_model"));
const factories_1 = require("../factories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('[INTEGRATION] Community Controller (V2) - Phase 3', () => {
    let authToken;
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        authToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
        jest.clearAllMocks();
    });
    describe('Posts CRUD', () => {
        it('PASS: Create Post', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                content: 'Hello Community!',
            });
            expect(res.status).toBe(201);
            expect(res.body.data.content).toBe('Hello Community!');
        });
        it('PASS: Get Posts', async () => {
            await post_model_1.default.create({
                author: userId,
                authorName: 'Test',
                content: 'Post 1',
                plantTag: 'General',
                likes: 0,
                commentsCount: 0,
                likedBy: [],
                status: 'visible'
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/posts')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.posts.length).toBeGreaterThanOrEqual(1);
        });
        it('PASS: Update Post', async () => {
            const post = await post_model_1.default.create({
                author: userId, authorName: 'Test', content: 'Old Content', plantTag: 'General',
                likes: 0, commentsCount: 0, likedBy: [], status: 'visible'
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/posts/${post._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                content: 'Updated Content'
            });
            expect(res.status).toBe(200);
            expect(res.body.data.content).toBe('Updated Content');
        });
        it('PASS: Delete Post', async () => {
            const post = await post_model_1.default.create({
                author: userId, authorName: 'Test', content: 'Delete Me', plantTag: 'General',
                likes: 0, commentsCount: 0, likedBy: [], status: 'visible'
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/posts/${post._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            const check = await post_model_1.default.findById(post._id);
            expect(check?.deletedAt).toBeDefined(); // Soft delete check
        });
    });
    describe('Likes and Comments', () => {
        let postId;
        beforeEach(async () => {
            const post = await post_model_1.default.create({
                author: userId, authorName: 'Test', content: 'Base Post', plantTag: 'General',
                likes: 0, commentsCount: 0, likedBy: [], status: 'visible'
            });
            postId = post._id.toString();
        });
        it('PASS: Toggle Like', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/posts/${postId}/like`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.liked).toBe(true);
            const resUnlike = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/posts/${postId}/like`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(resUnlike.status).toBe(200);
            expect(resUnlike.body.data.liked).toBe(false);
        });
        it('PASS: Add and Get Comment', async () => {
            const addRes = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/posts/${postId}/comments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'Nice post!' });
            expect(addRes.status).toBe(201);
            expect(addRes.body.data.content).toBe('Nice post!');
            const getRes = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/posts/${postId}/comments`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.data.length).toBeGreaterThanOrEqual(1);
        });
        it('PASS: Update and Delete Comment', async () => {
            const comment = await comment_v2_model_1.default.create({
                user: userId, post: postId, content: 'To be updated'
            });
            const commentId = comment._id.toString();
            const updateRes = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/posts/${postId}/comments/${commentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'Updated comment' });
            expect(updateRes.status).toBe(200);
            expect(updateRes.body.data.content).toBe('Updated comment');
            const delRes = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/posts/${postId}/comments/${commentId}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(delRes.status).toBe(200);
            const check = await comment_v2_model_1.default.findById(commentId);
            expect(check?.deletedAt).toBeDefined(); // Soft delete check for comments or hard delete if BaseRepository hardDelete was used
        });
    });
});
