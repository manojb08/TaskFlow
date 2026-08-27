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

describe('Credential flow (invite + forgot password, shared token mechanism)', () => {
  describe('POST /auth/forgot-password', () => {
    it('returns the same generic response shape for an existing and a non-existing email', async () => {
      await createAuthedUser(app, { email: 'has-account@taskflow.io' });

      const existing = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'has-account@taskflow.io' });
      const missing = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'no-such-account@taskflow.io' });

      expect(existing.status).toBe(200);
      expect(missing.status).toBe(200);
      expect(existing.body.data.message).toBe('If that email exists, a reset link has been generated.');
      expect(missing.body.data.message).toBe(existing.body.data.message);
    });

    it('includes a resetToken/resetUrl outside production only when the email matches an account', async () => {
      await createAuthedUser(app, { email: 'reset-me@taskflow.io' });

      const existing = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset-me@taskflow.io' });
      const missing = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'no-such-account2@taskflow.io' });

      expect(existing.body.data.resetToken).toEqual(expect.any(String));
      expect(existing.body.data.resetUrl).toContain('/reset-password?token=');
      expect(existing.body.data.resetUrl).toContain(existing.body.data.resetToken);
      expect(missing.body.data.resetToken).toBeUndefined();
      expect(missing.body.data.resetUrl).toBeUndefined();
    });
  });

  describe('POST /auth/set-password', () => {
    it('activates an invited account and allows login with the new password', async () => {
      const { token: adminToken } = await createAuthedAdmin({ email: 'admin-invite@taskflow.io' });
      const inviteRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Invitee', email: 'invitee-activate@taskflow.io' });
      const inviteToken = inviteRes.body.data.inviteToken as string;

      const setRes = await request(app)
        .post('/api/v1/auth/set-password')
        .send({ token: inviteToken, password: 'brandnewpassword' });

      expect(setRes.status).toBe(200);
      expect(setRes.body.data.message).toBe('Password set successfully.');

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invitee-activate@taskflow.io', password: 'brandnewpassword' });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.status).toBe('active');
    });

    it('activates via the reset-password flow too and reflects the new password on login', async () => {
      await createAuthedUser(app, { email: 'reset-flow@taskflow.io' });
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset-flow@taskflow.io' });
      const resetToken = forgotRes.body.data.resetToken as string;

      const setRes = await request(app)
        .post('/api/v1/auth/set-password')
        .send({ token: resetToken, password: 'anotherNewPass1' });
      expect(setRes.status).toBe(200);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'reset-flow@taskflow.io', password: 'anotherNewPass1' });
      expect(loginRes.status).toBe(200);
    });

    it('rejects an invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/set-password')
        .send({ token: 'not-a-real-token', password: 'somepassword1' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects an expired token', async () => {
      const { token: adminToken } = await createAuthedAdmin({ email: 'admin-expired@taskflow.io' });
      const inviteRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Expired Invitee', email: 'expired-invitee@taskflow.io' });
      const inviteToken = inviteRes.body.data.inviteToken as string;
      const userId = inviteRes.body.data.user._id as string;

      await User.findByIdAndUpdate(userId, { credentialTokenExpires: new Date(Date.now() - 1000) });

      const res = await request(app)
        .post('/api/v1/auth/set-password')
        .send({ token: inviteToken, password: 'somepassword1' });

      expect(res.status).toBe(401);
    });

    it('rejects reusing an already-consumed token', async () => {
      const { token: adminToken } = await createAuthedAdmin({ email: 'admin-reuse@taskflow.io' });
      const inviteRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Reuse Invitee', email: 'reuse-invitee@taskflow.io' });
      const inviteToken = inviteRes.body.data.inviteToken as string;

      const first = await request(app)
        .post('/api/v1/auth/set-password')
        .send({ token: inviteToken, password: 'firstpassword1' });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post('/api/v1/auth/set-password')
        .send({ token: inviteToken, password: 'secondpassword1' });
      expect(second.status).toBe(401);
    });
  });
});
