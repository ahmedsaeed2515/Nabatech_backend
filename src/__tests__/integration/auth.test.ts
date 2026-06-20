import request from 'supertest';
import app from '../../app'; // Your Express app
import UserModel from '../../models/user_model';
import mongoose from 'mongoose';
import { createFakeUser } from '../factories';
import bcrypt from 'bcryptjs'; // Using bcryptjs as in your package.json

describe('[INTEGRATION] Auth API', () => {

  describe('POST /api/auth/register', () => {
    it('يجب ينجح ويرجع tokens لو بيانات صح', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Ahmed Test',
        email: 'ahmed.test@nabatech.com',
        password: 'SecurePass123!',
        role: 'user',
        country: 'Egypt'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('ahmed.test@nabatech.com');
      // Password must NOT be returned
      expect(res.body.user.password).toBeUndefined();
    });

    it('يجب يرفض email مكرر', async () => {
      await UserModel.create({
        ...createFakeUser(),
        email: 'duplicate@test.com'
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Someone',
        email: 'duplicate@test.com',
        password: 'Pass123!',
        role: 'user'
      });

      expect(res.status).toBe(409);
    });

    it('يجب يرفض password ضعيف', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test',
        email: 'new@test.com',
        password: '123'
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hashed = await bcrypt.hash('TestPass123!', 10);
      await UserModel.create({ ...createFakeUser(), email: 'login@test.com', password: hashed });
    });

    it('يجب يرجع JWT tokens لو credentials صح', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'TestPass123!'
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('يجب يرجع 401 لو password غلط', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'WrongPassword'
      });

      expect(res.status).toBe(401);
    });
  });
});
