# FinSight Web App — Personal Finance & AI Insights

FinSight is a full-stack personal finance web application with AI-powered analytics. It features a React SPA frontend styled with Tailwind CSS v4 and a FastAPI backend with MySQL.

---

## Features

- **Dashboard & Summary**: Real-time stats for income, expenses, net savings, and savings rate
- **Transaction Ledger**: Search, filter, soft-delete, and restore transactions
- **Budgeting**: Set monthly budgets per category with visual progress bars and alerts
- **Savings Goals**: Track milestones, fund goals, and mark them complete
- **AI Analytics**: Spending prediction via Linear Regression, transaction clustering via K-Means
- **PDF Reports**: Export monthly financial summaries as formatted PDFs
- **Multi-Currency**: Supports INR, USD, NPR with live exchange rates

---

## Tech Stack

| Layer       | Technology                           |
|-------------|--------------------------------------|
| Frontend    | React 19, TypeScript, Vite           |
| Styling     | Tailwind CSS v4, Lucide Icons        |
| State       | TanStack Query v5 (React Query)      |
| Forms       | React Hook Form + Zod                |
| Charts      | Recharts                             |
| Backend     | FastAPI (Python)                     |
| Database    | MySQL 8.0 with PyMySQL               |
| Auth        | JWT (python-jose) + bcrypt           |
| ML/AI       | scikit-learn (Linear Regression, K-Means) |
| PDF         | ReportLab                            |
| Deployment  | Render                               |

---

## System Architecture

Single FastAPI Backend Architecture — a layered design:

```
Frontend (React SPA)  ──HTTP──>  FastAPI API  ──>  Services  ──>  Repositories  ──>  MySQL
```

- **`api/`** — Route handlers and request validation (Pydantic)
- **`services/`** — Business logic layer
- **`repositories/`** — Data access layer
- **`utils/`** — ML models, PDF generator, currency rates, recurring logic

---

## Folder Structure

```
finsightwebapp/
├── frontend/                  # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── api/               # Axios HTTP client with JWT interceptors
│   │   ├── components/        # Protected/Auth routes, Layout, Sidebar
│   │   ├── contexts/          # AuthContext (persistent sessions)
│   │   ├── pages/             # Dashboard, Transactions, Categories, Budgets, Goals, Analytics, Settings
│   │   ├── services/          # API service functions
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Currency formatting utilities
│   ├── .env
│   └── package.json
│
├── backend/                   # FastAPI Server
│   ├── api/                   # API router (main.py)
│   ├── database/              # MySQL schema and migration SQL files
│   ├── repositories/          # Data access layer
│   ├── services/              # Business logic
│   ├── schemas/               # Pydantic request/response models
│   ├── utils/                 # ML, PDF, currency, config
│   ├── .env.example
│   └── pyproject.toml
│
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- Python 3.13+
- Node.js 20+
- MySQL 8.0

### 1. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE finsight;
```

Run the schema and migration files in `backend/database/` against your database.

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Unix/macOS: source .venv/bin/activate
pip install -e .
```

Copy and edit the environment file:

```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

Run the server:

```bash
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs will be available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Description                | Default                             |
|-------------------------|----------------------------|-------------------------------------|
| `FINSIGHT_DB_HOST`      | MySQL host                 | `localhost`                         |
| `FINSIGHT_DB_USER`      | MySQL user                 | `root`                              |
| `FINSIGHT_DB_PASSWORD`  | MySQL password             |                                     |
| `FINSIGHT_DB_NAME`      | MySQL database name        | `finsight`                          |
| `JWT_SECRET_KEY`        | JWT signing secret         | `change-this-to-a-random-secret`    |
| `JWT_ALGORITHM`         | JWT algorithm              | `HS256`                             |
| `JWT_EXPIRATION_MINUTES`| Token expiry               | `1440`                              |
| `API_HOST`              | Server bind address        | `0.0.0.0`                           |
| `API_PORT`              | Server port                | `8000`                              |

### Frontend (`frontend/.env`)

| Variable       | Description          | Default                  |
|----------------|----------------------|--------------------------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000`   |

---

## Running Backend

```bash
cd backend
source .venv/bin/activate   # Windows: .venv\Scripts\activate
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## Running Frontend

```bash
cd frontend
npm run dev
```

---

## ML Features

### Linear Regression

The `/insights/predict` endpoint uses `sklearn.linear_model.LinearRegression` to predict next month's total spending based on the last 12 months of historical expense data. It returns a predicted total, trend direction (rising/falling/stable), and an R² confidence score.

### K-Means Clustering

The `/insights/cluster` endpoint uses `sklearn.cluster.KMeans` to group expense transactions into behavioral clusters (e.g., High Spends, Everyday Essentials, Occasional). It uses features like amount, day of month, day of week, and weekend flag, scaled with `StandardScaler`.

---

## Screenshots

*(Screenshots to be added)*

---

## Deployment

### Backend

Deployed on Render. Set the following environment variables in the Render dashboard:

- `FINSIGHT_DB_HOST`, `FINSIGHT_DB_USER`, `FINSIGHT_DB_PASSWORD`, `FINSIGHT_DB_NAME`
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRATION_MINUTES`
- `FINSIGHT_ENV=production`

Start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

### Frontend

Build the frontend and serve it from the backend or a static host:

```bash
cd frontend
npm run build
```
