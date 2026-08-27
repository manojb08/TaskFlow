import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Auth', () => {
  const credentials = { name: 'Test User', email: 'test@taskflow.io', password: 'password123' };

  it('registers a new user and returns an access token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(credentials.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']?.[0]).toMatch(/taskflow_refresh/);
  });

  it('rejects registering the same email twice', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects registration with a short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...credentials, password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);

    const good = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(good.status).toBe(200);
    expect(good.body.data.accessToken).toEqual(expect.any(String));

    const bad = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });
    expect(bad.status).toBe(401);
  });

  it('rejects /auth/me without a token and accepts it with one', async () => {
    const unauth = await request(app).get('/api/v1/auth/me');
    expect(unauth.status).toBe(401);

    const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
    const token = registerRes.body.data.accessToken;

    const authed = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(authed.status).toBe(200);
    expect(authed.body.data.user.email).toBe(credentials.email);
  });
});
