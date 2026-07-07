# FinSight Web App — Personal Finance Manager

A full-stack personal finance web application with AI-powered spending insights. Track transactions, set budgets, manage savings goals, analyze spending patterns, and generate PDF account statements — all in one dashboard.

---

## Features

- **Dashboard** — Real-time summary cards for income, expenses, net savings, savings rate, and daily spending average
- **Transaction Ledger** — Add, edit, search, filter by month/year, soft-delete, and restore transactions
- **Budgeting** — Set monthly spending limits per category with live progress bars and utilization alerts
- **Savings Goals** — Create goals, track progress, add funds, mark complete, edit targets and deadlines
- **Analytics** — 12-month income/expense trends chart and behavioral spending group profiles
- **Spending Forecast** — ML-driven prediction of next month's spending based on historical patterns
- **Multi-Currency** — Supports INR, USD, NPR with live exchange rates (cached hourly, with hardcoded fallback)
- **PDF Statements** — Generate A4 account statements with transaction ledger and savings goals summary
- **Dark Theme** — Full dark-mode UI (no light mode toggle)

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Recharts, TanStack Query, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0 (raw SQL with prepared statements via `mysql2`) |
| **Authentication** | JWT (`jsonwebtoken`) + Password hashing (`bcrypt`) |
| **Machine Learning** | Python 3, scikit-learn (Linear Regression, K-Means) |
| **PDF Generation** | pdfkit |

---

## Architecture

```
         ┌─────────────────────────────┐
         │  Browser (React SPA)         │
         │  localhost:5173              │
         └──────────┬──────────────────┘
                    │  HTTP (JSON)
                    ▼
         ┌─────────────────────────────┐
         │  Express.js Server           │
         │  Routes → Controllers        │
         │  JWT Auth Middleware         │
         └──────┬──────────┬───────────┘
                │          │
          Raw SQL      Subprocess
                │          │
                ▼          ▼
    ┌────────────────┐  ┌─────────────────────┐
    │  MySQL 8.0     │  │  Python ML Script   │
    │  (5 tables)    │  │  (scikit-learn)     │
    └────────────────┘  └─────────────────────┘
```

The frontend is a React SPA that communicates with the Express backend over HTTP JSON. The backend handles all business logic, authentication, and database operations. Machine learning operations are delegated to a Python subprocess that receives JSON via stdin and returns results via stdout.

---

## Folder Structure

```
finsightwebapp/
├── frontend/                  # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── components/        # AuthRoute, Layout, ProtectedRoute, Sidebar
│   │   ├── pages/             # Dashboard, Transactions, Budgets, Goals, Analytics, Settings, Auth
│   │   ├── services/          # Axios API service definitions
│   │   ├── hooks/             # Custom React hooks (useRates)
│   │   ├── contexts/          # AuthContext (JWT state management)
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Currency formatting, Theme helpers
│   │   └── api/               # Axios client configuration
│   ├── .env
│   └── package.json
│
├── server/                    # Node.js Express.js Backend
│   ├── controllers/           # Auth, Transactions, Goals, Budgets, Analytics, ML Insights
│   ├── routes/                # Route definitions per resource
│   ├── utils/                 # Auth middleware, Currency rates, PDF generator, ML helper
│   ├── ml/                    # Python ML service (ml_service.py + requirements.txt)
│   ├── database/              # Schema definition (schema.sql)
│   ├── db.js                  # MySQL connection pool
│   ├── app.js                 # Express application setup
│   ├── server.js              # Entry point
│   ├── .env                   # Server configuration
│   └── package.json
│
├── backend/                   # Python virtual environment (for ML subprocess)
│   └── .venv/
│
├── test_e2e.js                # E2E integration test suite (46 tests)
└── README.md
```

---

## API Overview

All authenticated endpoints require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Log in and receive JWT | No |
| GET | `/auth/me` | Get current user profile | Yes |

### Transactions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/transactions` | List transactions (filter by month/year) | Yes |
| POST | `/transactions` | Create a transaction | Yes |
| GET | `/transactions/:id` | Get a single transaction | Yes |
| PUT | `/transactions/:id` | Update a transaction | Yes |
| DELETE | `/transactions/:id` | Soft-delete or permanently delete | Yes |
| POST | `/transactions/:id/restore` | Restore a soft-deleted transaction | Yes |
| GET | `/transactions/deleted/recent` | Get recently deleted transactions | Yes |

### Goals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/goals` | List all active/completed goals | Yes |
| POST | `/goals` | Create a savings goal | Yes |
| PUT | `/goals/:id` | Update goal name, target, or deadline | Yes |
| POST | `/goals/:id/fund` | Add funds to a goal | Yes |
| POST | `/goals/:id/complete` | Mark a goal as completed | Yes |
| POST | `/goals/:id/cancel` | Cancel a goal | Yes |
| DELETE | `/goals/:id` | Permanently delete a goal | Yes |

