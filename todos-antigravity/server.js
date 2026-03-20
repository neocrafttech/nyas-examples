require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.connect((err) => {
    if (err) {
        console.error('Failed to connect to db:', err.message);
    } else {
        console.log('Connected to PostgreSQL database');
    }
});

// API Routes

// Get all todos
app.get('/api/todos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching todos:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new todo
app.post('/api/todos', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO todos (title, completed) VALUES ($1, false) RETURNING *',
            [title]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating todo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a todo (toggle completion or change title)
app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { title, completed } = req.body;

    try {
        // Determine what to update
        const currentTask = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);

        if (currentTask.rows.length === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        const newTitle = title !== undefined ? title : currentTask.rows[0].title;
        const newCompleted = completed !== undefined ? completed : currentTask.rows[0].completed;

        const { rows } = await pool.query(
            'UPDATE todos SET title = $1, completed = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [newTitle, newCompleted, id]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error('Error updating todo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting todo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete completed todos
app.delete('/api/todos-completed/clear', async (req, res) => {
    try {
        const { rowCount } = await pool.query('DELETE FROM todos WHERE completed = true');
        res.json({ message: `Cleared ${rowCount} completed tasks` });
    } catch (err) {
        console.error('Error clearing completed todos:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
