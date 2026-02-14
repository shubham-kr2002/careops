"""
Contact Schemas - Pydantic models for contact API
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ContactBase(BaseModel):
    """Base contact schema."""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: str = "manual"
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    """Schema for creating a contact."""
    pass


class ContactCreatePublic(BaseModel):
    """Schema for public contact form (no login required)."""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    message: Optional[str] = None


class ContactUpdate(BaseModel):
    """Schema for updating a contact."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    segment: Optional[str] = None
    tags: Optional[List[str]] = None
    preferred_language: Optional[str] = None


class ContactResponse(ContactBase):
    """Schema for contact response."""
    id: UUID
    workspace_id: UUID
    segment: Optional[str] = None
    tags: Optional[List[str]] = None
    preferred_language: Optional[str] = "en"
    lifetime_value: Optional[float] = 0.0
    last_activity_at: Optional[datetime] = None
    total_bookings: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
