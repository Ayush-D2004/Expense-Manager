from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models import UserRole, TransactionStatus


class CompanyCreate(BaseModel):
    name: str
    owner_name: str
    owner_email: EmailStr
    owner_password: str

class CompanyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    dob_string: str # Format DDMMYY

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    company_id: int
    name: str
    email: str
    role: UserRole
    dob_string: Optional[str] = None
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
    company_id: int
    user_id: int
    balance: float
    spent_amount: float
    limit: float
    currency: str
    pin_change_requested: bool = False
    has_pin: bool = False
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class SetRoleRequest(BaseModel):
    role: UserRole

class SetLimitRequest(BaseModel):
    limit: float

class SetPinRequest(BaseModel):
    pin: str

class PayWithPinRequest(BaseModel):
    upi_pin: str

class DobRequest(BaseModel):
    dob_string: str

class SpendRequest(BaseModel):
    amount: float
    description: str
    category: Optional[str] = None
    merchant_upi: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    company_id: int
    wallet_id: int
    amount: float
    description: str
    category: Optional[str]
    status: TransactionStatus
    is_over_limit_request: bool = False
    merchant_upi: Optional[str] = None
    created_at: datetime
    updated_at: datetime

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

class TransactionWithProof(TransactionResponse):
    proof: Optional[ProofResponse] = None

