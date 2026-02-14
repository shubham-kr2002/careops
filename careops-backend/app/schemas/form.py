"""
Form Schemas - Pydantic models for form API
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.models.form import FormType, FormStatus


class FormBase(BaseModel):
    """Base form schema."""
    name: str
    type: FormType
    description: Optional[str] = None
    file_url: str
    required: bool = True


class FormCreate(FormBase):
    """Schema for creating a form."""
    pass


class FormUpdate(BaseModel):
    """Schema for updating a form."""
    name: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    required: Optional[bool] = None


class FormResponse(FormBase):
    """Schema for form response."""
    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookingFormResponse(BaseModel):
    """Schema for booking form response."""
    id: UUID
    booking_id: UUID
    form_id: UUID
    status: FormStatus
    file_url: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
