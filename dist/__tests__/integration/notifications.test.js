"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const notification_model_1 = __importDefault(require("../../models/notification_model"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const factories_1 = require("../factories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('[INTEGRATION] Notification API', () => {
    let authToken;
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        authToken = jsonwebtoken_1.default.sign({ _id: userId }, process.env.JWT_SECRET || 'test-secret');
        // Seed some notifications
        await notification_model_1.default.create([
            { user: userId, title: 'Expert Review', body: 'Your plant was reviewed', type: 'EXPERT_REVIEW_COMPLETE', read: false },
            { user: userId, title: 'Weather Alert', body: 'High temperature today', type: 'WEATHER_ALERT', read: false },
            { user: userId, title: 'Old Alert', body: 'Old one', type: 'SYSTEM', read: true }
        ]);
    });
    describe('GET /api/notifications', () => {
        it('يجب يرجع قائمة الـ notifications مرتبة بالأحدث', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(3);
            expect(res.body.total).toBe(3);
        });
        it('يجب يعمل pagination صح', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/notifications?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(2);
        });
        it('يجب يرفض طلب من غير authentication', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/notifications');
            expect(res.status).toBe(401);
        });
    });
    describe('GET /api/notifications/unread-count', () => {
        it('يجب يرجع العدد الصح للـ unread', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.count).toBe(2); // 2 unread out of 3
        });
    });
    describe('PUT /api/notifications/:id/read', () => {
        it('يجب يغير read إلى true', async () => {
            const notif = await notification_model_1.default.findOne({ user: userId, read: false });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/notifications/${notif._id}/read`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            const updated = await notification_model_1.default.findById(notif._id);
            expect(updated.read).toBe(true);
        });
    });
    describe('PUT /api/notifications/read-all', () => {
        it('يجب يعلّم كل الـ notifications كـ read', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put('/api/notifications/read-all')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            const unreadCount = await notification_model_1.default.countDocuments({ user: userId, read: false });
            expect(unreadCount).toBe(0);
        });
    });
});
