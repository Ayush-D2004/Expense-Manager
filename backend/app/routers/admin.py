from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqlfunc
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.websocket import manager
from app.services.payment import create_razorpay_order, verify_razorpay_payment
from app.config import get_settings
import hmac

settings = get_settings()
router = APIRouter(prefix="/api/admin", tags=["Admin"])

def get_company_wallet(db: Session, company_id: int):
    return db.query(models.Wallet).join(models.User).filter(
        models.User.company_id == company_id,
        models.User.role == models.UserRole.COMPANY
    ).first()

@router.get("/wallets", response_model=List[schemas.WalletResponse])
def list_employee_wallets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    wallets = (
        db.query(models.Wallet)
        .join(models.User)
        .filter(
            models.User.company_id == current_user.company_id,
            models.User.role != models.UserRole.COMPANY
        )
        .options(joinedload(models.Wallet.user))
        .all()
    )
    return wallets


@router.post("/limit/{user_id}", response_model=schemas.WalletResponse)
async def set_employee_limit(
    user_id: int,
    payload: schemas.SetLimitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    employee = db.query(models.User).filter(
        models.User.id == user_id, 
        models.User.company_id == current_user.company_id,
        models.User.role == models.UserRole.EMPLOYEE
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Employee wallet not found")

    wallet.limit = payload.limit
    db.commit()
    db.refresh(wallet)
    await manager.broadcast_event("WALLET_UPDATED", {"user_id": user_id, "limit": payload.limit})
    return wallet


@router.post("/approve/{txn_id}", response_model=schemas.TransactionResponse)
async def admin_approve_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    txn = db.query(models.Transaction).filter(
        models.Transaction.id == txn_id,
        models.Transaction.company_id == current_user.company_id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status not in [models.TransactionStatus.PENDING, models.TransactionStatus.FLAGGED]:
        raise HTTPException(status_code=400, detail=f"Cannot approve a {txn.status} transaction")
    txn.status = models.TransactionStatus.APPROVED
    db.commit()
    db.refresh(txn)
    await manager.broadcast_event("TXN_UPDATED", {"txn_id": txn_id, "status": "APPROVED"})
    return txn


@router.post("/reject/{txn_id}", response_model=schemas.TransactionResponse)
async def admin_reject_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    txn = db.query(models.Transaction).filter(
        models.Transaction.id == txn_id,
        models.Transaction.company_id == current_user.company_id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status not in [models.TransactionStatus.PENDING, models.TransactionStatus.FLAGGED]:
        raise HTTPException(status_code=400, detail=f"Cannot reject a {txn.status} transaction")
    txn.status = models.TransactionStatus.REJECTED
    db.commit()
    db.refresh(txn)
    await manager.broadcast_event("TXN_UPDATED", {"txn_id": txn_id, "status": "REJECTED"})
    return txn


@router.post("/approve-pin-change/{user_id}")
async def approve_pin_change(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    wallet = db.query(models.Wallet).filter(
        models.Wallet.user_id == user_id,
        models.Wallet.company_id == current_user.company_id
    ).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    wallet.pin_change_requested = False
    wallet.upi_pin_hash = None  
    db.commit()
    await manager.broadcast_event("PIN_CHANGE_APPROVED", {"user_id": user_id})
    return {"message": "PIN change approved. Employee can now set a new PIN."}


@router.get("/txns", response_model=List[schemas.TransactionWithProof])
def list_all_transactions(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    query = db.query(models.Transaction).options(joinedload(models.Transaction.proof)).filter(
        models.Transaction.company_id == current_user.company_id
    )
    if status:
        try:
            query = query.filter(models.Transaction.status == models.TransactionStatus(status.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
    return query.order_by(models.Transaction.created_at.desc()).all()


@router.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    base_txn_query = db.query(models.Transaction).filter(models.Transaction.company_id == current_user.company_id)
    
    category_totals = (
        db.query(models.Transaction.category, sqlfunc.sum(models.Transaction.amount).label("total"))
        .filter(models.Transaction.status == models.TransactionStatus.PAID, models.Transaction.company_id == current_user.company_id)
        .group_by(models.Transaction.category)
        .all()
    )
    monthly_totals = (
        db.query(
            sqlfunc.to_char(models.Transaction.created_at, "YYYY-MM").label("month"),
            sqlfunc.sum(models.Transaction.amount).label("total"),
        )
        .filter(models.Transaction.status == models.TransactionStatus.PAID, models.Transaction.company_id == current_user.company_id)
        .group_by("month").order_by("month").all()
    )
    employee_spend = (
        db.query(
            models.User.name,
            sqlfunc.coalesce(sqlfunc.sum(
                models.Transaction.amount
            ).filter(models.Transaction.status == models.TransactionStatus.PAID), 0).label("total")
        )
        .join(models.Wallet, models.Wallet.user_id == models.User.id)
        .outerjoin(models.Transaction, models.Transaction.wallet_id == models.Wallet.id)
        .filter(models.User.role == models.UserRole.EMPLOYEE, models.User.company_id == current_user.company_id)
        .group_by(models.User.id, models.User.name)
        .all()
    )
    total_paid = base_txn_query.filter(models.Transaction.status == models.TransactionStatus.PAID).with_entities(sqlfunc.coalesce(sqlfunc.sum(models.Transaction.amount), 0)).scalar()
    
    pending_count = base_txn_query.filter(models.Transaction.status.in_([models.TransactionStatus.PENDING, models.TransactionStatus.FLAGGED])).count()
    
    employee_count = db.query(models.User).filter(
        models.User.role == models.UserRole.EMPLOYEE,
        models.User.company_id == current_user.company_id
    ).count()
    
    company_wallet = get_company_wallet(db, current_user.company_id)

    return {
        "by_category": [{"category": r[0] or "Uncategorized", "total": float(r[1])} for r in category_totals],
        "by_month": [{"month": r[0], "total": float(r[1])} for r in monthly_totals],
        "by_employee": [{"name": r[0], "total": float(r[1])} for r in employee_spend],
        "summary": {
            "total_paid": float(total_paid or 0),
            "pending_count": int(pending_count or 0),
            "employee_count": int(employee_count or 0),
            "wallet_balance": float(company_wallet.balance if company_wallet else 0),
        }
    }


@router.post("/topup")
def initiate_topup(
    payload: schemas.SetLimitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    amount_paise = int(payload.limit * 100)
    order = create_razorpay_order(amount_paise, "INR", f"topup_{current_user.company_id}")
    return {
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "razorpay_key": settings.RAZORPAY_KEY_ID,
    }


@router.post("/topup/confirm")
async def confirm_topup(
    order_id: str,
    payment_id: str,
    signature: str,
    amount: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    is_valid = verify_razorpay_payment(order_id, payment_id, signature)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    wallet = get_company_wallet(db, current_user.company_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Company wallet not found")

    wallet.balance += amount
    db.commit()
    await manager.broadcast_event("WALLET_UPDATED", {"user_id": wallet.user_id, "balance": wallet.balance})
    return {"message": f"₹{amount:.2f} added to company wallet", "new_balance": wallet.balance}
