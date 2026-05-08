# SpendSense 

**AI-Powered Financial Behavior Analyzer**

SpendSense transforms raw transaction data into behavioral insights using GPT-4o. Stop staring at pie charts — understand *why* your spending is the way it is.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Recharts, Framer Motion, Zustand |
| Backend | FastAPI (Python), SQLAlchemy, PostgreSQL |
| AI | OpenAI GPT-4o |
| Auth | JWT + bcrypt |
| Styling | Vanilla CSS design system (Calistoga + Inter) |

## Features

-  **Interactive Dashboard** — area charts, donut charts, calendar heatmap, radar
-  **AI Analysis** — behavioral insights, anomaly detection, personalized recommendations
-  **AI Chat** — conversational financial Q&A grounded in your data
-  **Transaction Management** — full CRUD with filtering, search, bulk CSV import
-  **Budget Tracking** — set limits per category, track vs actual spending
-  **Savings Goals** — visual progress with deadline countdowns
-  **Analytics** — financial health score, weekday/weekend breakdown, recurring charges
-  **CSV Import** — drag-and-drop, preview, bulk import

## Quick Start

### 1. Clone & configure env

```bash
cd /Users/neel/Documents/FinanceTracker
cp .env.example .env
# Fill in DATABASE_URL and OPENAI_API_KEY
```

### 2. Start the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Set up database

The API auto-creates all tables on startup via SQLAlchemy. Just make sure your `DATABASE_URL` in `.env` points to a running PostgreSQL instance.

```sql
-- Create database (run in psql)
CREATE DATABASE spendsense;
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/spendsense
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Docs

FastAPI auto-generates docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
FinanceTracker/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py           # JWT utilities
│   ├── database.py       # DB connection
│   ├── config.py         # Settings
│   └── routes/
│       ├── auth.py       # Register/login
│       ├── transactions.py
│       ├── budgets.py
│       ├── goals.py
│       └── ai.py         # GPT-4o integration
└── frontend/
    └── src/
        ├── app/
        │   ├── dashboard/  # All dashboard pages
        │   ├── login/
        │   └── register/
        ├── components/
        │   └── charts/     # Recharts components
        ├── store/          # Zustand auth store
        └── lib/            # API client, constants
```

## Git Workflow

See [GIT_COMMIT_GUIDE.md](./GIT_COMMIT_GUIDE.md) for the 5-branch multi-contributor commit process.
