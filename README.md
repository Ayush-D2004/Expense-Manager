# ExpenseManager

A full-stack Expense Management platform with AI-verified receipts and UPI payments.

## Architecture

```
ExpenseManager/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py          # App entry point
│   │   ├── config.py        # Settings from .env
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # DB models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + RBAC
│   │   ├── websocket.py     # WS connection manager
│   │   ├── routers/
│   │   │   ├── auth.py      # /api/auth/*
│   │   │   ├── admin.py     # /api/admin/*
│   │   │   └── wallet.py    # /api/wallet/*
│   │   └── services/
│   │       ├── ai_verify.py # Gemini Vision AI
│   │       └── payment.py   # Razorpay SDK
│   └── requirements.txt
└── frontend/         # React + Vite frontend
    └── src/
        ├── App.jsx
        ├── store/           # Redux store + slices
        ├── components/      # Layout, StatusBadge
        └── pages/           # All page components
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Copy and fill in your credentials
copy .env.example .env

# Run
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
# Edit .env with your API URL if needed
npm run dev
```

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `RAZORPAY_KEY_ID` | Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test secret |

## Roles

- **Admin**: Sets employee spending limits, views all transactions, manually approves flagged receipts, views analytics.
- **Employee**: Submits spend requests, uploads receipts for AI verification, pays via Razorpay UPI.

## Key Features

- 🔐 JWT Auth with RBAC
- 🧠 Gemini Vision AI receipt verification
- 💳 Razorpay UPI payments (deducted from central admin wallet)
- 🔄 Real-time updates via WebSockets
- 📊 Admin analytics: category pie chart + monthly trend line
- 🌗 Light/Dark theme toggle (light default)
