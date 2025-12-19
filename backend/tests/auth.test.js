const request = require('supertest');
const app = require('../src/app');

describe('Auth', () => {
  test('login with admin credentials returns token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('ADMIN');
  });

  test('login fails with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: process.env.ADMIN_USERNAME, password: 'wrong' });
    expect(res.status).toBe(401);
  });
});