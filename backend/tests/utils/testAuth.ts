import request from 'supertest';
import { Express } from 'express';

let counter = 0;

export async function createAuthedUser(app: Express, overrides: Partial<{ name: string; email: string }> = {}) {
  counter += 1;
  const email = overrides.email ?? `user${counter}@taskflow.io`;
  const name = overrides.name ?? `User ${counter}`;
  const res = await request(app).post('/api/v1/auth/register').send({ name, email, password: 'password123' });
  return { token: res.body.data.accessToken as string, user: res.body.data.user };
}
