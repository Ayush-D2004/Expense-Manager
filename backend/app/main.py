from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import Base, engine
from app.routers import auth, admin, wallet
from app.websocket import manager
from app import auth as auth_utils
from app.database import get_db
from app import models

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ExpenseManager API",
    description="Secure expense management platform for SMBs",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(wallet.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ExpenseManager API"}


@app.websocket("/ws/txns")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if not token:
        await websocket.close(code=1008)
        return
    try:
        from sqlalchemy.orm import Session
        from app.database import SessionLocal
        db = SessionLocal()
        user = auth_utils.get_current_user(token=token, db=db)
        db.close()
        await manager.connect(websocket, user.id)
        try:
            while True:
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, user.id)
    except Exception:
        await websocket.close(code=1008)
