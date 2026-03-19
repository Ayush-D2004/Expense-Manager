from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.CompanyResponse, status_code=status.HTTP_201_CREATED)
def register_company(company_data: schemas.CompanyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == company_data.owner_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    company = models.Company(name=company_data.name)
    db.add(company)
    db.flush()

    hashed = auth.get_password_hash(company_data.owner_password)
    user = models.User(
        company_id=company.id,
        name=company_data.owner_name,
        email=company_data.owner_email,
        hashed_password=hashed,
        role=models.UserRole.COMPANY,
        is_active=True
    )
    db.add(user)
    db.flush()

    wallet = models.Wallet(
        company_id=company.id,
        user_id=user.id,
        balance=0.0,
        spent_amount=0.0,
        limit=0.0,
    )
    db.add(wallet)
    db.commit()
    db.refresh(company)
    return company


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}
