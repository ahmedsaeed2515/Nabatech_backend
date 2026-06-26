import NotificationModel from '../../../models/notification_model';
import { createFakeUser } from '../../factories';
import mongoose from 'mongoose';

describe('[UNIT] NotificationModel', () => {

  it('يجب ينشئ notification بشكل صح', async () => {
    const user = createFakeUser();
    const notif = await NotificationModel.create({
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
    await expect(NotificationModel.create({
      user: new mongoose.Types.ObjectId(),
      title: 'Test',
      body: 'Test body',
      type: 'INVALID_TYPE_XYZ'
    })).rejects.toThrow();
  });

  it('يجب يرفض notification من غير title', async () => {
    await expect(NotificationModel.create({
      user: new mongoose.Types.ObjectId(),
      body: 'Test body',
      type: 'SYSTEM'
    })).rejects.toThrow();
  });

  it('يجب يرجع unread count صح', async () => {
    const userId = new mongoose.Types.ObjectId();

    // Create 3 notifications: 2 unread, 1 read
    await NotificationModel.create([
      { user: userId, title: 'N1', body: 'B1', type: 'SYSTEM', read: false },
      { user: userId, title: 'N2', body: 'B2', type: 'SYSTEM', read: false },
      { user: userId, title: 'N3', body: 'B3', type: 'SYSTEM', read: true }
    ]);

    const count = await NotificationModel.countDocuments({ user: userId, read: false });
    expect(count).toBe(2);
  });
});


