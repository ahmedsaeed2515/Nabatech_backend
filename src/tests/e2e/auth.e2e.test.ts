import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../setup';

setupTestDB();

describe('Auth Module E2E', () => {
  const testUser = {
    email: 'e2e@example.com',
    password: 'password123',
    name: 'E2E User'
  };

  it('POST /v2/auth/register - Should successfully create a user and return a JWT', async () => {
    const res = await request(app)
      .post('/api/v2/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('email', testUser.email);
  });

  it('POST /v2/auth/register - Should fail (400) if the email is already registered', async () => {
    const res = await request(app)
      .post('/api/v2/auth/register')
      .send(testUser)
      .expect(400);

    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('POST /v2/auth/login - Should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/v2/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      })
      .expect(401);

    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('POST /v2/auth/login - Should succeed with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v2/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('email', testUser.email);
  });
});
