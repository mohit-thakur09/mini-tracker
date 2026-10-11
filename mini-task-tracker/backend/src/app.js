const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Task = require('./taskModel');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/tasks', async (req, res, next) => {
  try {
    const { status } = req.query;
    const allowedStatuses = ['To Do', 'In Progress', 'Done'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status must be To Do, In Progress, or Done.' });
    }
    const tasks = await Task.find(status ? { status } : {}).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (error) { return next(error); }
});

app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, status, priority } = req.body || {};
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({ error: 'Title must be 100 characters or fewer.' });
    }
    if (status !== undefined && !['To Do', 'In Progress', 'Done'].includes(status)) {
      return res.status(400).json({ error: 'Status must be To Do, In Progress, or Done.' });
    }
    if (priority !== undefined && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string.' });
    }
    const task = await Task.create({ title: title.trim(), description, status, priority });
    return res.status(201).json(task);
  } catch (error) { return next(error); }
});

app.patch('/tasks/:id', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }
    if (!['To Do', 'In Progress', 'Done'].includes(status)) {
      return res.status(400).json({ error: 'Status must be To Do, In Progress, or Done.' });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    return res.json(task);
  } catch (error) { return next(error); }
});

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(error.errors).map(item => item.message).join(' ') });
  }
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
