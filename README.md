# 🚀 FinSight Web App — Full-Stack Personal Finance & AI Insights

FinSight is a production-grade, premium full-stack personal finance application. It replaces the desktop Tkinter GUI with a modern, responsive single-page React app styled with **Tailwind CSS v4** and powered by a high-performance **FastAPI** backend with MySQL database integration.

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide Icons (Glassmorphic dark design)
- **State Management**: TanStack Query v5 (React Query)
- **Forms**: React Hook Form + Zod
- **Visuals**: Recharts (Interactive Area & Bar Chart visualizations)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL with PyMySQL
- **ML / Analytics**: NumPy + Scikit-Learn (Linear Regression for monthly spending prediction, K-Means Clustering for spending groups)
- **Reports**: ReportLab (Automatic PDF financial statement generator)

---

## 📂 Project Structure

```
finsightwebapp/
├── frontend/             # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── api/          # Axios HTTP client with JWT interceptors
│   │   ├── components/   # Protected/Auth routes, Layout, Sidebar
│   │   ├── contexts/     # AuthContext (persistent sessions)
│   │   ├── pages/        # Dashboard, Transactions, Categories, Budgets, Goals, Analytics, Settings
│   │   └── types/        # TypeScript interfaces matching backend models
│   ├── .env              # Frontend env configs
│   └── package.json
│
├── backend/              # FastAPI Server
│   ├── api/              # API router endpoints (main.py)
│   ├── database/         # MySQL schema connection routines
│   ├── services/         # Business logic (transactions, goals, budgets)
│   ├── utils/            # ML models, PDF generator, and recurring logs
│   ├── pyproject.toml    # Python dependencies
│   └── main.py           # Legacy desktop application entry point
```

---

## 🚀 Getting Started

### 1. Database Setup
Create a MySQL database named `finsight` (or match your `.env` settings):
```sql
CREATE DATABASE finsight;
```

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt  # Or: uv pip install -r requirements.txt
   ```
4. Copy the environment variables example:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your MySQL connection credentials.*
5. Run the FastAPI development server:
   ```bash
   uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   API Docs will be available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 💡 Core Features

1. **Dashboard & Summary**: Real-time stats showing Total Income, Total Expenses, Net Savings, and Savings Rate. Includes predictive insights on next month's spending.
2. **Interactive Transaction Ledger**: Search, filter, soft-delete, and restore operations. Dynamic category tags.
3. **Advanced Budgeting**: Set monthly budgets per category, showing visual progression bars and smart warning flags when approaching budget ceilings.
4. **Savings Goals**: Track targeted milestones, fund them, and receive achievements on completion.
5. **AI Analytics & K-Means Clusters**: Groups monthly transactions using K-Means clustering to reveal user spending habits.
6. **PDF Reports**: Export comprehensive financial summaries into beautifully formatted PDFs.
