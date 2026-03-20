# Simple TODO App with Nyas PostgreSQL build with Anti-gravity

#Prompt : Using https://nyas.io/ build a simple TODO app

This is a simple full-stack TODO application using Express.js on the backend and PostgreSQL for the database.

## Prerequisites

- Node.js installed
- A Postgres database instance (e.g., from [Nyas](https://stage.nyas.io/))

## Setup Instructions

### 1. Database Configuration

You need to provide the connection string for your PostgreSQL database. 

Create a `.env` file in the root directory (if it doesn't exist) and set your `DATABASE_URL`:

```env
DATABASE_URL=postgres://username:password@hostname:port/database_name
```

*(You can get your database credentials by creating a managed PostgreSQL instance on [layer 1 of app.nyas.io](https://app.nyas.io/).)*

### 2. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

### 3. Initialize the Database

Before running the application, you need to create the required `todos` table in your database. Run the initialization script:

```bash
node init-db.js
```
*This will create the table and insert some default demo tasks if the table is empty.*

### 4. Run the Application

Start the Express backend server:

```bash
node server.js
```

The application will be running at [http://localhost:3000](http://localhost:3000). You can open this URL in your browser to interact with the TODO app.
