require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function initDb() {
    try {
        console.log('Connecting to database...');

        // Create the todos table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log('Todos table created or already exists.');

        // Optional: add a test record if table is empty
        const { rows } = await pool.query('SELECT COUNT(*) FROM todos');
        if (parseInt(rows[0].count) === 0) {
            await pool.query(`
        INSERT INTO todos (title, completed) 
        VALUES ('Welcome to your new Todo App!', false),
               ('Try adding a new task', false),
               ('Mark this task as completed', true)
      `);
            console.log('Inserted default demo tasks.');
        }
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

initDb();
