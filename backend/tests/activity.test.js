const request = require('supertest');
const app = require('../src/app');

async function loginAs(username, password) {
  const res = await request(app).post('/auth/login').send({ username, password });
  return res.body.token;
}

describe('Activity Log', () => {
  test('admin can read activity logs', async () => {
    const token = await loginAs(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
    const res = await request(app)
      .get('/activity')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('user cannot read activity logs', async () => {
    const token = await loginAs(process.env.USER_USERNAME, process.env.USER_PASSWORD);
    const res = await request(app)
      .get('/activity')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});