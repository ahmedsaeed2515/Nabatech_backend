import request from 'supertest';
import app from '../../app';
import UserModel from '../../models/user_model';
import TaskModel, { TaskStatus } from '../../models/task_model';
import { createFakeUser } from '../factories';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('[INTEGRATION] Task Controller (V2) - Phase 4', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
    jest.clearAllMocks();
  });

  describe('Tasks CRUD & Complete', () => {
    it('PASS: Create Task', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Water the Basil',
          dueDate: new Date().toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Water the Basil');
      expect(res.body.data.status).toBe(TaskStatus.PENDING);
    });

    it('PASS: Get Daily Tasks', async () => {
      const today = new Date();
      await TaskModel.create({
        user: userId,
        title: 'Daily Check',
        dueDate: today,
        status: TaskStatus.PENDING
      });

      const res = await request(app)
        .get(`/api/v1/tasks/daily?date=${today.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('Daily Check');
    });

    it('PASS: Update Task', async () => {
      const task = await TaskModel.create({
        user: userId,
        title: 'Old Title',
        dueDate: new Date(),
        status: TaskStatus.PENDING
      });

      const res = await request(app)
        .put(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Title'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('New Title');
    });

    it('PASS: Delete Task', async () => {
      const task = await TaskModel.create({
        user: userId,
        title: 'To Be Deleted',
        dueDate: new Date(),
        status: TaskStatus.PENDING
      });

      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const check = await TaskModel.findById(task._id);
      expect(check).toBeNull(); // Hard deleted as per service implementation
    });

    it('PASS: Complete Task', async () => {
      const task = await TaskModel.create({
        user: userId,
        title: 'To Be Completed',
        dueDate: new Date(),
        status: TaskStatus.PENDING
      });

      const res = await request(app)
        .put(`/api/v1/tasks/${task._id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TaskStatus.COMPLETED);

      const check = await TaskModel.findById(task._id);
      expect(check?.status).toBe(TaskStatus.COMPLETED);
    });
  });
});
