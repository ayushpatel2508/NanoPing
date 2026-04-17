import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { app, server, io } from '../index.js';
import pool from '../config/db.js';
import redisConnection from '../config/redis.js';

describe('Monitor Integration Tests', () => {
  let authCookie: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up tables to ensure a fresh state
    await pool.query('DELETE FROM incidents');
    await pool.query('DELETE FROM checks');
    await pool.query('DELETE FROM monitors');
    await pool.query('DELETE FROM users');
    
    // Clear redis cache to prevent leaking state between tests
    await redisConnection.flushdb();

    // Register a fresh user before each test to get the auth cookie
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'monitor_tester@example.com',
        password: 'password123',
        name: 'Tester'
      });

    // Supertest allows tracking cookies manually for future requests
    // We grab the Set-Cookie header array
    const cookies = res.headers['set-cookie'] as string[] | undefined;
    if (cookies) {
      // Find the accessToken cookie (or just pass all)
      authCookie = cookies.map((c: string) => c.split(';')[0]).join('; ');
    }
    
    userId = res.body.data.id;
  });

  afterAll(async () => {
    await pool.end();
    server.close();
    io.close();
    redisConnection.quit();
  });

  it('should successfully create a new monitor', async () => {
    const res = await request(app)
      .post('/api/monitors')
      .set('Cookie', authCookie)
      .send({
        name: 'Google Production',
        url: 'https://google.com',
        check_interval: 3,
        alert_threshold: 1
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Google Production');
    expect(res.body.data.url).toBe('https://google.com');
  });

  it('should reject a monitor with an invalid URL', async () => {
    const res = await request(app)
      .post('/api/monitors')
      .set('Cookie', authCookie)
      .send({
        name: 'Bad URL',
        url: 'not-a-link',
        check_interval: 5,
        alert_threshold: 3
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Valid HTTP');
  });

  it('should fetch the list of monitors for the user', async () => {
    // 1. Create a monitor first
    await request(app)
      .post('/api/monitors')
      .set('Cookie', authCookie)
      .send({
        name: 'Test Monitor',
        url: 'https://example.com'
      });

    // 2. Fetch the list
    const res = await request(app)
      .get('/api/monitors')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.monitors).toBeInstanceOf(Array);
    expect(res.body.data.monitors.length).toBe(1);
    expect(res.body.data.monitors[0].name).toBe('Test Monitor');
  });

  it('should delete a monitor and remove it from the database', async () => {
    // 1. Create a monitor
    const createRes = await request(app)
      .post('/api/monitors')
      .set('Cookie', authCookie)
      .send({
        name: 'To Be Deleted',
        url: 'https://example.com'
      });
    
    const monitorId = createRes.body.data.id;

    // 2. Delete the monitor
    const delRes = await request(app)
      .delete(`/api/monitors/${monitorId}`)
      .set('Cookie', authCookie);

    expect(delRes.status).toBe(200);
    expect(delRes.body.status).toBe('success');

    // 3. Verify it is gone
    const getRes = await request(app)
      .get(`/api/monitors/${monitorId}`)
      .set('Cookie', authCookie);

    expect(getRes.status).toBe(404);
  });
});
