const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

const dbFilePath = path.join(__dirname, 'db.json');

const readDb = () => {
  try {
    const dbData = fs.readFileSync(dbFilePath, 'UTF-8');
    return JSON.parse(dbData);
  } catch (error) {
    console.error("Could not read db.json:", error);
    return { users: [], taskLists: [], tasks: [] };
  }
};

const writeDb = (data) => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Could not write to db.json:", error);
  }
};

const apiRouter = express.Router();

// Login route
apiRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    
    const db = readDb();
    const user = db.users.find(u => u.email === email);

    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const result = await bcrypt.compare(password, user.passwordHash);

    if (result) {
      const { passwordHash, ...userToReturn } = user;
      return res.json(userToReturn);
    } else {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Signup route
apiRouter.post('/signup', (req, res) => {
  try {
    const { email, password, createdAt } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    
    const db = readDb();
    const existingUser = db.users.find(u => u.email === email);

    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const newUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      createdAt: createdAt || new Date().toISOString(),
    };

    const newTaskList = {
      id: crypto.randomUUID(),
      name: 'Tasks',
      ownerId: newUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newUser.defaultTaskListId = newTaskList.id;

    db.users.push(newUser);
    db.taskLists.push(newTaskList);
    writeDb(db);

    const { passwordHash: _, ...userToReturn } = newUser;
    res.status(201).json(userToReturn);
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

apiRouter.get('/users/:userId/tasklists', (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  const taskLists = db.taskLists.filter(list => list.ownerId === userId);
  res.json(taskLists);
});

apiRouter.get('/tasklists/:taskListId/tasks', (req, res) => {
  const { taskListId } = req.params;
  const db = readDb();
  const tasks = db.tasks.filter(task => task.taskListId === taskListId);
  res.json(tasks);
});

apiRouter.post('/tasks', (req, res) => {
  try {
    const { taskListId, title, description } = req.body;

    if (!taskListId || !title) {
      return res.status(400).json({ message: 'Task list ID and title are required.' });
    }

    const db = readDb();

    const taskListExists = db.taskLists.some(list => list.id === taskListId);
    if (!taskListExists) {
      return res.status(404).json({ message: 'Task list not found.' });
    }

    const tasksInList = db.tasks.filter(t => t.taskListId === taskListId);
    const newTask = {
      id: crypto.randomUUID(),
      taskListId,
      title,
      description: description || '',
      status: 'incomplete',
      order: tasksInList.length,
      dueDate: null,
      completedAt: null,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.tasks.push(newTask);
    writeDb(db);

    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

apiRouter.post('/tasks/reorder', (req, res) => {
  try {
    const { taskListId, orderedTaskIds } = req.body;
    if (!taskListId || !Array.isArray(orderedTaskIds)) {
      return res.status(400).json({ message: 'Task list ID and ordered task IDs are required.' });
    }

    const db = readDb();
    
    orderedTaskIds.forEach((taskId, index) => {
      const taskIndex = db.tasks.findIndex(t => t.id === taskId && t.taskListId === taskListId);
      if (taskIndex !== -1) {
        db.tasks[taskIndex].order = index;
        db.tasks[taskIndex].updatedAt = new Date().toISOString();
      }
    });

    writeDb(db);
    res.status(200).json({ message: 'Tasks reordered successfully.' });
  } catch (err) {
    console.error('Error reordering tasks:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

apiRouter.patch('/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const db = readDb();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const originalTask = db.tasks[taskIndex];

    if (updates.status === 'complete' && originalTask.status !== 'complete') {
      updates.completedAt = new Date().toISOString();
    } else if (updates.status === 'incomplete') {
      updates.completedAt = null;
    }

    const updatedTask = {
      ...originalTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.tasks[taskIndex] = updatedTask;
    writeDb(db);

    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

apiRouter.delete('/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const db = readDb();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    db.tasks.splice(taskIndex, 1);
    writeDb(db);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.use('/api', apiRouter);

// Serve static files from React build
const buildPath = path.join(__dirname, 'dist');
app.use(express.static(buildPath));

// The "catchall" handler: for any request that doesn't match an API route,
// send back React's index.html file. This allows client-side routing to work.
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
  });
}

module.exports = app;