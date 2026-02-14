"""
Booking Schemas - Pydantic models for booking API
"""
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.models.booking import BookingStatus


class BookingTypeBase(BaseModel):
    """Base booking type schema."""
    name: str
    description: Optional[str] = None
    duration: int  # in minutes
    location: Optional[str] = None
    is_virtual: bool = False
    price: Optional[str] = None


class BookingTypeCreate(BookingTypeBase):
    """Schema for creating a booking type."""
    pass


class BookingTypeUpdate(BaseModel):
    """Schema for updating a booking type."""
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    location: Optional[str] = None
    is_virtual: Optional[bool] = None
    price: Optional[str] = None
    is_active: Optional[bool] = None


class BookingTypeResponse(BookingTypeBase):
    """Schema for booking type response."""
    id: UUID
    workspace_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AvailabilityBase(BaseModel):
    """Base availability schema."""
    day_of_week: int  # 0=Sunday, 6=Saturday
    start_time: str  # "HH:MM" format
    end_time: str  # "HH:MM" format
    buffer_minutes: Optional[int] = 0


class AvailabilityCreate(AvailabilityBase):
    """Schema for creating availability."""
    pass


class AvailabilityResponse(AvailabilityBase):
    """Schema for availability response."""
    id: UUID
    booking_type_id: UUID

    class Config:
        from_attributes = True


class BookingBase(BaseModel):
    """Base booking schema."""
    contact_id: UUID
    booking_type_id: UUID
    scheduled_at: datetime
    location: Optional[str] = None
    is_virtual: bool = False
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    """Schema for creating a booking."""
    pass


class BookingResponse(BookingBase):
    """Schema for booking response."""
    id: UUID
    workspace_id: UUID
    status: BookingStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
