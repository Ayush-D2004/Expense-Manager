# 💼 ExpenseManager: Smart SMB Expense Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://expense-manager-gules-mu.vercel.app/)
[![Backend Health](https://img.shields.io/badge/API_Status-Render-blue?style=for-the-badge&logo=render)](https://expense-manager-9igc.onrender.com/api/health)

ExpenseManager is a full-stack, multi-tenant digital wallet application designed for Small and Medium Businesses (SMBs). It allows Company Admins to fund a central wallet, distribute spend limits to employees, and track all expenses in real-time. 

Employees can log expenses, upload receipts for **Gemini AI Verification**, and securely make deductions using a personalized, hashed UPI PIN.

---

## 🚀 Key Features

*   **Multi-Tenant Architecture:** Self-contained company registrations. Admins manage their employees, transactions, and central wallet pool.
*   **Role-Based Access Control (RBAC):** Strict separation of concerns via JWT.
    *   **COMPANY/ADMIN**: Can load wallet funds, create employee accounts, set spending limits, and manually override flagged transactions.
    *   **EMPLOYEE**: Can request expenses, upload receipts, and authorize payments via UPI PIN.
*   **AI Receipt Verification:** Integrates **Google Gemini Vision AI** to automatically scan uploaded receipts, cross-checking the amount, vendor, and business-context before auto-approving or flagging the spend.
*   **Real-Time Synchronization:** Live updates powered by **FastAPI WebSockets**. Approvals, pin-change requests, and payment deductions reflect instantly across all active company dashboards without page reloads.

---

## 🛠️ Tech Stack

### Frontend
*   **React 18** (Vite)
*   **Redux Toolkit & RTK Query** (State management & API caching)
*   **Framer Motion** (Micro-animations)
*   **Recharts** (Admin analytics and visual spend tracking)

### Backend
*   **FastAPI** (High-performance async Python framework)
*   **SQLAlchemy & Alembic** (ORM & Migrations)
*   **JWT & Pass    lib** (Authentication & bcrypt password/PIN hashing)
*   **Razorpay** (Payment Gateway) 

### Database
*   **PostgreSQL** (Relational Database)
*   **Neon** (Serverless Database)

---

## 🛡️ Security & Scalability Notes
- **CORS Handling**: Backend is configured to only allow origins specified in the `FRONTEND_URL` environment variable.
- **Sleep Optimization**: Contains an automated `/api/health` polling Ping to seamlessly wake Serverless Cloud architectures (like Render free tiers).
- **Rate Limiting**: Integrated `slowapi` to prevent brute force attacks on the auth and UPI PIN verification endpoints. 

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Ayush-D2004/Expense-Manager.git
cd Expense-Manager
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Activate Virtual Env (Windows)
.venv\Scripts\activate
# Activate Virtual Env (Mac/Linux)
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/expense_db
SECRET_KEY=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:5173
```

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:8000
```

Run the frontend server:
```bash
npm run dev
```

Your app will be running at `http://localhost:5173`.

---
*Maintained and built by [Ayush Dhoble](https://github.com/Ayush-D2004)*
