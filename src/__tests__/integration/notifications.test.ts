import request from 'supertest';
import app from '../../app';
import NotificationModel from '../../models/notification_model';
import UserModel from '../../models/user_model';
import { createFakeUser } from '../factories';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('[INTEGRATION] Notification API', () => {

  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();
    authToken = jwt.sign({ _id: userId }, process.env.JWT_SECRET || 'test-secret');

    // Seed some notifications
    await NotificationModel.create([
      { user: userId, title: 'Expert Review', body: 'Your plant was reviewed', type: 'EXPERT_REVIEW_COMPLETE', read: false },
      { user: userId, title: 'Weather Alert', body: 'High temperature today', type: 'WEATHER_ALERT', read: false },
      { user: userId, title: 'Old Alert', body: 'Old one', type: 'SYSTEM', read: true }
    ]);
  });

  describe('GET /api/notifications', () => {
    it('يجب يرجع قائمة الـ notifications مرتبة بالأحدث', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.total).toBe(3);
    });

    it('يجب يعمل pagination صح', async () => {
      const res = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('يجب يرفض طلب من غير authentication', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('يجب يرجع العدد الصح للـ unread', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2); // 2 unread out of 3
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('يجب يغير read إلى true', async () => {
      const notif = await NotificationModel.findOne({ user: userId, read: false });

      const res = await request(app)
        .put(`/api/notifications/${notif!._id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const updated = await NotificationModel.findById(notif!._id);
      expect(updated!.read).toBe(true);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('يجب يعلّم كل الـ notifications كـ read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const unreadCount = await NotificationModel.countDocuments({ user: userId, read: false });
      expect(unreadCount).toBe(0);
    });
  });
});


