# Nyas CRM Sample Application

This is a sample Customer Relationship Management (CRM) application built using Next.js, Prisma, Tailwind CSS, and a PostgreSQL database provisioned via [Nyas](https://nyas.io/).

> **Original Prompt:** "Using https://nyas.io/ build a sample CRM app."

## Features
- **Dashboard**: Track overall customer metrics, pipeline values, and recent activity.
- **Customers**: Manage the directory of customers with their associated companies and deals.
- **Deals Kanban**: A visual pipeline to track sales from "Lead" to "Won" or "Lost".

## Prerequisites

1. Node.js (v18+)
2. [Nyas CLI](https://nyas.io/) for provisioning a cloud Postgres database.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure the Database
We use **Nyas** to instantly provision a Postgres instance.

1. **Install the Nyas CLI** (if you haven't already):
   ```bash
   curl -LsSf https://app.nyas.io/install.sh | sh
   ```
2. **Start a new Database**:
   ```bash
   nyas start --json
   ```
   *Note: This will prompt you to authenticate via your browser.*
3. **Get your Database URL**:
   The output of the previous command will provide a few connection strings. Copy the standard `session` connection string (it typically runs on port 5452).
4. **Set the Environment Variable**:
   Create a `.env` file in the root of the project and add your copied connection string:
   ```env
   DATABASE_URL="postgres://..."
   ```

### 3. Initialize the Database Schema
Push the Prisma schema to your newly created database and generate the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

### 4. Run the Application
Start the Next.js development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application!

## Tech Stack
- Next.js (App Router, Server Actions)
- Prisma ORM (v7 + `@prisma/adapter-pg`)
- Tailwind CSS & Lucide Icons
- Nyas Postgres
