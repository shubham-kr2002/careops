from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    workspace_name: Optional[str] = None


class UserResponse(UserBase):
    """User response schema."""
    id: str
    role: str
    workspace_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours in seconds
    user: Optional["UserResponse"] = None


class TokenData(BaseModel):
    """Token data schema."""
    user_id: Optional[str] = None
    email: Optional[str] = None
    workspace_id: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class StaffPermissionResponse(BaseModel):
    """Staff permission response schema."""
    can_inbox: bool
    can_bookings: bool
    can_forms: bool
    can_inventory: bool
    
    class Config:
        from_attributes = True


class UserWithPermissionsResponse(UserResponse):
    """User response with permissions."""
    permissions: Optional[StaffPermissionResponse] = None
