/** @jest-environment node */

import request from 'supertest';
import app from '../server.cjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '../db.json');
let originalDb;

beforeAll(() => {
  // Backup original db
  if (fs.existsSync(dbFilePath)) {
    originalDb = fs.readFileSync(dbFilePath, 'utf-8');
  } else {
    originalDb = JSON.stringify({ users: [], taskLists: [], tasks: [] });
  }
});

afterAll(() => {
  // Restore original db
  fs.writeFileSync(dbFilePath, originalDb);
});

beforeEach(() => {
  // Reset db to a clean state for each test
  const cleanDb = { users: [], taskLists: [], tasks: [] };
  fs.writeFileSync(dbFilePath, JSON.stringify(cleanDb, null, 2));
});

describe('User API', () => {
  it('should allow a user to sign up', async () => {
    console.log('Testing user signup: should create a new user successfully.');
    const res = await request(app)
      .post('/api/signup')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('test@example.com');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('should not allow signup with an existing email', async () => {
    console.log('Testing user signup: should fail if email is already in use.');
    // First signup
    await request(app)
      .post('/api/signup')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    // Second signup with same email
    const res = await request(app)
      .post('/api/signup')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Email already in use.');
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Create a user to login with
      await request(app)
        .post('/api/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should allow a registered user to log in', async () => {
      console.log('Testing user login: should succeed with correct credentials.');
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe('test@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should not allow login with a wrong password', async () => {
      console.log('Testing user login: should fail with incorrect password.');
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should not allow login for a non-existent user', async () => {
      console.log('Testing user login: should fail for a user that does not exist.');
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'nouser@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });
});