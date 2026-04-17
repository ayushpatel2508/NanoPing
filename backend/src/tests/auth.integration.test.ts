import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { app, server, io } from '../index.js';
import pool from '../config/db.js';

describe('Auth Integration Tests', () => {
  
  // Before all, we should theoretically run migrations, 
  // but we'll assume the user has run them for now or we do it manually.
  
  beforeEach(async () => {
    // Clean up users table before each test
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    // Close connections
    await pool.end();
    server.close();
    io.close();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toContain('success');
  });

  it('should not register a user with an existing email', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    // Second registration with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password456',
        name: 'Test User 2'
      });

    expect(res.status).toBe(409); // Controller returns 409 for existing user
    expect(res.body.status).toBe('error');
  });

  it('should login an existing user', async () => {
    // Register first
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@example.com',
        password: 'password123',
        name: 'Login User'
      });

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('accessToken');
  });
});
