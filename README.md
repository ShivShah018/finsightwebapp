# FinSight Web App — Personal Finance & AI Insights

FinSight is a production-quality, full-stack personal finance web application with AI-powered analytics. It features a React SPA frontend styled with Tailwind CSS, and a lightweight Node.js Express.js backend connecting to a MySQL database with Python-driven Machine Learning insights.

---

## Architecture Overview

FinSight uses a clean, production-grade decoupled architecture:

```
[ Frontend: React SPA (Vite) ]
               │
              HTTP (JSON)
               ▼
[ Backend: Express.js Server ]
        │              │
    Raw SQL        Subprocess
        ▼              ▼
[ DB: MySQL ]    [ ML: Python Script ]
```

- **Frontend**: React 19 SPA built with TypeScript, Vite, Tailwind CSS, TanStack Query, and Recharts.
- **Backend**: Express.js server in `server/` handling routing, controllers, authentication middlewares, PDF reports, and calling the Python ML subprocess.
- **Database**: MySQL schema using prepared statements for relational CRUD operations and strict data consistency.
- **Machine Learning**: A self-contained Python ML script executing Linear Regression (spending forecasting) and K-Means Clustering (spending behavior profiling).

---

## Features

- **Dashboard & Summary**: Real-time cards for income, expenses, net savings, and savings rate.
- **Transaction Ledger**: Search, filter, soft-delete, and restore transactions.
- **Budgeting**: Set monthly budgets per category with progress bars and utilization alerts.
- **Savings Goals**: Track goal progress, fund goals, and mark them complete.
- **AI Analytics**: Spending forecasting and behavioral spending group profiling.
- **PDF Reports**: Export monthly A4 statement summaries as styled PDFs using `pdfkit`.
- **Multi-Currency**: Supports INR, USD, NPR with live exchange rates cached hourly.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Recharts, TanStack Query |
| **Styling** | Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0 (raw SQL queries with prepared statements via `mysql2`) |
| **Auth** | JWT (`jsonwebtoken`) + Password Hashing (`bcrypt`) |
| **ML/AI** | Python (`scikit-learn` for Linear Regression & K-Means Clustering) |
| **PDF** | Node.js `pdfkit` |

---

## Project Structure

```text
finsightwebapp/
├── frontend/                  # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── components/        # Protected routes, Layout, Sidebar, Cards
│   │   ├── pages/             # Dashboard, Transactions, Budgets, Goals, Analytics
│   │   ├── services/          # API service definitions (Axios client)
│   │   └── types/             # TypeScript interfaces
│   ├── .env
│   └── package.json
│
├── server/                    # Node.js Express.js Backend
│   ├── controllers/           # Route controllers (Auth, Transactions, Goals, Budgets, Analytics, ML Insights)
│   ├── routes/                # Route definitions
│   ├── utils/                 # Currency rates, PDF generator, and ML subprocess helper
│   │   ├── currency.js        # Live exchange rates fetcher
│   │   ├── reportGenerator.js # PDFKit monthly statements compiler
│   │   └── mlHelper.js        # Node subprocess runner for python ML
│   ├── ml/                    # Python ML service
│   │   ├── ml_service.py      # Standalone Python script running ML algorithms
│   │   └── requirements.txt   # Python dependencies
│   ├── database/              # Schema reference SQL files
│   ├── db.js                  # MySQL connection pooling setup
│   ├── app.js                 # Express application & middleware setup
│   ├── server.js              # Server entry point
│   ├── .env                   # Server configuration variables
│   └── package.json           # Node dependencies
│
├── backend/                   # Python virtual environment (for ML subprocess)
│   └── .venv/                 # Python venv for scikit-learn & numpy
│
├── test_e2e.js                # E2E integration test suite
├── LICENSE
└── README.md
```

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- Python 3.10+ (with virtual environment support)
- MySQL 8.0+

### 1. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE finsight;
```

Run the schema and migration files located in `server/database/schema.sql` against your local database.

### 2. Backend Setup

1. Navigate to the `server/` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Copy and customize the configuration in `server/.env`:
   ```env
   FINSIGHT_DB_HOST=localhost
   FINSIGHT_DB_USER=root
   FINSIGHT_DB_PASSWORD=your_password
   FINSIGHT_DB_NAME=finsight
   JWT_SECRET_KEY=change-this-in-production
   API_PORT=8000
   ```
3. Start the Express server:
   ```bash
   npm run start
   # or dev mode with hot-reloading:
   npm run dev
   ```

### 3. Frontend Setup

1. Navigate to the `frontend/` directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite React client:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## Running Integration Tests

To verify that the Express server meets the exact REST API contract:

```bash
# Ensure the Express server is running, then:
node test_e2e.js
```

---

## Machine Learning Subprocess

To keep the application simple and interview-friendly, python is strictly isolated for ML calculations. Express.js spawns the Python subprocess:

1. **Prediction (`predict` mode)**: Calculates monthly spending trajectories over the past year, fits a regression model, and forecasts next month's total spending along with trend slope and confidence scores.
2. **Clustering (`cluster` mode)**: Profiles spending behaviors by grouping transactions into behavioral groups: "High Spends", "Everyday Essentials", and "Occasional" using transaction amounts, day of month, day of week, and weekend flags.
