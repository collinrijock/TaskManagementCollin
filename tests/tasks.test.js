/** @jest-environment node */

import request from 'supertest';
import app from '../server.cjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '../db.json');
let originalDb;
let testUser;
let testTaskList;

beforeAll(() => {
  if (fs.existsSync(dbFilePath)) {
    originalDb = fs.readFileSync(dbFilePath, 'utf-8');
  } else {
    originalDb = JSON.stringify({ users: [], taskLists: [], tasks: [] });
  }
});

afterAll(() => {
  fs.writeFileSync(dbFilePath, originalDb);
});

beforeEach(() => {
  // Setup a clean db with a user and a task list
  const db = { users: [], taskLists: [], tasks: [] };

  testUser = {
    id: crypto.randomUUID(),
    email: 'taskuser@example.com',
    passwordHash: '...somehash...',
    createdAt: new Date().toISOString(),
  };

  testTaskList = {
    id: crypto.randomUUID(),
    name: 'Test List',
    ownerId: testUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  testUser.defaultTaskListId = testTaskList.id;

  db.users.push(testUser);
  db.taskLists.push(testTaskList);

  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
});

describe('Task API', () => {
  it('should create a new task for a task list', async () => {
    console.log('Testing task creation: should create a new task.');
    const res = await request(app)
      .post('/api/tasks')
      .send({
        taskListId: testTaskList.id,
        title: 'My first task',
        description: 'This is a test task'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toBe('My first task');
    expect(res.body.taskListId).toBe(testTaskList.id);
    expect(res.body).toHaveProperty('id');
  });

  it('should fetch all tasks for a given task list', async () => {
    console.log('Testing task fetching: should retrieve all tasks for a list.');
    await request(app)
      .post('/api/tasks')
      .send({ taskListId: testTaskList.id, title: 'Task 1' });

    const res = await request(app).get(`/api/tasklists/${testTaskList.id}/tasks`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Task 1');
  });

  it('should update a task', async () => {
    console.log('Testing task update: should modify an existing task.');
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ taskListId: testTaskList.id, title: 'Original Title' });
    const taskId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ title: 'Updated Title', status: 'complete' });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.title).toBe('Updated Title');
    expect(updateRes.body.status).toBe('complete');
    expect(updateRes.body.completedAt).not.toBeNull();
  });

  it('should delete a task', async () => {
    console.log('Testing task deletion: should remove a task from the database.');
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ taskListId: testTaskList.id, title: 'To be deleted' });
    const taskId = createRes.body.id;

    const deleteRes = await request(app).delete(`/api/tasks/${taskId}`);
    expect(deleteRes.statusCode).toEqual(204);

    const db = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
    const taskExists = db.tasks.some(t => t.id === taskId);
    expect(taskExists).toBe(false);
  });

  it('should reorder tasks', async () => {
    console.log('Testing task reordering: should update the order of tasks in a list.');
    const task1 = (await request(app).post('/api/tasks').send({ taskListId: testTaskList.id, title: 'Task 1' })).body;
    const task2 = (await request(app).post('/api/tasks').send({ taskListId: testTaskList.id, title: 'Task 2' })).body;
    const task3 = (await request(app).post('/api/tasks').send({ taskListId: testTaskList.id, title: 'Task 3' })).body;

    const orderedTaskIds = [task3.id, task1.id, task2.id];

    const res = await request(app)
      .post('/api/tasks/reorder')
      .send({ taskListId: testTaskList.id, orderedTaskIds });

    expect(res.statusCode).toEqual(200);

    const db = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
    const tasks = db.tasks.filter(t => t.taskListId === testTaskList.id).sort((a, b) => a.order - b.order);
    expect(tasks.map(t => t.id)).toEqual(orderedTaskIds);
  });
});