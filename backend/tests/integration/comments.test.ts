import request from 'supertest';
import { createApp } from '../../src/app';
import { createAuthedUser } from '../utils/testAuth';

const app = createApp();

async function createTask(app: import('express').Express, token: string, title = 'Task with comments') {
  const res = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${token}`).send({ title });
  return res.body.data.task._id as string;
}

describe('Comments', () => {
  it('adds a comment to a task with the author set from the authenticated user', async () => {
    const { token, user } = await createAuthedUser(app);
    const taskId = await createTask(app, token);

    const res = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Looks good to me' });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.body).toBe('Looks good to me');
    expect(res.body.data.comment.author._id).toBe(user._id);
  });

  it('rejects an empty comment', async () => {
    const { token } = await createAuthedUser(app);
    const taskId = await createTask(app, token);

    const res = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '' });

    expect(res.status).toBe(400);
  });

  it('lists comments for a task in chronological order', async () => {
    const { token } = await createAuthedUser(app);
    const taskId = await createTask(app, token);

    await request(app).post(`/api/v1/tasks/${taskId}/comments`).set('Authorization', `Bearer ${token}`).send({ body: 'first' });
    await request(app).post(`/api/v1/tasks/${taskId}/comments`).set('Authorization', `Bearer ${token}`).send({ body: 'second' });

    const res = await request(app).get(`/api/v1/tasks/${taskId}/comments`).set('Authorization', `Bearer ${token}`);
    expect(res.body.data.comments.map((c: { body: string }) => c.body)).toEqual(['first', 'second']);
  });

  it('lets the author delete their own comment but blocks other users', async () => {
    const author = await createAuthedUser(app, { email: 'author@taskflow.io' });
    const otherUser = await createAuthedUser(app, { email: 'other@taskflow.io' });
    const taskId = await createTask(app, author.token);

    const comment = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${author.token}`)
      .send({ body: 'delete me' });
    const commentId = comment.body.data.comment._id;

    const blocked = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherUser.token}`);
    expect(blocked.status).toBe(403);

    const allowed = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${author.token}`);
    expect(allowed.status).toBe(200);
  });

  it('returns 404 when commenting on a task that does not exist', async () => {
    const { token } = await createAuthedUser(app);
    const res = await request(app)
      .post('/api/v1/tasks/64b64b64b64b64b64b64b64b/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'orphan comment' });

    expect(res.status).toBe(404);
  });
});
