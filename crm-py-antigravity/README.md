# Nyas Sample CRM App

This beautiful, modern Customer Relationship Management (CRM) application was generated to demonstrate building an app using Python (`uv`), **FastAPI**, **SQLModel**, and **Nyas** Managed PostgreSQL database.

## Generating Prompt
This application was generated using the following prompt:
> "Using https://stage.nyas.io/ build a sample CRM app, use Python with uv"

## Features
- **Dashboard**: Real-time stats on customers, deals, and total pipeline value.
- **Customers Directory**: Add and manage customer records.
- **Deals Kanban Board**: An interactive, drag-and-drop Kanban pipeline for tracking sales deals across different stages (Lead, Proposal, Negotiation, Won, Lost).
- **Premium UI**: Custom Vanilla CSS featuring glassmorphism, responsive grid layouts, and smooth animations.

## Tech Stack
- **Python Package Manager:** `uv`
- **Backend Framework:** FastAPI
- **Database ORM:** SQLModel (SQLAlchemy under the hood)
- **Database Provider:** [Nyas Postgres](https://stage.nyas.io/)
- **Frontend:** HTML, Jinja2 Templates, Vanilla CSS, JS

## Getting Started

### Prerequisites
- Install [uv](https://github.com/astral-sh/uv)
- Install [Nyas CLI](https://stage.nyas.io/) (`curl -LsSf https://stage-app.nyas.io/install.sh | sh`)

### Setup Instructions

1. **Clone/Navigate to the Directory:**
   ```bash
   cd crm-py-antigravity
   ```

2. **Provision the Database:**
   Use the Nyas CLI to provision a Postgres database for the project.
   ```bash
   nyas create crm-app
   ```
   *Note: This generates a connection string which must be stored in a `.env` file in the root directory.*

   Create a `.env` file like so:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[db]"
   ```

3. **Install Dependencies:**
   Ensure dependencies are installed using `uv`:
   ```bash
   uv sync
   ```
   *(We use `fastapi`, `uvicorn`, `sqlmodel`, `psycopg2-binary`, `jinja2`, `python-multipart`, and `python-dotenv`)*

4. **Seed the Database (Optional but Recommended):**
   Run the seeding script to populate the CRM with dummy customers and deals.
   ```bash
   uv run python seed.py
   ```

5. **Run the Application:**
   Start the FastAPI development server.
   ```bash
   uv run uvicorn main:app --reload --port 8000
   ```
   
6. **Access the CRM:**
   Open your browser and navigate to [http://localhost:8000](http://localhost:8000).
