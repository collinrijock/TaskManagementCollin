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
  it('should allow a user to sign up and create a default task list', async () => {
    console.log('Testing user signup: should create a new user and a default task list successfully.');
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
    expect(res.body).toHaveProperty('defaultTaskListId');

    const db = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
    const taskList = db.taskLists.find(tl => tl.id === res.body.defaultTaskListId);
    expect(taskList).toBeDefined();
    expect(taskList.ownerId).toBe(res.body.id);
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

    it('should allow a registered user to log in and return the default task list ID', async () => {
      console.log('Testing user login: should succeed and return user data with default task list ID.');
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe('test@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).toHaveProperty('defaultTaskListId');
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