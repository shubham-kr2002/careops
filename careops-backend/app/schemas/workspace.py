"""
Workspace Schemas - Pydantic models for workspace API
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class WorkspaceBase(BaseModel):
    """Base workspace schema."""
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    timezone: str = "UTC"
    contact_email: EmailStr


class WorkspaceCreate(WorkspaceBase):
    """Schema for creating a workspace."""
    pass


class WorkspaceUpdate(BaseModel):
    """Schema for updating a workspace."""
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class WorkspaceResponse(WorkspaceBase):
    """Schema for workspace response."""
    id: UUID
    slug: str
    status: str
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkspaceActivation(BaseModel):
    """Schema for workspace activation."""
    integrations: bool = False
    booking_types: bool = False
    staff: bool = False
