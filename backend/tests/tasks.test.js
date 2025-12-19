const request = require('supertest');
const app = require('../src/app');

async function loginAs(username, password) {
  const res = await request(app).post('/auth/login').send({ username, password });
  return res.body.token;
}

describe('Tasks', () => {
  test('admin can create and delete tasks', async () => {
    const token = await loginAs(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);

    const createRes = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Admin Task', description: 'Created by admin' });

    expect(createRes.status).toBe(201);
    const taskId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
  });

  test('user can edit and complete but not delete', async () => {
    const adminToken = await loginAs(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
    const userToken = await loginAs(process.env.USER_USERNAME, process.env.USER_PASSWORD);

    const createRes = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'User Editable', description: 'Edit me' });

    const taskId = createRes.body.id;

    const editRes = await request(app)
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Edited Title' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.title).toBe('Edited Title');

    const completeRes = await request(app)
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ completed: true });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.completed).toBe(true);

    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(deleteRes.status).toBe(403);
  });
});