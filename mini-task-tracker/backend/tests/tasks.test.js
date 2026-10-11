const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Task = require('../src/taskModel');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 30000);

afterEach(async () => { await Task.deleteMany({}); });

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

test('rejects task creation when title is missing', async () => {
  const response = await request(app).post('/tasks').send({ description: 'No title' });
  expect(response.status).toBe(400);
  expect(response.body.error).toMatch(/title is required/i);
  expect(await Task.countDocuments()).toBe(0);
});

test('successfully updates a task status', async () => {
  const task = await Task.create({ title: 'Test task', status: 'To Do', priority: 'Medium' });
  const response = await request(app).patch(`/tasks/${task._id}`).send({ status: 'Done' });
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('Done');
  expect((await Task.findById(task._id)).status).toBe('Done');
});
