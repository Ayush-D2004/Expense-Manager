from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/company", tags=["Company"])


@router.post("/employees", response_model=schemas.UserResponse)
def create_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_company)
):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Use DOB as initial password ('DDMMYY')
    hashed = auth.get_password_hash(payload.dob_string)
    user = models.User(
        company_id=current_user.company_id,
        name=payload.name,
        email=payload.email,
        hashed_password=hashed,
        role=models.UserRole.EMPLOYEE,
        dob_string=payload.dob_string,
        is_active=True
    )
    db.add(user)
    db.flush()

    from app.routers.wallet import pin_context
    wallet = models.Wallet(
        company_id=current_user.company_id,
        user_id=user.id,
        balance=0.0,
        spent_amount=0.0,
        limit=0.0,
        upi_pin_hash=pin_context.hash(payload.dob_string)
    )
    db.add(wallet)
    db.commit()
    db.refresh(user)
    return user


@router.get("/employees", response_model=List[schemas.UserResponse])
def get_employees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_company)
):
    return db.query(models.User).filter(
        models.User.company_id == current_user.company_id,
        models.User.id != current_user.id
    ).all()


@router.put("/employees/{user_id}/role", response_model=schemas.UserResponse)
def change_employee_role(
    user_id: int,
    payload: schemas.SetRoleRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_company)
):
    if payload.role == models.UserRole.COMPANY:
        raise HTTPException(status_code=400, detail="Cannot assign COMPANY role")
        
    user = db.query(models.User).filter(
        models.User.id == user_id, 
        models.User.company_id == current_user.company_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
