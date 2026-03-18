from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models import UserRole, TransactionStatus


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: float
    spent_amount: float
    limit: float
    currency: str
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class SetLimitRequest(BaseModel):
    limit: float


class SpendRequest(BaseModel):
    amount: float
    description: str
    category: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    wallet_id: int
    amount: float
    description: str
    category: Optional[str]
    status: TransactionStatus
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionWithProof(TransactionResponse):
    proof: Optional["ProofResponse"] = None

    class Config:
        from_attributes = True


class ProofResponse(BaseModel):
    id: int
    transaction_id: int
    file_path: str
    ai_legit: Optional[bool]
    ai_reason: Optional[str]
    ai_extracted_amount: Optional[float]

    class Config:
        from_attributes = True


class PaymentInitResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    razorpay_key: str