### Budgets

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/budgets` | List budget limits | Yes |
| POST | `/budgets` | Set or update a budget limit | Yes |
| PUT | `/budgets/:id` | Update a budget limit | Yes |
| DELETE | `/budgets/:id` | Delete a budget limit | Yes |
| GET | `/budgets/utilization` | Get budget utilization (spent vs limit) | Yes |

### Dashboard & Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Monthly summary, trends, top categories, budget utilization | Yes |
| GET | `/analytics/trends` | Monthly income/expense trends (12 months) | Yes |

### Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | List user categories (optionally filter by type) | Yes |

### Currency

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/currency/rates` | Get live exchange rates for INR, USD, NPR | No |

### ML Insights

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/insights/predict` | Predict next month's total spending | Yes |
| GET | `/insights/suggest-category` | Suggest a category for a transaction description | Yes |
| GET | `/insights/cluster` | Profile spending into behavioral groups | Yes |
| GET | `/insights/all` | Get all insights (transactions, goals, budgets, predictions, clusters) | Yes |

### Reports

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/report/generate` | Generate PDF account statement | Yes |

### System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check endpoint | No |

---

## Database Design

The application uses a MySQL database with five tables:

- **users** — Stores account credentials, name, email, and currency preferences. Passwords stored as bcrypt hashes.
- **categories** — Per-user income and expense categories with emoji icons and hex colors. Seeded with defaults on registration.
- **transactions** — Core ledger with amount, type (income/expense), category, date, and soft-delete support. Indexed on `(user_id, transaction_date)` for efficient monthly queries.
- **savings_goals** — Tracks goal name, target amount, current progress, deadline, status (active/completed/cancelled), and optional auto-fund configuration.
- **budget_limits** — Per-category monthly spending limits with upsert behavior.

All child tables reference `users(id)` via foreign keys with `ON DELETE CASCADE`.

---

## Machine Learning Service

The Python ML service runs as an isolated subprocess spawned by Express.js. Communication uses JSON over stdin/stdout:

1. Express sends a JSON payload with `mode` (`predict` or `cluster`) and transaction data to the Python script's stdin
2. Python processes the data using scikit-learn and writes the result JSON to stdout
3. Express reads stdout, parses the JSON, and returns it to the frontend

This keeps the Node.js backend free of Python dependencies while allowing the ML service to use scikit-learn directly. The Python environment is managed via a virtual environment at `backend/.venv/`.

---

## Screenshots

> Add screenshots to a `screenshots/` directory and reference them here:
>
> ```
> screenshots/
> ├── dashboard.png
> ├── transactions.png
> ├── goals.png
> ├── budgets.png
> └── analytics.png
> ```
>
> | Dashboard | Transactions |
> |:---:|:---:|
> | ![Dashboard](screenshots/dashboard.png) | ![Transactions](screenshots/transactions.png) |
>
> | Goals | Budgets |
> |:---:|:---:|
> | ![Goals](screenshots/goals.png) | ![Budgets](screenshots/budgets.png) |
>
> | Analytics | |
> |:---:|:---:|
> | ![Analytics](screenshots/analytics.png) | |

---

## Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- MySQL 8.0+

### 1. Clone the Repository

```bash
git clone https://github.com/ShivShah018/finsightwebapp.git
cd finsightwebapp
```

### 2. Database Setup

Create a MySQL database and run the schema file:

```bash
mysql -u root -p < server/database/schema.sql
```

### 3. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm start
```

The server starts at `http://localhost:8000`.

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

### 5. Python ML Service (Optional — for ML features)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r ../server/ml/requirements.txt
```

---

## Running Locally

Start both the backend and frontend:

```bash
# Terminal 1 — Backend
cd server
npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`, register an account, and start tracking your finances.

### Running Tests

```bash
# Ensure the Express server is running, then:
node test_e2e.js
```

---

## Deployment

### Frontend

Build the production bundle:

```bash
cd frontend
npm run build
# Output in frontend/dist/ — deploy to any static file server
```

Set `VITE_API_URL` in `frontend/.env` to point to your deployed backend.

### Backend

```bash
cd server
NODE_ENV=production npm start
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `FINSIGHT_DB_HOST` | MySQL host |
| `FINSIGHT_DB_PORT` | MySQL port (default: 3306) |
| `FINSIGHT_DB_USER` | MySQL user |
| `FINSIGHT_DB_PASSWORD` | MySQL password |
| `FINSIGHT_DB_NAME` | Database name |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens |
| `API_PORT` | Server port (default: 8000) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `ML_PYTHON_PATH` | Path to Python executable (auto-detected if empty) |

### Database

Run the schema migration on your production MySQL instance:

```bash
mysql -h <host> -u <user> -p <database> < server/database/schema.sql
```

### Python ML Service

Ensure the Python virtual environment is set up on the production server and the path is configured via `ML_PYTHON_PATH`.

---

## Future Improvements

- **Unit tests** — Add Jest tests for controllers and utilities
- **Docker support** — Containerize frontend, backend, and database with docker-compose
- **CI/CD pipeline** — Automated build, test, and deployment via GitHub Actions
- **Pagination** — Server-side pagination for large transaction histories
- **Recurring transactions** — Support for monthly bills and automated transaction creation
- **Data export** — CSV export of transactions and budget history
- **Notifications** — Email or in-app alerts for budget overruns and goal milestones
- **Public API** — Rate-limited API access for third-party integrations

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
