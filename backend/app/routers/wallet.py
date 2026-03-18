import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.config import get_settings
from app.services.ai_verify import verify_receipt
from app.services.payment import create_razorpay_order, verify_razorpay_payment

settings = get_settings()
router = APIRouter(prefix="/api/wallet", tags=["Wallet"])


@router.get("/balance", response_model=schemas.WalletResponse)
def get_balance(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.post("/spend", response_model=schemas.TransactionResponse, status_code=201)
def create_spend(
    payload: schemas.SpendRequest,
    current_user: models.User = Depends(auth.require_employee),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    available = wallet.limit - wallet.spent_amount
    if payload.amount > available:
        raise HTTPException(
            status_code=400,
            detail=f"Amount ₹{payload.amount} exceeds remaining limit ₹{available:.2f}",
        )

    txn = models.Transaction(
        wallet_id=wallet.id,
        amount=payload.amount,
        description=payload.description,
        category=payload.category,
        status=models.TransactionStatus.PENDING,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/proof/{txn_id}", response_model=schemas.TransactionWithProof)
async def upload_proof(
    txn_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.require_employee),
    db: Session = Depends(get_db),
):
    txn = (
        db.query(models.Transaction)
        .join(models.Wallet)
        .filter(
            models.Transaction.id == txn_id,
            models.Wallet.user_id == current_user.id,
        )
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status != models.TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Proof already submitted for this transaction")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"proof_{txn_id}_{file.filename}")
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    ai_result = await verify_receipt(file_path, txn.amount, txn.description)

    proof = models.ReceiptProof(
        transaction_id=txn_id,
        file_path=file_path,
        ai_legit=ai_result["legit"],
        ai_reason=ai_result["reason"],
        ai_extracted_amount=ai_result.get("extracted_amount"),
    )
    db.add(proof)

    if ai_result["legit"]:
        txn.status = models.TransactionStatus.APPROVED
    else:
        txn.status = models.TransactionStatus.FLAGGED

    db.commit()
    db.refresh(txn)
    return txn


@router.post("/pay/{txn_id}", response_model=schemas.PaymentInitResponse)
def initiate_payment(
    txn_id: int,
    current_user: models.User = Depends(auth.require_employee),
    db: Session = Depends(get_db),
):
    txn = (
        db.query(models.Transaction)
        .join(models.Wallet)
        .filter(
            models.Transaction.id == txn_id,
            models.Wallet.user_id == current_user.id,
        )
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status != models.TransactionStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Transaction must be APPROVED before paying")

    order = create_razorpay_order(int(txn.amount * 100), "INR", str(txn.id))
    txn.razorpay_order_id = order["id"]
    db.commit()

    return {
        "order_id": order["id"],
        "amount": int(txn.amount * 100),
        "currency": "INR",
        "razorpay_key": settings.RAZORPAY_KEY_ID,
    }


@router.post("/pay/{txn_id}/confirm")
def confirm_payment(
    txn_id: int,
    razorpay_payment_id: str,
    razorpay_signature: str,
    current_user: models.User = Depends(auth.require_employee),
    db: Session = Depends(get_db),
):
    txn = (
        db.query(models.Transaction)
        .join(models.Wallet)
        .filter(
            models.Transaction.id == txn_id,
            models.Wallet.user_id == current_user.id,
        )
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    is_valid = verify_razorpay_payment(txn.razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    wallet = db.query(models.Wallet).filter(models.Wallet.id == txn.wallet_id).first()
    wallet.spent_amount += txn.amount

    txn.status = models.TransactionStatus.PAID
    txn.razorpay_payment_id = razorpay_payment_id

    admin_wallet = db.query(models.Wallet).join(models.User).filter(
        models.User.role == models.UserRole.ADMIN
    ).first()
    if admin_wallet:
        admin_wallet.balance -= txn.amount

    db.commit()
    return {"message": "Payment confirmed", "transaction_id": txn.id}


@router.get("/my-transactions", response_model=List[schemas.TransactionWithProof])
def my_transactions(
    current_user: models.User = Depends(auth.require_employee),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        return []
    txns = (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.proof))
        .filter(models.Transaction.wallet_id == wallet.id)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )
    return txns
