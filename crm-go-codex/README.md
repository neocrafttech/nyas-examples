# Nyas CRM Sample Application in Go

This project is a basic CRM application built with Go, server-rendered HTML, and PostgreSQL on Nyas.

> Original prompt: "Using https://stage.nyas.io/ and Go as language build a basic CRM app."

## Features

- Dashboard with customer count, deal count, pipeline value, won value, and recent activity
- Customer directory with create and delete flows
- Deal pipeline board with create, stage update, and delete flows
- Automatic schema bootstrap and demo data for a fresh database

## Prerequisites

1. Go 1.24+
2. A PostgreSQL connection string from Nyas

## Setup

### 1. Get database credentials from Nyas

1. Install the Nyas CLI if you do not already have it:

```bash
curl -LsSf https://app.nyas.io/install.sh | sh
```

2. Start a new Nyas database session:

```bash
nyas start --json
```

3. Sign in through the browser flow if Nyas prompts you to authenticate.

4. In the command output, copy the standard Postgres session connection string.
   In the sibling Nyas examples in this repo, this is described as the regular `session` connection string, typically the one using port `5452`.

5. Create a local `.env` file in the project root and paste that connection string into `DATABASE_URL`:

```env
DATABASE_URL=postgres://username:password@hostname:port/database_name
```

If your Nyas connection string already includes SSL settings, keep them as-is.

### 2. Install Go dependencies

```bash
go mod tidy
```

### 3. Database initialization / migration

There is no separate migration command for this starter.

When the server starts, it automatically:

- creates the `customers` table if it does not exist
- creates the `deals` table if it does not exist
- adds a small set of demo records only when the database is empty

That means your database setup step is simply to start the app with a valid `DATABASE_URL`.

### 4. Run the app

```bash
set -a
source .env
set +a
go run ./cmd/server
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Optional build verification

If you want to verify the project compiles before starting it, run:

```bash
CGO_ENABLED=0 go build ./...
```

## Notes

- The app creates its own `customers` and `deals` tables on startup.
- Timestamps are stored in epoch seconds in the database and localized in the browser when rendered.
- Demo records are inserted only when the database starts empty.
