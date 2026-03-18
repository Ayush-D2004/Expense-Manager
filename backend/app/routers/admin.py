from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/wallets", response_model=List[schemas.WalletResponse])
def list_employee_wallets(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    wallets = (
        db.query(models.Wallet)
        .join(models.User)
        .filter(models.User.role == models.UserRole.EMPLOYEE)
        .options(joinedload(models.Wallet.user))
        .all()
    )
    return wallets


@router.post("/limit/{user_id}", response_model=schemas.WalletResponse)
def set_employee_limit(
    user_id: int,
    payload: schemas.SetLimitRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    employee = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == models.UserRole.EMPLOYEE,
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Employee wallet not found")

    wallet.limit = payload.limit
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/approve/{txn_id}", response_model=schemas.TransactionResponse)
def admin_approve_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    txn = db.query(models.Transaction).filter(models.Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status not in [models.TransactionStatus.PENDING, models.TransactionStatus.FLAGGED]:
        raise HTTPException(status_code=400, detail=f"Cannot approve a {txn.status} transaction")
    txn.status = models.TransactionStatus.APPROVED
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/txns", response_model=List[schemas.TransactionWithProof])
def list_all_transactions(
    status: str = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    query = db.query(models.Transaction).options(joinedload(models.Transaction.proof))
    if status:
        try:
            status_filter = models.TransactionStatus(status.upper())
            query = query.filter(models.Transaction.status == status_filter)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
    return query.order_by(models.Transaction.created_at.desc()).all()


@router.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    from sqlalchemy import func

    category_totals = (
        db.query(models.Transaction.category, func.sum(models.Transaction.amount).label("total"))
        .filter(models.Transaction.status == models.TransactionStatus.PAID)
        .group_by(models.Transaction.category)
        .all()
    )
    monthly_totals = (
        db.query(
            func.to_char(models.Transaction.created_at, "YYYY-MM").label("month"),
            func.sum(models.Transaction.amount).label("total"),
        )
        .filter(models.Transaction.status == models.TransactionStatus.PAID)
        .group_by("month")
        .order_by("month")
        .all()
    )
    return {
        "by_category": [{"category": r[0] or "Uncategorized", "total": r[1]} for r in category_totals],
        "by_month": [{"month": r[0], "total": r[1]} for r in monthly_totals],
    }
