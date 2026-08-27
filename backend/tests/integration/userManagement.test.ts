import request from 'supertest';
import { createApp } from '../../src/app';
import { createAuthedUser } from '../utils/testAuth';
import { User } from '../../src/models/User';
import { signAccessToken } from '../../src/utils/jwt';

const app = createApp();

async function createAuthedAdmin(overrides: Partial<{ name: string; email: string }> = {}) {
  const authed = await createAuthedUser(app, overrides);
  await User.findByIdAndUpdate(authed.user._id, { role: 'admin' });
  // The access token issued at registration still encodes the old role; mint a fresh one directly
  // rather than re-authenticating through /login, which would also consume the shared authLimiter.
  const token = signAccessToken({ sub: authed.user._id, role: 'admin' });
  return { token, user: { ...authed.user, role: 'admin' } };
}

describe('User management', () => {
  describe('POST /users (invite)', () => {
    it('rejects a non-admin with 403', async () => {
      const { token } = await createAuthedUser(app);

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Member', email: 'invitee@taskflow.io' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects an unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .send({ name: 'New Member', email: 'invitee@taskflow.io' });

      expect(res.status).toBe(401);
    });

    it('lets an admin invite a user and returns an inviteToken/inviteUrl', async () => {
      const { token } = await createAuthedAdmin({ email: 'admin1@taskflow.io' });

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invited Person', email: 'invited1@taskflow.io' });

      expect(res.status).toBe(201);
      expect(res.body.data.inviteToken).toEqual(expect.any(String));
      expect(res.body.data.inviteUrl).toContain(res.body.data.inviteToken);
      expect(res.body.data.inviteUrl).toContain('/accept-invite?token=');
      expect(res.body.data.user.email).toBe('invited1@taskflow.io');
      expect(res.body.data.user.status).toBe('invited');
      expect(res.body.data.user.role).toBe('member');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects inviting an email that is already registered', async () => {
      const { token } = await createAuthedAdmin({ email: 'admin2@taskflow.io' });
      await createAuthedUser(app, { email: 'existing@taskflow.io' });

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Duplicate', email: 'existing@taskflow.io' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('cannot log in as the invited user with a guessed or empty password', async () => {
      const { token } = await createAuthedAdmin({ email: 'admin3@taskflow.io' });
      const inviteRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invited Two', email: 'invited2@taskflow.io' });
      expect(inviteRes.status).toBe(201);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invited2@taskflow.io', password: 'password123' });

      expect(loginRes.status).toBe(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('rejects an unauthenticated request', async () => {
      const res = await request(app).patch('/api/v1/users/me').send({ name: 'New Name' });
      expect(res.status).toBe(401);
    });

    it("updates only the caller's own name", async () => {
      const { token, user } = await createAuthedUser(app, { email: 'self-update@taskflow.io' });

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user._id).toBe(user._id);
      expect(res.body.data.user.email).toBe('self-update@taskflow.io');
      expect(res.body.data.user.role).toBe('member');
    });
  });
});
