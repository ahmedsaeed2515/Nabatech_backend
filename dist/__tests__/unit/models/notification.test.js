"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_model_1 = __importDefault(require("../../../models/notification_model"));
const factories_1 = require("../../factories");
const mongoose_1 = __importDefault(require("mongoose"));
describe('[UNIT] NotificationModel', () => {
    it('يجب ينشئ notification بشكل صح', async () => {
        const user = (0, factories_1.createFakeUser)();
        const notif = await notification_model_1.default.create({
            user: user._id,
            title: 'Expert Review Complete ✅',
            body: 'Your plant diagnosis has been reviewed.',
            type: 'EXPERT_REVIEW_COMPLETE',
            data: { requestId: 'req-123' }
        });
        expect(notif._id).toBeDefined();
        expect(notif.read).toBe(false); // default
        expect(notif.type).toBe('EXPERT_REVIEW_COMPLETE');
    });
    it('يجب يرفض type مش موجود في الـ enum', async () => {
        await expect(notification_model_1.default.create({
            user: new mongoose_1.default.Types.ObjectId(),
            title: 'Test',
            body: 'Test body',
            type: 'INVALID_TYPE_XYZ'
        })).rejects.toThrow();
    });
    it('يجب يرفض notification من غير title', async () => {
        await expect(notification_model_1.default.create({
            user: new mongoose_1.default.Types.ObjectId(),
            body: 'Test body',
            type: 'SYSTEM'
        })).rejects.toThrow();
    });
    it('يجب يرجع unread count صح', async () => {
        const userId = new mongoose_1.default.Types.ObjectId();
        // Create 3 notifications: 2 unread, 1 read
        await notification_model_1.default.create([
            { user: userId, title: 'N1', body: 'B1', type: 'SYSTEM', read: false },
            { user: userId, title: 'N2', body: 'B2', type: 'SYSTEM', read: false },
            { user: userId, title: 'N3', body: 'B3', type: 'SYSTEM', read: true }
        ]);
        const count = await notification_model_1.default.countDocuments({ user: userId, read: false });
        expect(count).toBe(2);
    });
});
