import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.config import get_settings
from app.services.ai_verify import verify_receipt
from app.websocket import manager
from passlib.context import CryptContext

settings = get_settings()
router = APIRouter(prefix="/api/wallet", tags=["Wallet"])
pin_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/balance", response_model=schemas.WalletResponse)
def get_balance(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.post("/set-dob")
def set_dob(
    payload: schemas.DobRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Allow user to set DOB if not already set. Also auto-sets UPI PIN to DOB."""
    if current_user.dob_string:
        raise HTTPException(status_code=400, detail="Date of birth is already set.")
    if not payload.dob_string or len(payload.dob_string) != 6 or not payload.dob_string.isdigit():
        raise HTTPException(status_code=400, detail="DOB must be exactly 6 digits (DDMMYY).")

    current_user.dob_string = payload.dob_string
    db.commit()

    # Auto-set UPI PIN to DOB if PIN not already set
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if wallet and not wallet.upi_pin_hash:
        wallet.upi_pin_hash = pin_context.hash(payload.dob_string)
        wallet.pin_change_requested = False
        db.commit()

    return {"message": "Date of birth saved and default UPI PIN set to your DOB."}


@router.post("/setup-pin")
def setup_upi_pin(
    payload: schemas.SetPinRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    # If has existing PIN block it
    if wallet.upi_pin_hash is not None:
        raise HTTPException(
            status_code=403,
            detail="PIN already set. Please request a change if you forgot it."
        )

    wallet.upi_pin_hash = pin_context.hash(payload.pin)
    wallet.pin_change_requested = False
    db.commit()
    return {"message": "UPI PIN set successfully"}


@router.post("/request-pin-change")
async def request_pin_change(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    wallet.pin_change_requested = True
    db.commit()
    await manager.broadcast_event("PIN_CHANGE_REQUESTED", {
        "user_id": current_user.id,
        "name": current_user.name,
    })
    return {"message": "PIN change request sent to admin for approval"}


@router.post("/spend", response_model=schemas.TransactionResponse, status_code=201)
async def create_spend(
    payload: schemas.SpendRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    is_admin = current_user.role == models.UserRole.ADMIN
    is_over_limit = False

    if not is_admin:
        available = wallet.limit - wallet.spent_amount
        if payload.amount > available:
            # Over-limit: create as a special pending request instead of hard error
            is_over_limit = True

    txn = models.Transaction(
        company_id=current_user.company_id,
        wallet_id=wallet.id,
        amount=payload.amount,
        description=payload.description,
        category=payload.category,
        merchant_upi=payload.merchant_upi,
        status=models.TransactionStatus.PENDING,
        is_over_limit_request=is_over_limit,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    if is_over_limit:
        await manager.broadcast_event("OVER_LIMIT_REQUEST", {
            "txn_id": txn.id,
            "user_id": current_user.id,
            "name": current_user.name,
            "amount": payload.amount,
        })

    return txn


@router.post("/proof/{txn_id}", response_model=schemas.TransactionWithProof)
async def upload_proof(
    txn_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
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
    await manager.broadcast_event("TXN_UPDATED", {"txn_id": txn_id, "status": txn.status.value})
    return txn


@router.post("/skip-proof/{txn_id}", response_model=schemas.TransactionResponse)
async def skip_proof(
    txn_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Demo-only: skip AI verification and force-approve a transaction."""
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
        raise HTTPException(status_code=400, detail="Transaction is not pending")

    txn.status = models.TransactionStatus.APPROVED
    db.commit()
    db.refresh(txn)
    await manager.broadcast_event("TXN_UPDATED", {"txn_id": txn_id, "status": txn.status.value})
    return txn


@router.post("/pay/{txn_id}", response_model=schemas.TransactionResponse)
async def pay_with_pin(
    txn_id: int,
    payload: schemas.PayWithPinRequest,
    current_user: models.User = Depends(auth.get_current_user),
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

    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()

    if not wallet.upi_pin_hash:
        raise HTTPException(status_code=400, detail="UPI PIN not set. Please set your PIN first.")

    if not pin_context.verify(payload.upi_pin, wallet.upi_pin_hash):
        raise HTTPException(status_code=403, detail="Incorrect UPI PIN")

    # Deduct from company's central wallet
    admin_wallet = (
        db.query(models.Wallet)
        .join(models.User)
        .filter(models.User.company_id == current_user.company_id, models.User.role == models.UserRole.COMPANY)
        .first()
    )
    if not admin_wallet:
        raise HTTPException(status_code=500, detail="Company wallet not found")
    if admin_wallet.balance < txn.amount:
        raise HTTPException(status_code=400, detail="Insufficient company wallet balance")

    admin_wallet.balance -= txn.amount

    # Update employee spend tracking (not for admin's own spends)
    if current_user.role == models.UserRole.EMPLOYEE:
        wallet.spent_amount += txn.amount

    txn.status = models.TransactionStatus.PAID
    db.commit()
    db.refresh(txn)
    await manager.broadcast_event("TXN_PAID", {
        "txn_id": txn_id,
        "user_id": current_user.id,
        "amount": txn.amount,
    })
    return txn


@router.get("/my-transactions", response_model=List[schemas.TransactionWithProof])
def my_transactions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        return []
    return (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.proof))
        .filter(models.Transaction.wallet_id == wallet.id)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )
